from app.core.config import settings
from app.models.schemas import HealthResponse


async def get_health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name, environment=settings.environment)
