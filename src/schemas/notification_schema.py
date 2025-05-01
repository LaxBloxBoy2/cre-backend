from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class NotificationBase(BaseModel):
    """Base model for notification"""
    type: str = Field(..., description="Type of the notification")
    message: str = Field(..., description="Human-readable summary of the notification")
    is_read: bool = Field(False, description="Whether the notification has been read")

class NotificationCreate(NotificationBase):
    """Create model for notification"""
    user_id: str = Field(..., description="ID of the recipient user")
    org_id: str = Field(..., description="ID of the organization")
    actor_id: Optional[str] = Field(None, description="ID of the user who triggered the notification")
    deal_id: Optional[str] = Field(None, description="ID of the related deal")

class NotificationInDB(NotificationBase):
    """Database model for notification"""
    id: str
    user_id: str
    org_id: str
    actor_id: Optional[str] = None
    deal_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Notification(NotificationBase):
    """Response model for notification"""
    id: str
    deal_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationList(BaseModel):
    """Response model for list of notifications"""
    notifications: List[Notification]
    total: int
    unread_count: int
