from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

class DealAlertBase(BaseModel):
    """Base model for deal alerts"""
    alert_type: str = Field(..., description="The type of alert")
    message: str = Field(..., description="The alert message")
    severity: Literal["low", "medium", "high"] = Field("medium", description="Severity of the alert")

class DealAlertCreate(DealAlertBase):
    """Model for creating a deal alert"""
    deal_id: str = Field(..., description="The ID of the deal")

class DealAlert(DealAlertBase):
    """Model for a deal alert"""
    id: str = Field(..., description="The unique identifier for the alert")
    deal_id: str = Field(..., description="The ID of the deal")
    created_at: datetime = Field(..., description="The date and time when the alert was created")
    resolved: bool = Field(..., description="Whether the alert has been resolved")
    resolved_at: Optional[datetime] = Field(None, description="The date and time when the alert was resolved")
    resolved_by: Optional[str] = Field(None, description="The ID of the user who resolved the alert")

    class Config:
        from_attributes = True

class DealAlertList(BaseModel):
    """Model for a list of deal alerts"""
    alerts: List[DealAlert] = Field(..., description="List of alerts")
    total: int = Field(..., description="Total number of alerts")

class DealAlertResolve(BaseModel):
    """Model for resolving a deal alert"""
    resolution_note: Optional[str] = Field(None, description="Optional note about the resolution")

class DealMetricChange(BaseModel):
    """Model for a deal metric change"""
    metric: str = Field(..., description="The metric name")
    old_value: Optional[float] = Field(None, description="The old value")
    new_value: Optional[float] = Field(None, description="The new value")
    change: Optional[str] = Field(None, description="The change (e.g., '+0.3')")

class DealChanges(BaseModel):
    """Model for deal changes"""
    changes: List[DealMetricChange] = Field(..., description="List of metric changes")
