from fastapi import APIRouter, Request
from ..schemas.ai_chat_schema import AIChatRequest, AIChatResponse, ConversationalAIChatRequest, ConversationalAIChatResponse
from ..services.ai_chat_service import process_ai_chat, process_conversational_ai_chat
from ..utils.limiter import limiter

router = APIRouter()


@router.post("/ai-chat", response_model=AIChatResponse, tags=["AI Chat"], deprecated=True)
@limiter.limit("10/minute")
async def ai_chat_route(request: Request, ai_request: AIChatRequest):
    """
    Process an AI chat request about a commercial real estate deal (single message)

    This endpoint is deprecated. Please use the conversational version instead.

    Args:
        request: The AI chat request containing the message and context

    Returns:
        AI chat response with the AI's reply
    """
    return await process_ai_chat(ai_request)


@router.post("/ai-chat/v2", response_model=ConversationalAIChatResponse, tags=["AI Chat"])
@limiter.limit("10/minute")
async def conversational_ai_chat_route(request: Request, ai_request: ConversationalAIChatRequest):
    """
    Process a conversational AI chat request about a commercial real estate deal

    Args:
        request: The conversational AI chat request containing the message history and context

    Returns:
        Conversational AI chat response with the AI's reply
    """
    return await process_conversational_ai_chat(ai_request)
