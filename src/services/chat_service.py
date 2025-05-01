import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.chat import ChatMessage
from ..models.deal import Deal
from ..schemas.chat_schema import ChatMessageCreate, ChatMessageUpdate

def get_chat_message(db: Session, message_id: str):
    """
    Get a chat message by ID
    
    Args:
        db: Database session
        message_id: Chat message ID
        
    Returns:
        ChatMessage object
    """
    return db.query(ChatMessage).filter(ChatMessage.id == message_id).first()

def get_chat_messages(db: Session, deal_id: str, skip: int = 0, limit: int = 100):
    """
    Get all chat messages for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of ChatMessage objects
    """
    return db.query(ChatMessage).filter(ChatMessage.deal_id == deal_id).order_by(ChatMessage.timestamp).offset(skip).limit(limit).all()

def create_chat_message(db: Session, message: ChatMessageCreate, user_id: str):
    """
    Create a new chat message
    
    Args:
        db: Database session
        message: Chat message data
        user_id: User ID
        
    Returns:
        Created ChatMessage object
    """
    # Check if deal exists
    deal = db.query(Deal).filter(Deal.id == message.deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Create new chat message
    db_message = ChatMessage(
        id=str(uuid.uuid4()),
        deal_id=message.deal_id,
        user_id=user_id,
        role=message.role,
        content=message.content
    )
    
    # Add chat message to database
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

def update_chat_message(db: Session, message_id: str, message: ChatMessageUpdate, user_id: str = None):
    """
    Update a chat message
    
    Args:
        db: Database session
        message_id: Chat message ID
        message: Chat message data
        user_id: User ID (for authorization)
        
    Returns:
        Updated ChatMessage object
    """
    # Get chat message
    db_message = get_chat_message(db, message_id=message_id)
    if not db_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat message not found"
        )
    
    # Check if user is authorized to update this chat message
    if user_id and db_message.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this chat message"
        )
    
    # Update chat message data
    message_data = message.dict(exclude_unset=True)
    
    # Update chat message
    for key, value in message_data.items():
        setattr(db_message, key, value)
    
    # Commit changes
    db.commit()
    db.refresh(db_message)
    
    return db_message

def delete_chat_message(db: Session, message_id: str, user_id: str = None):
    """
    Delete a chat message
    
    Args:
        db: Database session
        message_id: Chat message ID
        user_id: User ID (for authorization)
        
    Returns:
        None
    """
    # Get chat message
    db_message = get_chat_message(db, message_id=message_id)
    if not db_message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat message not found"
        )
    
    # Check if user is authorized to delete this chat message
    if user_id and db_message.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this chat message"
        )
    
    # Delete chat message
    db.delete(db_message)
    db.commit()
    
    return None

def get_chat_conversation(db: Session, deal_id: str):
    """
    Get the entire chat conversation for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        List of ChatMessage objects
    """
    # Check if deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Get all chat messages for the deal
    messages = db.query(ChatMessage).filter(ChatMessage.deal_id == deal_id).order_by(ChatMessage.timestamp).all()
    
    return messages
