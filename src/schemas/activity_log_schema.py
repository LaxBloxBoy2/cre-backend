from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ActivityLogBase(BaseModel):
    """Base model for activity log"""
    action: str = Field(..., description="Action performed")
    message: str = Field(..., description="Human-readable summary of the action")

class ActivityLogCreate(ActivityLogBase):
    """Create model for activity log"""
    user_id: str = Field(..., description="ID of the user who performed the action")
    org_id: str = Field(..., description="ID of the organization")
    deal_id: Optional[str] = Field(None, description="ID of the related deal")

class ActivityLogInDB(ActivityLogBase):
    """Database model for activity log"""
    id: str
    user_id: str
    org_id: str
    deal_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserInfo(BaseModel):
    """User info for activity log response"""
    id: str
    name: str

    class Config:
        from_attributes = True

class ActivityLog(ActivityLogBase):
    """Response model for activity log"""
    id: str
    user: UserInfo
    deal_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityLogList(BaseModel):
    """Response model for list of activity logs"""
    logs: List[ActivityLog]
    total: int
