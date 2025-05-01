from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Literal
from datetime import datetime


class DealBase(BaseModel):
    """Base model for deal data"""
    project_name: str = Field(..., description="The name of the project")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property (e.g., office, retail, industrial, multifamily)")
    acquisition_price: float = Field(..., description="The acquisition price of the property in dollars")
    construction_cost: float = Field(..., description="The construction cost of the property in dollars")
    square_footage: float = Field(..., description="The total square footage of the property")
    projected_rent_per_sf: float = Field(..., description="The projected rent per square foot in dollars")
    vacancy_rate: float = Field(..., description="The vacancy rate as a percentage (e.g., 5 for 5%)")
    operating_expenses_per_sf: float = Field(..., description="The operating expenses per square foot in dollars")
    exit_cap_rate: float = Field(..., description="The exit capitalization rate as a percentage (e.g., 5.5)")
    status: Literal["Draft", "Under Review", "Approved", "Rejected"] = Field(default="Draft", description="The status of the deal")


class DealCreate(DealBase):
    """Model for creating a new deal"""
    underwriting_result: Optional[Dict] = Field(None, description="The underwriting result data")
    ai_memo: Optional[str] = Field(None, description="AI-generated investment memo")


class DealUpdate(BaseModel):
    """Model for updating an existing deal"""
    project_name: Optional[str] = Field(None, description="The name of the project")
    location: Optional[str] = Field(None, description="The location of the property")
    property_type: Optional[str] = Field(None, description="The type of property (e.g., office, retail, industrial, multifamily)")
    acquisition_price: Optional[float] = Field(None, description="The acquisition price of the property in dollars")
    construction_cost: Optional[float] = Field(None, description="The construction cost of the property in dollars")
    square_footage: Optional[float] = Field(None, description="The total square footage of the property")
    projected_rent_per_sf: Optional[float] = Field(None, description="The projected rent per square foot in dollars")
    vacancy_rate: Optional[float] = Field(None, description="The vacancy rate as a percentage (e.g., 5 for 5%)")
    operating_expenses_per_sf: Optional[float] = Field(None, description="The operating expenses per square foot in dollars")
    exit_cap_rate: Optional[float] = Field(None, description="The exit capitalization rate as a percentage (e.g., 5.5)")
    underwriting_result: Optional[Dict] = Field(None, description="The underwriting result data")
    ai_memo: Optional[str] = Field(None, description="AI-generated investment memo")
    status: Optional[Literal["Draft", "Under Review", "Approved", "Rejected"]] = Field(None, description="The status of the deal")


class Deal(DealBase):
    """Model for a deal with all fields"""
    id: str = Field(..., description="The unique identifier for the deal")
    underwriting_result: Optional[Dict] = Field(None, description="The underwriting result data")
    ai_memo: Optional[str] = Field(None, description="AI-generated investment memo")
    created_at: datetime = Field(..., description="The date and time when the deal was created")
    updated_at: datetime = Field(..., description="The date and time when the deal was last updated")
    
    class Config:
        """Pydantic configuration"""
        from_attributes = True  # For SQLAlchemy compatibility


class DealList(BaseModel):
    """Model for a list of deals"""
    deals: List[Deal] = Field(..., description="List of deals")
    total: int = Field(..., description="Total number of deals")
