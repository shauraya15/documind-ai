from app.models.schemas import KnowledgeStatusResponse
from app.services.documents import get_documents_snapshot


async def get_knowledge_status(user_id: int | None = None) -> KnowledgeStatusResponse:
    documents = get_documents_snapshot(user_id=user_id)
    indexed = sum(document.status in {"Ready", "Indexed"} for document in documents)
    processing = sum(document.status in {"Processing", "Indexing"} for document in documents)

    # Only average coverage over documents that have a real coverage value (>0).
    # Uploaded documents start at 0 because we have no chunk-count information
    # from Azure AI Search, so including them would produce a misleading result.
    documents_with_coverage = [d for d in documents if d.coverage > 0]
    if documents_with_coverage:
        coverage = round(sum(d.coverage for d in documents_with_coverage) / len(documents_with_coverage))
    else:
        # No real coverage data available — return 0 so the frontend can detect
        # the "unavailable" case (coverage == 0 but indexed_documents > 0).
        coverage = 0

    return KnowledgeStatusResponse(
        status="healthy" if indexed else "degraded" if documents else "empty",
        coverage=coverage,
        indexed_documents=indexed,
        processing_documents=processing,
        pipeline=[],
    )
