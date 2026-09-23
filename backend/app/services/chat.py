from app.integrations.foundry import FoundryAgentClient, FoundryIntegration
from app.models.schemas import ChatRequest, ChatResponse
from app.services.scope import DOCUMENTATION_SCOPE_MESSAGE, is_product_documentation_question

_foundry: FoundryIntegration | None = None


def get_foundry_integration() -> FoundryIntegration:
    global _foundry

    if _foundry is None:
        _foundry = FoundryAgentClient()

    return _foundry


async def answer_question(request: ChatRequest) -> ChatResponse:
    if not is_product_documentation_question(request.question):
        return ChatResponse(
            answer=DOCUMENTATION_SCOPE_MESSAGE,
            conversation_id="scope-rejected",
            grounded=False,
            citations=[],
        )

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
