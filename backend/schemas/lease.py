from pydantic import BaseModel, Field, UUID4
from typing import List, Optional
from datetime import datetime
from enum import Enum


class LeaseStatusEnum(str, Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    UPCOMING = "Upcoming"


class LeaseTypeEnum(str, Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    INDUSTRIAL = "Industrial"
    MULTIFAMILY = "Multifamily"
    MIXED_USE = "Mixed-Use"


class RenewalOptionBase(BaseModel):
    term: int = Field(..., description="Term in months")
    notice_required: int = Field(..., description="Notice required in months")
    rent_increase: float = Field(..., description="Percentage increase from current rent")


class RenewalOptionCreate(RenewalOptionBase):
    pass


class RenewalOptionResponse(RenewalOptionBase):
    id: UUID4
    lease_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class LeaseBase(BaseModel):
    lease_type: LeaseTypeEnum
    start_date: datetime
    end_date: datetime
    base_rent: float = Field(..., description="Monthly base rent")
    rent_escalation: float = Field(..., description="Annual percentage increase")
    security_deposit: float
    lease_area: float = Field(..., description="Square footage")
    notes: Optional[str] = None


class LeaseCreate(LeaseBase):
    asset_id: UUID4
    tenant_id: UUID4
    renewal_options: Optional[List[RenewalOptionCreate]] = None


class LeaseUpdate(BaseModel):
    lease_type: Optional[LeaseTypeEnum] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    base_rent: Optional[float] = None
    rent_escalation: Optional[float] = None
    security_deposit: Optional[float] = None
    lease_area: Optional[float] = None
    status: Optional[LeaseStatusEnum] = None
    notes: Optional[str] = None
    renewal_options: Optional[List[RenewalOptionCreate]] = None


class LeaseResponse(LeaseBase):
    id: UUID4
    asset_id: UUID4
    asset_name: str
    tenant_id: UUID4
    tenant_name: str
    status: LeaseStatusEnum
    created_at: datetime
    updated_at: datetime
    renewal_options: List[RenewalOptionResponse]

    class Config:
        orm_mode = True
