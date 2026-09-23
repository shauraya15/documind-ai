import logging

from fastapi import APIRouter, BackgroundTasks, Cookie, File, HTTPException, Response, UploadFile

from app.models.schemas import (
    AnalyticsOverviewResponse,
    AuthCredentials,
    ChatRequest,
    ChatResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationSummary,
    Document,
    DocumentCreateRequest,
    DocumentListResponse,
    HealthResponse,
    KnowledgeStatusResponse,
    SearchRequest,
    SearchResponse,
    UserResponse,
)
from app.services.analytics import get_analytics_overview
from app.integrations.foundry import FoundryConfigurationError, FoundryIntegrationError
from app.core.config import settings
from app.services.chat import answer_question
from app.services.conversations import get_conversation, list_conversations, save_conversation
from app.services.documents import create_document, create_uploaded_document, list_documents, update_document_status
from app.services.health import get_health
from app.services.knowledge import get_knowledge_status
from app.services.search import search_documents
from app.integrations.document_ingestion import DocumentIngestionError, get_document_ingestion
from app.services.auth import (
    SESSION_COOKIE_NAME,
    authenticate_user,
    create_session,
    create_user,
    delete_session,
    get_user_by_session,
)

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,  # 30 days session persistence
        path="/",
    )


@router.post("/auth/signup", response_model=UserResponse, status_code=201, tags=["auth"])
async def signup(credentials: AuthCredentials, response: Response) -> UserResponse:
    user = create_user(credentials.email, credentials.password)
    if user is None:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")
    _set_session_cookie(response, create_session(int(user["id"])))
    return UserResponse.model_validate(user)


@router.post("/auth/login", response_model=UserResponse, tags=["auth"])
async def login(credentials: AuthCredentials, response: Response) -> UserResponse:
    user = authenticate_user(credentials.email, credentials.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    _set_session_cookie(response, create_session(int(user["id"])))
    return UserResponse.model_validate(user)


@router.post("/auth/logout", status_code=204, tags=["auth"])
async def logout(response: Response, documind_session: str | None = Cookie(default=None)) -> Response:
    delete_session(documind_session)
    response.delete_cookie(SESSION_COOKIE_NAME, path="/")
    response.status_code = 204
    return response


@router.get("/auth/me", response_model=UserResponse, tags=["auth"])
async def me(documind_session: str | None = Cookie(default=None)) -> UserResponse:
    user = get_user_by_session(documind_session)
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return UserResponse.model_validate(user)


@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    return await get_health()


@router.post("/chat", response_model=ChatResponse, tags=["assistant"])
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = await answer_question(request)
        # Persist the Q&A so the history sidebar has real data
        try:
            citations_data = [c.model_dump() for c in result.citations]
            save_conversation(
                result.conversation_id,
                request.question,
                result.answer,
                citations_data,
                parent_id=request.conversation_id,
            )
        except Exception:
            logger.warning("Failed to save conversation history — non-fatal", exc_info=True)
        return result
    except FoundryConfigurationError as error:
        logger.error("Foundry configuration is incomplete: %s", error)
        raise HTTPException(status_code=503, detail="The documentation assistant is not configured.") from error
    except FoundryIntegrationError as error:
        logger.exception("Foundry integration failed")
        raise HTTPException(status_code=502, detail="The documentation assistant is unavailable.") from error
    except Exception as error:
        logger.exception("Unexpected chat failure")
        raise HTTPException(status_code=502, detail="The documentation assistant is unavailable.") from error


@router.get("/conversations", response_model=ConversationListResponse, tags=["assistant"])
async def conversations() -> ConversationListResponse:
    items = list_conversations(limit=50)
    return ConversationListResponse(
        total=len(items),
        conversations=[ConversationSummary(**item) for item in items],
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse, tags=["assistant"])
async def conversation_detail(conversation_id: str) -> ConversationDetailResponse:
    conv = get_conversation(conversation_id)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetailResponse.model_validate(conv)


@router.post("/search", response_model=SearchResponse, tags=["search"])
async def search(request: SearchRequest) -> SearchResponse:
    return await search_documents(request)


@router.get("/documents", response_model=DocumentListResponse, tags=["documents"])
async def documents() -> DocumentListResponse:
    return await list_documents()


@router.post("/documents", response_model=Document, status_code=201, tags=["documents"])
async def add_document(request: DocumentCreateRequest) -> Document:
    return await create_document(request)


@router.get("/documents/config", tags=["documents"])
async def documents_config() -> dict[str, object]:
    is_configured, missing = get_document_ingestion().check_configuration()
    return {
        "configured": is_configured,
        "missing_variables": missing,
    }


@router.post("/documents/upload", response_model=Document, status_code=201, tags=["documents"])
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    documind_session: str | None = Cookie(default=None),
) -> Document:
    filename = file.filename or ""
    content = await file.read()
    try:
        result = get_document_ingestion().upload(filename, content)
    except DocumentIngestionError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    user = get_user_by_session(documind_session)
    owner = str(user["email"]) if user and user.get("email") else "Azure Blob Storage"
    document = await create_uploaded_document(filename, result.blob_name, result.status, file_content=content, owner=owner)
    background_tasks.add_task(_finish_document_indexing, document.id)
    return document


def _finish_document_indexing(document_id: str) -> None:
    status = get_document_ingestion().wait_for_indexer()
    update_document_status(document_id, status)


@router.get("/knowledge/status", response_model=KnowledgeStatusResponse, tags=["knowledge"])
async def knowledge_status() -> KnowledgeStatusResponse:
    return await get_knowledge_status()


@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse, tags=["analytics"])
async def analytics_overview() -> AnalyticsOverviewResponse:
    return await get_analytics_overview()
