from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional

class PromoteThreshold(BaseModel):
    """Model for a promote threshold"""
    threshold: float = Field(..., description="The IRR threshold for this promote level")
    promote: float = Field(..., description="The promote percentage at this threshold")

class PromoteStructure(BaseModel):
    """Model for a promote structure"""
    thresholds: List[float] = Field(..., description="The IRR thresholds for promote levels")
    promotes: List[float] = Field(..., description="The promote percentages at each threshold")
    
    @field_validator('promotes')
    def validate_promotes_length(cls, v, values):
        """Validate that promotes and thresholds have the same length"""
        if 'thresholds' in values.data and len(v) != len(values.data['thresholds']):
            raise ValueError("Promotes and thresholds must have the same length")
        return v

class TermSheetRequest(BaseModel):
    """Request model for term sheet generation"""
    loan_amount: float = Field(..., description="The loan amount in dollars")
    interest_rate: float = Field(..., description="The interest rate as a percentage")
    term_years: int = Field(..., description="The loan term in years")
    amortization_years: int = Field(..., description="The amortization period in years")
    equity_investment: float = Field(..., description="The equity investment in dollars")
    preferred_return: float = Field(..., description="The preferred return as a percentage")
    promote_structure: PromoteStructure = Field(..., description="The promote structure")
    
    @field_validator('interest_rate', 'preferred_return')
    def validate_percentage(cls, v):
        """Validate that percentages are between 0 and 100"""
        if v < 0 or v > 100:
            raise ValueError("Percentage must be between 0 and 100")
        return v
    
    @field_validator('term_years', 'amortization_years')
    def validate_years(cls, v):
        """Validate that years are positive"""
        if v <= 0:
            raise ValueError("Years must be positive")
        return v
    
    @field_validator('loan_amount', 'equity_investment')
    def validate_amount(cls, v):
        """Validate that amounts are positive"""
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

class CashFlowYear(BaseModel):
    """Model for cash flow in a year"""
    year: int = Field(..., description="The year number")
    noi: float = Field(..., description="Net Operating Income for the year")
    debt_service: float = Field(..., description="Debt service for the year")
    cash_flow: float = Field(..., description="Cash flow for the year")
    preferred_return: float = Field(..., description="Preferred return for the year")
    excess_cash_flow: float = Field(..., description="Excess cash flow after preferred return")
    sponsor_promote: float = Field(..., description="Sponsor promote for the year")
    lp_distribution: float = Field(..., description="Limited Partner distribution for the year")
    gp_distribution: float = Field(..., description="General Partner distribution for the year")

class WaterfallTier(BaseModel):
    """Model for a waterfall tier"""
    tier: int = Field(..., description="The tier number")
    threshold: float = Field(..., description="The IRR threshold for this tier")
    promote: float = Field(..., description="The promote percentage at this threshold")
    lp_split: float = Field(..., description="The LP split at this threshold")
    gp_split: float = Field(..., description="The GP split at this threshold")

class TermSheetResponse(BaseModel):
    """Response model for term sheet generation"""
    total_project_cost: float = Field(..., description="The total project cost")
    loan_amount: float = Field(..., description="The loan amount")
    equity_investment: float = Field(..., description="The equity investment")
    loan_to_cost: float = Field(..., description="The loan-to-cost ratio")
    annual_debt_service: float = Field(..., description="The annual debt service")
    cash_flow_years: List[CashFlowYear] = Field(..., description="Cash flow projections by year")
    waterfall_tiers: List[WaterfallTier] = Field(..., description="Waterfall tiers")
    estimated_lp_irr: float = Field(..., description="Estimated LP IRR")
    equity_multiple: float = Field(..., description="Equity multiple")
    
class TermSummaryRequest(BaseModel):
    """Request model for term summary generation"""
    term_sheet: TermSheetResponse = Field(..., description="The term sheet data")
    deal_id: Optional[str] = Field(None, description="The ID of the deal")
    
class TermSummaryResponse(BaseModel):
    """Response model for term summary generation"""
    lp_irr: float = Field(..., description="The LP IRR")
    equity_multiple: float = Field(..., description="The equity multiple")
    summary: str = Field(..., description="The term summary")
