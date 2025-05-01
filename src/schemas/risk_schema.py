from pydantic import BaseModel, Field
from typing import List
from .underwriting_schema import UnderwritingRequest


class RiskRequest(UnderwritingRequest):
    """Request model for risk score calculation"""
    pass


class RiskResponse(BaseModel):
    """Response model for risk score calculation"""
    project_name: str = Field(..., description="The name of the project")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property")

    # Financial inputs
    acquisition_price: float = Field(..., description="The acquisition price of the property")
    construction_cost: float = Field(..., description="The construction cost of the property")
    square_footage: float = Field(..., description="The total square footage of the property")
    projected_rent_per_sf: float = Field(..., description="The projected rent per square foot")
    vacancy_rate: float = Field(..., description="The vacancy rate as a percentage")
    operating_expenses_per_sf: float = Field(..., description="The operating expenses per square foot")
    exit_cap_rate: float = Field(..., description="The exit capitalization rate as a percentage")

    # Calculated values
    net_operating_income: float = Field(..., description="The net operating income")
    project_cost: float = Field(..., description="The total project cost")
    estimated_exit_value: float = Field(..., description="The estimated exit value")
    development_margin: float = Field(..., description="The development margin as a percentage")

    # Risk assessment
    risk_score: str = Field(..., description="The risk score (Low, Medium, High)")
    flags: List[str] = Field(..., description="List of risk flags or concerns")
