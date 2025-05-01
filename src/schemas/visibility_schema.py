from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class VisibilityUpdate(BaseModel):
    """Model for updating deal visibility"""
    visibility: Literal["internal", "team", "lp_view"] = Field(
        ..., 
        description="Visibility level of the deal (internal, team, lp_view)"
    )
    shared_with: Optional[List[str]] = Field(
        None, 
        description="List of user IDs to share the deal with"
    )

class VisibilityResponse(BaseModel):
    """Response model for visibility update"""
    success: bool = Field(..., description="Whether the update was successful")
    message: str = Field(..., description="Message about the update")
    visibility: str = Field(..., description="Current visibility level")
    shared_with: List[str] = Field(..., description="List of user IDs the deal is shared with")
