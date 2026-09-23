from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings
from app.models.schemas import HealthResponse
from app.services.health import get_health
from app.services.auth import initialize_auth_database
from app.services.conversations import initialize_conversations_table
from app.services.documents import initialize_documents_table

initialize_auth_database()
initialize_documents_table()
initialize_conversations_table()

app = FastAPI(
    title=settings.app_name,
    description="Local API foundation for the DocuMind product documentation assistant.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def root_health() -> HealthResponse:
    return await get_health()
