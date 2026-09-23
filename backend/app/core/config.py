from dataclasses import dataclass, field
import os
from pathlib import Path

from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parents[2]


def _load_env_files() -> None:
    # Always apply backend/.env over empty or stale process environment values.
    load_dotenv(backend_dir / ".env", override=True, encoding="utf-8")
    load_dotenv(override=False)


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


_load_env_files()


@dataclass(frozen=True)
class Settings:
    app_name: str = field(default_factory=lambda: _env("DOCUMIND_APP_NAME", "DocuMind API") or "DocuMind API")
    environment: str = field(default_factory=lambda: _env("DOCUMIND_ENVIRONMENT", "local") or "local")
    allowed_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in (
                _env(
                    "DOCUMIND_ALLOWED_ORIGINS",
                    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000,http://127.0.0.1:3000",
                )
                or ""
            ).split(",")
            if origin.strip()
        )
    )
    foundry_project_endpoint: str | None = field(
        default_factory=lambda: (
            _env("AZURE_FOUNDRY_PROJECT_ENDPOINT")
            or _env("AZURE_FOUNDRY_PROJECT")
            or _env("AZURE_FOUNDRY_ENDPOINT")
        )
    )
    foundry_agent_name: str = field(default_factory=lambda: _env("AZURE_FOUNDRY_AGENT_NAME", "documindai") or "documindai")
    foundry_agent_id: str | None = field(default_factory=lambda: _env("AZURE_FOUNDRY_AGENT_ID"))
    search_endpoint: str | None = field(default_factory=lambda: _env("AZURE_SEARCH_ENDPOINT"))
    search_admin_key: str | None = field(default_factory=lambda: _env("AZURE_SEARCH_ADMIN_KEY"))
    search_index_name: str | None = field(default_factory=lambda: _env("AZURE_SEARCH_INDEX_NAME"))
    search_indexer_name: str | None = field(default_factory=lambda: _env("AZURE_SEARCH_INDEXER_NAME"))
    storage_connection_string: str | None = field(default_factory=lambda: _env("AZURE_STORAGE_CONNECTION_STRING"))
    storage_container_name: str = field(default_factory=lambda: _env("AZURE_STORAGE_CONTAINER_NAME", "product-docs") or "product-docs")
    auth_database_path: str = field(
        default_factory=lambda: _env(
            "DOCUMIND_AUTH_DATABASE_PATH",
            str(Path(__file__).resolve().parents[2] / "data" / "auth.db"),
        )
        or str(Path(__file__).resolve().parents[2] / "data" / "auth.db")
    )
    auth_cookie_secure: bool = field(default_factory=lambda: (_env("DOCUMIND_AUTH_COOKIE_SECURE", "false") or "false").lower() == "true")
    auth_cookie_samesite: str = field(default_factory=lambda: _env("DOCUMIND_AUTH_COOKIE_SAMESITE", "lax") or "lax")


settings = Settings()
