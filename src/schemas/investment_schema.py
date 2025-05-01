from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class InvestmentMemoRequest(BaseModel):
    """Request model for investment memo generation"""
    property_price: float = Field(..., description="The price of the property in dollars")
    rental_income: float = Field(..., description="The monthly rental income in dollars")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property (e.g., office, retail, industrial, multifamily)")
    cap_rate: Optional[float] = Field(None, description="The capitalization rate, if known")
    occupancy_rate: Optional[float] = Field(None, description="The current occupancy rate as a percentage")
    year_built: Optional[int] = Field(None, description="The year the property was built")
    square_footage: Optional[int] = Field(None, description="The total square footage of the property")
    additional_info: Optional[str] = Field(None, description="Any additional information about the property")
    tags: Optional[List[str]] = Field(None, description="Tags associated with the property")
    projected_irr: Optional[float] = Field(None, description="Projected Internal Rate of Return (IRR) in percentage")
    dscr: Optional[float] = Field(None, description="Debt Service Coverage Ratio")
    noi: Optional[float] = Field(None, description="Net Operating Income")
    red_flags: Optional[List[str]] = Field(None, description="Red flags identified for the property")
    exit_strategy: Optional[str] = Field(None, description="Exit strategy for the investment")
    style: Optional[Literal["brief", "detailed", "pitch"]] = Field("detailed", description="Style of the memo")
    format: Optional[Literal["markdown", "pdf"]] = Field("markdown", description="Format of the memo")


class InvestmentMemoResponse(BaseModel):
    """Response model for investment memo generation"""
    memo: str = Field(..., description="The generated investment memo")
    format: str = Field("markdown", description="Format of the memo")
    style: str = Field("detailed", description="Style of the memo")
