"""
Schemas for debt sizing requests and responses.
"""
from pydantic import BaseModel, Field, validator


class DebtSizingRequest(BaseModel):
    """Request model for debt sizing calculation"""
    noi: float = Field(..., description="Net Operating Income (annual)")
    interest_rate: float = Field(..., description="Annual interest rate as a percentage (e.g., 6.5 for 6.5%)")
    dscr_target: float = Field(..., description="Debt Service Coverage Ratio target (e.g., 1.25)")
    amortization_years: int = Field(..., description="Amortization period in years")
    
    @validator('interest_rate')
    def validate_interest_rate(cls, v):
        """Validate that interest rate is positive and reasonable"""
        if v <= 0:
            raise ValueError("Interest rate must be positive")
        if v > 20:
            raise ValueError("Interest rate seems too high (>20%)")
        return v
    
    @validator('dscr_target')
    def validate_dscr_target(cls, v):
        """Validate that DSCR target is positive and reasonable"""
        if v < 1.0:
            raise ValueError("DSCR target must be at least 1.0")
        if v > 3.0:
            raise ValueError("DSCR target seems too high (>3.0)")
        return v
    
    @validator('amortization_years')
    def validate_amortization_years(cls, v):
        """Validate that amortization period is positive and reasonable"""
        if v <= 0:
            raise ValueError("Amortization period must be positive")
        if v > 40:
            raise ValueError("Amortization period seems too long (>40 years)")
        return v


class DebtSizingResponse(BaseModel):
    """Response model for debt sizing calculation"""
    max_loan_amount: float = Field(..., description="Maximum loan amount")
    monthly_payment: float = Field(..., description="Monthly debt payment")
    annual_payment: float = Field(..., description="Annual debt payment")
