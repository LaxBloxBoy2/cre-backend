from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.chat_schema import ChatMessageCreate, ChatMessage, ChatConversation, ChatRequest, ChatResponse, ChatMessageResponse
from ..schemas.ai_chat_schema import AIChatRequest, AIChatResponse, ConversationalAIChatRequest, ConversationalAIChatResponse, AskAnythingRequest, AskAnythingResponse, AISummaryResponse, DealFAQResponse
from ..services.auth_service_db import get_current_active_user
from ..services.chat_service import create_chat_message, get_chat_conversation
from ..services.ai_chat_service import process_ai_chat, process_conversational_ai_chat
from ..services.enhanced_ai_chat_service import process_enhanced_ai_chat
from ..services.ai_chat_service_v3 import process_ai_chat_v3
from ..services.ask_anything_service import process_ask_anything
from ..services.ai_summary_service import generate_ai_summary, generate_deal_faq
from ..services.deal_service import get_deal
from ..services.activity_log_service import log_action
from ..services.security_service import validate_deal_access

router = APIRouter()

@router.post("/ai-chat", response_model=AIChatResponse, tags=["AI Chat"], deprecated=True)
async def ai_chat_route(request: AIChatRequest):
    """
    Process an AI chat request about a commercial real estate deal (single message)

    This endpoint is deprecated. Please use the conversational version instead.

    Args:
        request: The AI chat request containing the message and context

    Returns:
        AI chat response with the AI's reply
    """
    return await process_ai_chat(request)

@router.post("/ai-chat/v2", response_model=ConversationalAIChatResponse, tags=["AI Chat"])
async def conversational_ai_chat_route(request: ConversationalAIChatRequest):
    """
    Process a conversational AI chat request about a commercial real estate deal

    Args:
        request: The conversational AI chat request containing the message history and context

    Returns:
        Conversational AI chat response with the AI's reply
    """
    return await process_conversational_ai_chat(request)


@router.post("/ai-chat/v3", tags=["AI Chat"])
async def enhanced_ai_chat_route(
    request: ConversationalAIChatRequest,
    debug: bool = Query(False, description="Enable debug mode to return additional information")
):
    """
    Process an enhanced AI chat request about a commercial real estate deal

    This version uses intent detection and structured reasoning to provide better responses.

    Args:
        request: The conversational AI chat request containing the message history and context
        debug: Enable debug mode to return additional information

    Returns:
        Enhanced AI chat response with the AI's reply and optional debug information
    """
    response = await process_ai_chat_v3(request, debug_mode=debug)
    return response

@router.post("/deals/db/{deal_id}/chat", response_model=ChatMessageResponse, tags=["AI Chat"])
async def deal_chat_route(
    deal_id: str,
    request: ChatRequest,
    debug: bool = Query(False, description="Enable debug mode to return additional information"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Process an AI chat request for a specific deal and save the conversation

    Args:
        deal_id: The ID of the deal
        request: The chat request containing the message and optional context
        debug: Enable debug mode to return additional information
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Chat response with the AI's reply

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Check if deal exists and user is authorized
    deal = get_deal(db, deal_id=deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Check if user is authorized to access this deal
    if current_user.role == "Admin":
        # Admin can access any deal
        pass
    elif current_user.org_id and deal.org_id == current_user.org_id:
        # User is in the same organization as the deal
        pass
    elif deal.user_id == current_user.id:
        # User is the owner of the deal
        pass
    else:
        # User is not authorized to access this deal
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this deal"
        )

    # Get the user message from the request
    user_message = ""
    if request.messages and request.messages[-1].role == "user":
        user_message = request.messages[-1].content
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user message found in the request"
        )

    # Process the enhanced AI chat request
    response = await process_enhanced_ai_chat(
        db=db,
        deal_id=deal_id,
        user_id=current_user.id,
        message=user_message,
        debug_mode=debug
    )

    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="ai_chat",
            message=f"{current_user.name} used AI chat for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Return the response
    return response

@router.get("/deals/db/{deal_id}/chat", response_model=ChatConversation, tags=["AI Chat"])
async def get_deal_chat_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the chat conversation for a deal

    Args:
        deal_id: The ID of the deal
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Chat conversation

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Check if deal exists and user is authorized
    deal = get_deal(db, deal_id=deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Check if user is authorized to access this deal
    if current_user.role == "Admin":
        # Admin can access any deal
        pass
    elif current_user.org_id and deal.org_id == current_user.org_id:
        # User is in the same organization as the deal
        pass
    elif deal.user_id == current_user.id:
        # User is the owner of the deal
        pass
    else:
        # User is not authorized to access this deal
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this deal"
        )

    # Get chat conversation
    db_messages = get_chat_conversation(db, deal_id=deal_id)

    # Convert database messages to schema messages
    messages = []
    for msg in db_messages:
        messages.append({
            "id": msg.id,
            "deal_id": msg.deal_id,
            "user_id": msg.user_id,
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp
        })

    return ChatConversation(messages=messages, deal_id=deal_id)


@router.post("/deals/{deal_id}/ask", tags=["AI Chat"])
async def ask_anything_about_deal(
    deal_id: str,
    request: AskAnythingRequest,
    debug: bool = Query(False, description="Enable debug mode to return additional information"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Ask anything about a deal in natural language

    This endpoint allows end-users to ask anything about a deal in natural language.
    It loads the full deal context, including financials, risks, leases, memos, and deal tags,
    and provides a comprehensive response based on the available information.

    Args:
        deal_id: The ID of the deal
        request: The Ask Anything request containing the user's question
        debug: Enable debug mode to return additional information
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Ask Anything response with the AI's reply and context used

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    # Process the Ask Anything request
    response = await process_ask_anything(
        db=db,
        deal_id=deal_id,
        user_id=current_user.id,
        request=request,
        debug_mode=debug
    )

    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="ask_anything",
            message=f"{current_user.name} used Ask Anything for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Return the response
    return response


@router.get("/deals/{deal_id}/ai-summary", response_model=AISummaryResponse, tags=["AI Chat"])
async def get_ai_summary(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a 3-line AI summary for a deal

    This endpoint generates a concise 3-line summary of a deal, focusing on:
    1. Property overview (location, type, size)
    2. Financial highlights (price, rent, IRR)
    3. Investment recommendation or key risk/opportunity

    Args:
        deal_id: The ID of the deal
        current_user: The current user (from the token)
        db: Database session

    Returns:
        AI summary response with the 3-line summary

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    # Generate the AI summary
    response = await generate_ai_summary(
        db=db,
        deal_id=deal_id,
        user_id=current_user.id
    )

    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="ai_summary",
            message=f"{current_user.name} generated AI summary for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Return the response
    return response


@router.get("/deals/{deal_id}/faq", response_model=DealFAQResponse, tags=["AI Chat"])
async def get_deal_faq(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get FAQ-style answers for a deal

    This endpoint generates FAQ-style answers for common questions about a deal, including:
    1. What are the key financial metrics for this deal?
    2. What are the main risks associated with this investment?
    3. How does this deal compare to market benchmarks?
    4. What is the expected return on investment?
    5. What are the key factors that could improve the performance of this deal?

    Args:
        deal_id: The ID of the deal
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Deal FAQ response with question-answer pairs

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    # Generate the deal FAQ
    response = await generate_deal_faq(
        db=db,
        deal_id=deal_id,
        user_id=current_user.id
    )

    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="deal_faq",
            message=f"{current_user.name} generated FAQ for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Return the response
    return response
