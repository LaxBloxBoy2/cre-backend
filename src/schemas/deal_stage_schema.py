from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DealStageBase(BaseModel):
    """Base model for deal stage"""
    name: str = Field(..., description="Name of the stage")
    order: int = Field(..., description="Order of the stage in the deal lifecycle")
    target_days: int = Field(..., description="Target number of days for this stage")

class DealStageCreate(DealStageBase):
    """Model for creating a new deal stage"""
    pass

class DealStageUpdate(BaseModel):
    """Model for updating a deal stage"""
    name: Optional[str] = Field(None, description="Name of the stage")
    order: Optional[int] = Field(None, description="Order of the stage in the deal lifecycle")
    target_days: Optional[int] = Field(None, description="Target number of days for this stage")
    completed: Optional[bool] = Field(None, description="Whether the stage is completed")

class DealStage(DealStageBase):
    """Model for a deal stage"""
    id: str = Field(..., description="The unique identifier for the stage")
    deal_id: str = Field(..., description="The ID of the deal")
    completed: bool = Field(False, description="Whether the stage is completed")
    completed_at: Optional[datetime] = Field(None, description="When the stage was completed")
    
    class Config:
        from_attributes = True

class DealStageList(BaseModel):
    """Model for a list of deal stages"""
    stages: List[DealStage]
    total: int
