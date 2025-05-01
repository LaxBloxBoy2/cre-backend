from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import date

class DashboardSummary(BaseModel):
    """Model for dashboard summary"""
    total_deals: int = Field(..., description="Total number of deals")
    average_cap_rate: float = Field(..., description="Average cap rate across all deals")
    average_development_margin: float = Field(..., description="Average development margin across all deals")
    total_project_cost: float = Field(..., description="Total project cost across all deals")
    average_rent_per_sf: float = Field(..., description="Average rent per square foot across all deals")
    average_irr: float = Field(0.0, description="Average IRR across all deals")
    average_dscr: float = Field(0.0, description="Average DSCR across all deals")
    deals_by_status: Dict[str, int] = Field(..., description="Count of deals by status")
    deals_by_type: Dict[str, int] = Field(..., description="Count of deals by property type")

class IRRTrendPoint(BaseModel):
    """Model for a point in the IRR trend"""
    date: date
    irr: float

class IRRTrend(BaseModel):
    """Model for IRR trend"""
    data: List[IRRTrendPoint]
    period: str = Field(..., description="Period of the trend (3m, 6m, 1y)")

class DealLifecycleStage(BaseModel):
    """Model for a stage in the deal lifecycle"""
    name: str
    avg_days: float
    target_days: int

class DealLifecycle(BaseModel):
    """Model for deal lifecycle"""
    stages: List[DealLifecycleStage]
    total_avg_days: float
    total_target_days: int

class RiskScore(BaseModel):
    """Model for risk score"""
    score: int = Field(..., description="Risk score (0-100)")
    factors: List[str] = Field(..., description="Factors contributing to the risk score")

class DealStatusBreakdown(BaseModel):
    """Model for deal status breakdown"""
    statuses: Dict[str, int] = Field(..., description="Number of deals by status")

class QuickActionCounts(BaseModel):
    """Model for quick action counts"""
    pending_tasks: int = Field(..., description="Number of pending tasks")
    unresolved_alerts: int = Field(..., description="Number of unresolved alerts")
    upcoming_deadlines: int = Field(..., description="Number of upcoming deadlines")
