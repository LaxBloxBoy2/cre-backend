from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.chat_schema import ChatMessageRequest, ChatMessageResponse, ChatMessage
from ..services.auth_service_db import get_current_active_user
from ..services.chat_memory_service import process_chat_message, get_deal_chat_history
from ..services.deal_service import get_deal
from ..services.security_service import validate_deal_access

router = APIRouter()

@router.post("/deals/{deal_id}/chat", response_model=ChatMessageResponse, tags=["Chat"])
async def create_chat_message(
    deal_id: str,
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new chat message for a deal

    Args:
        deal_id: Deal ID
        request: Chat message request
        current_user: Current user
        db: Database session

    Returns:
        Chat message response
    """
    # Get deal and validate access
    deal = validate_deal_access(db, deal_id, current_user)

    # Process chat message
    response = await process_chat_message(db, current_user.id, deal_id, request, deal)

    return response

@router.get("/deals/{deal_id}/chat", response_model=List[ChatMessage], tags=["Chat"])
async def get_chat_messages(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all chat messages for a deal

    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session

    Returns:
        List of chat messages
    """
    # Get deal and validate access
    deal = validate_deal_access(db, deal_id, current_user)

    # Get chat messages
    messages = get_deal_chat_history(db, deal_id=deal_id)

    # Convert database messages to schema messages
    result = []
    for msg in messages:
        result.append({
            "id": msg.id,
            "deal_id": msg.deal_id,
            "user_id": msg.user_id,
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.timestamp
        })

    return result
