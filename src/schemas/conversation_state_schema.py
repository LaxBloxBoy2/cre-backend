from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ConversationStateBase(BaseModel):
    """Base model for conversation state data"""
    current_task: Optional[str] = None
    step: Optional[str] = None
    inputs: Optional[Dict[str, Any]] = None

class ConversationStateCreate(ConversationStateBase):
    """Model for creating a new conversation state"""
    deal_id: str
    user_id: str

class ConversationStateUpdate(ConversationStateBase):
    """Model for updating an existing conversation state"""
    pass

class ConversationStateInDB(ConversationStateBase):
    """Model for a conversation state in the database"""
    id: str
    deal_id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConversationState(ConversationStateInDB):
    """Model for a conversation state with all fields"""
    pass

class ConversationStateWithDeal(ConversationState):
    """Model for a conversation state with its deal"""
    deal: Any

    class Config:
        from_attributes = True

class ConversationStateWithUser(ConversationState):
    """Model for a conversation state with its user"""
    user: Any

    class Config:
        from_attributes = True

class ConversationStateWithDealAndUser(ConversationStateWithDeal, ConversationStateWithUser):
    """Model for a conversation state with its deal and user"""
    class Config:
        from_attributes = True
