from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime
import uuid

from .property_attributes_schema import PropertyAttributes


# Keep the original models for backward compatibility
class DealRequest(BaseModel):
    """Request model for deal calculations"""
    property_price: float
    rental_income: float


class ROIResponse(BaseModel):
    """Response model for ROI calculation"""
    roi: float


# New models for database integration
class DealBase(BaseModel):
    """Base model for deal data"""
    project_name: str
    location: str
    property_type: str
    acquisition_price: float
    construction_cost: float
    square_footage: float
    projected_rent_per_sf: float
    vacancy_rate: float
    operating_expenses_per_sf: float
    exit_cap_rate: float


class DealCreate(BaseModel):
    """Model for creating a new deal"""
    # Required fields
    project_name: str
    location: str
    property_type: str
    acquisition_price: float
    construction_cost: float
    square_footage: float
    projected_rent_per_sf: float
    vacancy_rate: float
    operating_expenses_per_sf: float
    exit_cap_rate: float

    # Optional fields
    underwriting_result: Optional[Dict[str, Any]] = None
    ai_memo: Optional[str] = None
    status: str = "draft"
    tags: Optional[List[str]] = []
    projected_irr: Optional[float] = None
    dscr: Optional[float] = None
    visibility: Literal["internal", "team", "lp_view"] = "internal"
    shared_with: Optional[List[str]] = []

    @field_validator('status')
    def validate_status(cls, v):
        """Validate that status is one of the allowed values"""
        allowed_statuses = ["draft", "in_review", "approved", "rejected", "archived"]
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of {allowed_statuses}")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "project_name": "Office Building Downtown",
                "location": "123 Main St, New York, NY",
                "property_type": "Office",
                "acquisition_price": 5000000.0,
                "construction_cost": 1000000.0,
                "square_footage": 25000.0,
                "projected_rent_per_sf": 45.0,
                "vacancy_rate": 0.05,
                "operating_expenses_per_sf": 15.0,
                "exit_cap_rate": 0.06,
                "status": "draft",
                "tags": ["office", "value-add", "urban"],
                "projected_irr": 15.5,
                "dscr": 1.25
            }
        }
    }


class DealUpdate(BaseModel):
    """Model for updating an existing deal"""
    project_name: Optional[str] = None
    location: Optional[str] = None
    property_type: Optional[str] = None
    acquisition_price: Optional[float] = None
    construction_cost: Optional[float] = None
    square_footage: Optional[float] = None
    projected_rent_per_sf: Optional[float] = None
    vacancy_rate: Optional[float] = None
    operating_expenses_per_sf: Optional[float] = None
    exit_cap_rate: Optional[float] = None
    underwriting_result: Optional[Dict[str, Any]] = None
    ai_memo: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    projected_irr: Optional[float] = None
    dscr: Optional[float] = None
    visibility: Optional[Literal["internal", "team", "lp_view"]] = None
    shared_with: Optional[List[str]] = None

    @field_validator('status')
    def validate_status(cls, v):
        """Validate that status is one of the allowed values"""
        if v is not None:
            allowed_statuses = ["draft", "in_review", "approved", "rejected", "archived"]
            if v not in allowed_statuses:
                raise ValueError(f"Status must be one of {allowed_statuses}")
        return v


class DealInDB(DealBase):
    """Model for a deal in the database"""
    id: str
    user_id: str
    underwriting_result: Optional[Dict[str, Any]] = None
    ai_memo: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
    status_changed_at: Optional[datetime] = None
    status_changed_by: Optional[str] = None
    admin_comment: Optional[str] = None
    tags: Optional[List[str]] = []
    projected_irr: Optional[float] = None
    dscr: Optional[float] = None
    visibility: str = "internal"
    shared_with: Optional[List[str]] = []

    # Additional fields for deal details
    acquisition_date: Optional[datetime] = None
    investment_strategy: Optional[str] = None  # Core, Core Plus, Value Add, Opportunistic
    seller_propensity: Optional[str] = None  # Low, Medium, High
    seller_propensity_reason: Optional[str] = None
    owner_name: Optional[str] = None
    owner_type: Optional[str] = None  # Individual, Corporation, REIT, etc.
    owner_acquisition_date: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


class Deal(DealInDB):
    """Model for a deal with all fields"""
    can_edit: bool = False
    property_attributes: Optional[PropertyAttributes] = None


class DealWithUser(Deal):
    """Model for a deal with its user"""
    user: Any

    model_config = {
        "from_attributes": True
    }


class DealWithChat(Deal):
    """Model for a deal with its chat messages"""
    chat_messages: List[Any] = []

    model_config = {
        "from_attributes": True
    }


class DealWithUserAndChat(DealWithUser):
    """Model for a deal with its user and chat messages"""
    chat_messages: List[Any] = []

    model_config = {
        "from_attributes": True
    }


class DealList(BaseModel):
    """Model for a list of deals"""
    deals: List[Deal]
    total: int
