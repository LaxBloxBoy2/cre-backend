from pydantic import BaseModel, Field
from typing import Optional

class PortfolioSummaryResponse(BaseModel):
    """Response model for portfolio summary"""
    total_deals: int = Field(..., description="Total number of deals in the portfolio")
    average_cap_rate: float = Field(..., description="Average cap rate across all deals")
    average_development_margin: float = Field(..., description="Average development margin across all deals")
    total_gross_exit_value: float = Field(..., description="Total gross exit value across all deals")
    average_project_cost: float = Field(..., description="Average project cost across all deals")
    average_irr: float = Field(0.0, description="Average IRR across all deals")
    average_dscr: float = Field(0.0, description="Average DSCR across all deals")
    user_id: Optional[str] = Field(None, description="User ID if filtered by user")
