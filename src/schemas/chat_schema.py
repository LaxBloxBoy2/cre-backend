from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
import uuid

class ChatMessageBase(BaseModel):
    """Base model for chat message data"""
    role: Literal["user", "assistant"]
    content: str

class ChatMessageCreate(ChatMessageBase):
    """Model for creating a new chat message"""
    deal_id: str

class ChatMessageUpdate(BaseModel):
    """Model for updating an existing chat message"""
    role: Optional[Literal["user", "assistant"]] = None
    content: Optional[str] = None

class ChatMessageInDB(ChatMessageBase):
    """Model for a chat message in the database"""
    id: str
    deal_id: str
    user_id: str
    timestamp: datetime

    class Config:
        orm_mode = True

class ChatMessage(ChatMessageInDB):
    """Model for a chat message with all fields"""
    pass

class ChatMessageWithDeal(ChatMessage):
    """Model for a chat message with its deal"""
    deal: Any

    class Config:
        from_attributes = True

class ChatMessageWithUser(ChatMessage):
    """Model for a chat message with its user"""
    user: Any

    class Config:
        from_attributes = True

class ChatMessageWithDealAndUser(ChatMessageWithDeal, ChatMessageWithUser):
    """Model for a chat message with its deal and user"""
    class Config:
        from_attributes = True

class ChatConversation(BaseModel):
    """Model for a chat conversation"""
    messages: List[ChatMessage]
    deal_id: str

class ChatRequest(BaseModel):
    """Request model for AI chat"""
    messages: List[ChatMessageBase]
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    """Response model for AI chat"""
    reply: str

class ChatMessageRequest(BaseModel):
    """Request model for a single chat message"""
    message: str

class ChatMessageResponse(BaseModel):
    """Response model for a chat message"""
    reply: str
    deal_id: str
    timestamp: datetime
    action_triggered: Optional[str] = None
    status: Optional[str] = None
    report_url: Optional[str] = None
    debug: Optional[Dict[str, Any]] = None
