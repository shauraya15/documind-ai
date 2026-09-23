import asyncio
import tempfile
from pathlib import Path
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.core.config import settings
from app.integrations.foundry import FoundryAgentClient, FoundryConfigurationError
from app.main import app
from app.services.documents import initialize_documents_table, reset_documents
from app.services.auth import initialize_auth_database, reset_auth_database
from app.services.conversations import initialize_conversations_table, reset_conversations
from app.services.chat import answer_question
from app.integrations.foundry import FoundryAnswer
from app.integrations.document_ingestion import UploadResult
from app.models.schemas import ChatRequest

# Redirect tests to an isolated test database so running tests NEVER wipes real users, sessions, or docs
_test_db_path = str(Path(tempfile.gettempdir()) / "documind_test.db")
object.__setattr__(settings, "auth_database_path", _test_db_path)
initialize_auth_database()
initialize_documents_table()
initialize_conversations_table()

client = TestClient(app)


def setup_function() -> None:
    reset_documents()
    reset_auth_database()
    reset_conversations()
    client.cookies.clear()


def test_health_endpoint() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "DocuMind API"


def test_signup_creates_user_and_sets_http_only_session_cookie() -> None:
    response = client.post("/api/auth/signup", json={"email": "new@example.com", "password": "correct horse battery"})

    assert response.status_code == 201
    assert response.json()["email"] == "new@example.com"
    assert "documind_session=" in response.headers["set-cookie"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert client.get("/api/auth/me").status_code == 200


def test_duplicate_signup_is_rejected() -> None:
    payload = {"email": "duplicate@example.com", "password": "correct horse battery"}
    assert client.post("/api/auth/signup", json=payload).status_code == 201

    response = client.post("/api/auth/signup", json=payload)

    assert response.status_code == 409


def test_login_accepts_correct_password() -> None:
    payload = {"email": "login@example.com", "password": "correct horse battery"}
    client.post("/api/auth/signup", json=payload)
    client.post("/api/auth/logout")

    response = client.post("/api/auth/login", json=payload)

    assert response.status_code == 200
    assert response.json()["email"] == payload["email"]


def test_login_rejects_incorrect_password() -> None:
    client.post("/api/auth/signup", json={"email": "wrong@example.com", "password": "correct horse battery"})
    client.post("/api/auth/logout")

    response = client.post("/api/auth/login", json={"email": "wrong@example.com", "password": "incorrect password"})

    assert response.status_code == 401


def test_auth_me_requires_and_restores_authenticated_session() -> None:
    assert client.get("/api/auth/me").status_code == 401
    client.post("/api/auth/signup", json={"email": "me@example.com", "password": "correct horse battery"})

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_logout_invalidates_session() -> None:
    client.post("/api/auth/signup", json={"email": "logout@example.com", "password": "correct horse battery"})
    assert client.get("/api/auth/me").status_code == 200

    response = client.post("/api/auth/logout")

    assert response.status_code == 204
    assert client.get("/api/auth/me").status_code == 401


def test_non_chat_endpoints() -> None:
    responses = [
        client.post("/api/search", json={"query": "OAuth"}),
        client.get("/api/documents"),
        client.get("/api/knowledge/status"),
        client.get("/api/analytics/overview"),
    ]

    assert all(response.status_code == 200 for response in responses)
    assert responses[0].json()["results"] == []
    assert responses[1].json()["documents"] == []
    assert responses[2].json()["status"] == "empty"
    assert responses[3].json()["metrics"]


def test_root_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_chat_rejects_blank_questions() -> None:
    response = client.post("/api/chat", json={"question": "   "})

    assert response.status_code == 422




def test_chat_allows_in_scope_question_to_reach_foundry(monkeypatch) -> None:
    class FakeFoundry:
        async def answer(self, question, **kwargs):
            return FoundryAnswer("OAuth documentation answer", "conversation-1", True, [])

    monkeypatch.setattr("app.services.chat.get_foundry_integration", lambda: FakeFoundry())

    response = client.post("/api/chat", json={"question": "How do I configure OAuth?"})

    assert response.status_code == 200
    assert response.json()["answer"] == "OAuth documentation answer"


def test_upload_document_triggers_existing_ingestion_boundary(monkeypatch) -> None:
    class FakeIngestion:
        def upload(self, filename, content):
            assert filename == "oauth-guide.md"
            assert content == b"# OAuth"
            return UploadResult("oauth-guide.md", "Processing")

        def wait_for_indexer(self):
            return "Indexed"

    monkeypatch.setattr("app.api.routes.get_document_ingestion", lambda: FakeIngestion())

    response = client.post("/api/documents/upload", files={"file": ("oauth-guide.md", b"# OAuth", "text/markdown")})

    assert response.status_code == 201
    assert response.json()["title"] == "oauth-guide.md"
    assert response.json()["status"] == "Processing"


def test_upload_document_rejects_unsupported_extension(monkeypatch) -> None:
    response = client.post("/api/documents/upload", files={"file": ("weather.csv", b"data", "text/csv")})

    assert response.status_code == 400


def test_chat_returns_safe_configuration_error(monkeypatch) -> None:
    def raise_configuration_error():
        raise FoundryConfigurationError("missing configuration")

    monkeypatch.setattr("app.services.chat.get_foundry_integration", raise_configuration_error)

    response = client.post("/api/chat", json={"question": "What authentication methods are supported?"})

    assert response.status_code == 503
    assert response.json() == {"detail": "The documentation assistant is not configured."}


def test_create_document_returns_frontend_compatible_shape() -> None:
    response = client.post(
        "/api/documents",
        json={
            "title": "OAuth Guide",
            "product": "Atlas API",
            "version": "3.2",
            "type": "Authentication",
            "summary": "Local test document",
        },
    )

    assert response.status_code == 201
    document = response.json()
    assert document["title"] == "OAuth Guide"
    assert document["status"] == "Processing"
    assert document["coverage"] == 0


def test_foundry_integration_maps_mocked_agent_response(monkeypatch) -> None:
    class FakeResponses:
        def __init__(self) -> None:
            self.request = None

        def create(self, **request):
            self.request = request
            return SimpleNamespace(
                id="resp-foundry-123",
                output_text="Grounded answer from the existing agent.",
                output=[
                    SimpleNamespace(
                        type="message",
                        content=[
                            SimpleNamespace(
                                annotations=[
                                    SimpleNamespace(
                                        type="url_citation",
                                        title="OAuth configuration guide",
                                        url="https://example.test/oauth",
                                    ),
                                    SimpleNamespace(
                                        type="url_citation",
                                        title="OAuth configuration guide",
                                        url="https://example.test/oauth",
                                    ),
                                ]
                            )
                        ],
                    )
                ],
            )

    fake_responses = FakeResponses()

    class FakeProjectClient:
        def get_openai_client(self):
            return SimpleNamespace(responses=fake_responses)

    monkeypatch.setattr(
        "app.integrations.foundry.settings",
        SimpleNamespace(
            foundry_project_endpoint="https://example.services.ai.azure.com/api/projects/documind",
            foundry_agent_name="documindai",
        ),
    )

    client = FoundryAgentClient(
        project_client_factory=lambda endpoint, credential: FakeProjectClient(),
        credential_factory=lambda: object(),
    )
    result = asyncio.run(client.answer("How do I configure OAuth?", conversation_id="resp-previous"))

    assert result.answer == "Grounded answer from the existing agent."
    assert result.conversation_id == "resp-foundry-123"
    assert result.grounded is True
    assert result.citations[0].document == "OAuth configuration guide"
    assert result.citations[0].page == "https://example.test/oauth"
    assert len(result.citations) == 1
    assert fake_responses.request["previous_response_id"] == "resp-previous"
    assert fake_responses.request["extra_body"]["agent_reference"] == {
        "name": "documindai",
        "type": "agent_reference",
    }


def test_documents_config_endpoint() -> None:
    response = client.get("/api/documents/config")
    assert response.status_code == 200
    data = response.json()
    assert "configured" in data
    assert "missing_variables" in data
    assert isinstance(data["missing_variables"], list)


def test_upload_document_supports_pdf_and_updates_status(monkeypatch) -> None:
    class FakeIngestion:
        def upload(self, filename, content):
            assert filename == "manual.pdf"
            assert content == b"%PDF-1.4"
            return UploadResult("manual.pdf", "Processing")

        def wait_for_indexer(self):
            return "Indexed"

    monkeypatch.setattr("app.api.routes.get_document_ingestion", lambda: FakeIngestion())

    response = client.post("/api/documents/upload", files={"file": ("manual.pdf", b"%PDF-1.4", "application/pdf")})
    assert response.status_code == 201
    doc = response.json()
    assert doc["title"] == "manual.pdf"
    assert doc["status"] == "Processing"

    from app.api.routes import _finish_document_indexing
    _finish_document_indexing(doc["id"])

    list_resp = client.get("/api/documents")
    assert list_resp.status_code == 200
    docs = list_resp.json()["documents"]
    updated_doc = next(d for d in docs if d["id"] == doc["id"])
    assert updated_doc["status"] == "Indexed"


def test_upload_document_fails_when_configuration_missing(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.integrations.document_ingestion.settings",
        SimpleNamespace(
            storage_connection_string=None,
            search_indexer_name=None,
            search_endpoint=None,
            search_admin_key=None,
        ),
    )

    response = client.post("/api/documents/upload", files={"file": ("notes.txt", b"notes", "text/plain")})
    assert response.status_code == 400
    assert "Document ingestion is not configured" in response.json()["detail"]
    assert "AZURE_STORAGE_CONNECTION_STRING" in response.json()["detail"]
