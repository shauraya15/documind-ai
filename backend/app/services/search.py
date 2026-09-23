from app.models.schemas import SearchRequest, SearchResponse, SearchResult
from app.services.documents import get_documents_snapshot


async def search_documents(request: SearchRequest) -> SearchResponse:
    terms = [term.lower() for term in request.query.split() if term.strip()]
    results: list[SearchResult] = []
    for document in get_documents_snapshot():
        if request.product and document.product != request.product:
            continue
        if request.version and document.version != request.version:
            continue
        searchable = " ".join([document.title, document.summary, *document.sections]).lower()
        matched_terms = [term for term in terms if term in searchable]
        if not matched_terms:
            continue
        relevance = min(100, 50 + len(matched_terms) * 10)
        results.append(
            SearchResult(
                id=document.id,
                document=document.title,
                section=document.sections[0] if document.sections else "Document overview",
                product=document.product,
                version=document.version,
                page="document",
                confidence=relevance,
                excerpt=document.summary,
                title=document.title,
                relevance=relevance,
                matched_terms=matched_terms,
            )
        )
    results.sort(key=lambda result: result.relevance, reverse=True)
    return SearchResponse(query=request.query, total=len(results), results=results[: request.limit])
