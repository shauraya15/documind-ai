from app.models.schemas import AnalyticsMetric, AnalyticsOverviewResponse
from app.services.conversations import get_conversations_count
from app.services.documents import get_documents_snapshot


async def get_analytics_overview(user_id: int | None = None) -> AnalyticsOverviewResponse:
    documents = get_documents_snapshot(user_id=user_id)
    ready = sum(document.status in {"Ready", "Indexed"} for document in documents)
    question_count = get_conversations_count(user_id=user_id)
    topics: dict[str, int] = {}
    for document in documents:
        topics[document.type] = topics.get(document.type, 0) + 1
    return AnalyticsOverviewResponse(
        metrics=[
            AnalyticsMetric(
                label="Documents tracked", value=len(documents), detail=f"{ready} documents are ready for retrieval."
            ),
            AnalyticsMetric(label="Ready documents", value=ready, detail="Documents available to the knowledge workflow."),
            AnalyticsMetric(label="Questions asked", value=question_count, detail="Total questions asked across all conversations."),
        ],
        topics=[{"label": label, "value": value, "delta": "tracked"} for label, value in topics.items()],
        unanswered=[],
    )
