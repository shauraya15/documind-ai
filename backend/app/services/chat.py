from app.integrations.foundry import FoundryAgentClient, FoundryIntegration
from app.models.schemas import ChatRequest, ChatResponse

_foundry: FoundryIntegration | None = None


def get_foundry_integration() -> FoundryIntegration:
    global _foundry

    if _foundry is None:
        _foundry = FoundryAgentClient()

    return _foundry


async def answer_question(request: ChatRequest) -> ChatResponse:
    integration = get_foundry_integration()
    result = await integration.answer(
        request.question,
        conversation_id=request.conversation_id,
        product=request.product,
        version=request.version,
    )

    return ChatResponse(
        answer=result.answer,
        conversation_id=result.conversation_id,
        grounded=result.grounded,
        citations=result.citations,
    )

