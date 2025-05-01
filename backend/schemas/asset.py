from pydantic import BaseModel, Field, UUID4
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AssetTypeEnum(str, Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    INDUSTRIAL = "Industrial"
    MULTIFAMILY = "Multifamily"
    MIXED_USE = "Mixed-Use"


class AssetBase(BaseModel):
    name: str
    asset_type: AssetTypeEnum
    address: str
    city: str
    state: str
    zip_code: str
    total_area: float = Field(..., description="Square footage")
    year_built: Optional[int] = None
    floors: Optional[int] = None
    units: Optional[int] = None
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    annual_taxes: Optional[float] = None
    annual_insurance: Optional[float] = None
    custom_fields: Optional[Dict[str, Any]] = None


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[AssetTypeEnum] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    total_area: Optional[float] = None
    year_built: Optional[int] = None
    floors: Optional[int] = None
    units: Optional[int] = None
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    annual_taxes: Optional[float] = None
    annual_insurance: Optional[float] = None
    custom_fields: Optional[Dict[str, Any]] = None


class AssetResponse(AssetBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    leases_count: int

    class Config:
        orm_mode = True
