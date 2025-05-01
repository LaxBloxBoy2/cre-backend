from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LPAssignmentBase(BaseModel):
    """Base model for LP assignment data"""
    lp_id: str = Field(..., description="The ID of the LP user")
    deal_id: str = Field(..., description="The ID of the deal")

class LPAssignmentCreate(LPAssignmentBase):
    """Model for creating a new LP assignment"""
    pass

class LPAssignment(LPAssignmentBase):
    """Model for an LP assignment"""
    id: str = Field(..., description="The unique identifier for the assignment")
    assigned_by: str = Field(..., description="The ID of the user who assigned the LP")
    assigned_at: datetime = Field(..., description="The date and time when the LP was assigned")
    
    class Config:
        from_attributes = True

class LPAssignmentList(BaseModel):
    """Model for a list of LP assignments"""
    assignments: List[LPAssignment] = Field(..., description="List of LP assignments")
    total: int = Field(..., description="Total number of LP assignments")

class LPDealSummary(BaseModel):
    """Model for an LP deal summary"""
    id: str = Field(..., description="The ID of the deal")
    project_name: str = Field(..., description="The name of the project")
    location: str = Field(..., description="The location of the project")
    property_type: str = Field(..., description="The type of property")
    acquisition_price: float = Field(..., description="The acquisition price")
    projected_irr: Optional[float] = Field(None, description="The projected IRR")
    equity_multiple: Optional[float] = Field(None, description="The equity multiple")
    
    class Config:
        from_attributes = True

class LPDealList(BaseModel):
    """Model for a list of LP deals"""
    deals: List[LPDealSummary] = Field(..., description="List of deals")
    total: int = Field(..., description="Total number of deals")

class LPComment(BaseModel):
    """Model for an LP comment"""
    message: str = Field(..., description="The comment message")
    is_question: bool = Field(False, description="Whether the comment is a question")
