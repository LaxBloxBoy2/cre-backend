from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..user_schema import UserBase

class UserAdminResponse(UserBase):
    """Response model for user in admin view"""
    id: str
    created_at: datetime
    deal_count: int
    last_login: Optional[datetime] = None

class UserListResponse(BaseModel):
    """Response model for list of users"""
    users: List[UserAdminResponse]
    total: int

class DealAdminResponse(BaseModel):
    """Response model for deal in admin view"""
    id: str
    project_name: str
    user_id: str
    user_name: str
    status: str
    location: str
    property_type: str
    created_at: datetime

class DealListResponse(BaseModel):
    """Response model for list of deals"""
    deals: List[DealAdminResponse]
    total: int

class DealStatusUpdate(BaseModel):
    """Request model for updating deal status"""
    comment: Optional[str] = None

class DealStatusUpdateResponse(BaseModel):
    """Response model for deal status update"""
    id: str
    status: str
    updated_by: str
    updated_at: datetime
    comment: Optional[str] = None

class AdminDashboardSummary(BaseModel):
    """Response model for admin dashboard summary"""
    total_users: int
    total_deals: int
    approved_deals: int
    rejected_deals: int
    active_users_last_7d: int
