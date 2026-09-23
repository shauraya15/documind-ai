from typing import Protocol

from app.models.schemas import SearchResult


class AzureSearchIntegration(Protocol):
    """Future boundary for Azure AI Search hybrid/vector retrieval."""

    async def search(self, query: str, *, limit: int = 10) -> list[SearchResult]:
        ...


class PlaceholderAzureSearchIntegration:
    async def search(self, query: str, *, limit: int = 10) -> list[SearchResult]:
        raise NotImplementedError("Azure AI Search integration is not configured yet")
