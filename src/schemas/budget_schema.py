from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class BudgetLineItem(BaseModel):
    """Model for a budget line item"""
    category: str = Field(..., description="The category of the line item")
    amount: float = Field(..., description="The amount of the line item")
    
class BudgetAnalyzerRequest(BaseModel):
    """Request model for budget analyzer"""
    line_items: List[BudgetLineItem] = Field(..., description="The line items to analyze")
    
class CategoryBreakdown(BaseModel):
    """Model for category breakdown"""
    category: str = Field(..., description="The category name")
    amount: float = Field(..., description="The total amount for this category")
    percentage: float = Field(..., description="The percentage of the total budget")
    
class BudgetAnalyzerResponse(BaseModel):
    """Response model for budget analyzer"""
    total_cost: float = Field(..., description="The total cost of the budget")
    category_breakdown: List[CategoryBreakdown] = Field(..., description="The breakdown of the budget by category")
    red_flags: List[str] = Field(default_factory=list, description="Red flags identified in the budget")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for improving the budget")
