from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

class CommentBase(BaseModel):
    """Base model for comment"""
    content: str = Field(..., description="Content of the comment", min_length=1, max_length=5000)
    type: str = Field("comment", description="Type of the comment (comment or note)")

    @field_validator('content')
    def sanitize_content(cls, v):
        # Basic sanitization to prevent XSS
        import html
        sanitized = html.escape(v)
        return sanitized

class CommentCreate(CommentBase):
    """Create model for comment"""
    pass

class CommentInDB(CommentBase):
    """Database model for comment"""
    id: str
    deal_id: str
    user_id: str
    org_id: str
    created_at: datetime
    tagged_user_ids: Optional[List[str]] = None

    class Config:
        from_attributes = True

class UserInfo(BaseModel):
    """User info for comment response"""
    id: str
    name: str

    class Config:
        from_attributes = True

class Comment(CommentBase):
    """Response model for comment"""
    id: str
    deal_id: str
    user: UserInfo
    created_at: datetime
    tagged_user_ids: Optional[List[str]] = None

    class Config:
        from_attributes = True

class CommentList(BaseModel):
    """Response model for list of comments"""
    comments: List[Comment]
    total: int
