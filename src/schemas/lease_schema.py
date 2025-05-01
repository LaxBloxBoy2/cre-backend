from pydantic import BaseModel, Field, UUID4, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class LeaseAnalysisRequest(BaseModel):
    """Request model for lease analysis"""
    lease_text: str = Field(..., description="The lease text to analyze")

class LeaseAnalysisResponse(BaseModel):
    """Response model for lease analysis"""
    base_rent: Optional[str] = Field(None, description="The base rent extracted from the lease")
    lease_term: Optional[str] = Field(None, description="The lease term extracted from the lease")
    escalations: Optional[str] = Field(None, description="Rent escalations extracted from the lease")
    tenant_name: Optional[str] = Field(None, description="Tenant name extracted from the lease")
    renewals: List[str] = Field(default_factory=list, description="Renewal options extracted from the lease")
    break_clauses: List[str] = Field(default_factory=list, description="Break clauses extracted from the lease")
    red_flags: List[str] = Field(default_factory=list, description="Red flag clauses extracted from the lease")
    summary: Optional[str] = Field(None, description="Summary of the lease terms")

class UploadedFileBase(BaseModel):
    """Base model for uploaded file data"""
    filename: str
    file_type: str

class UploadedFileCreate(UploadedFileBase):
    """Model for creating a new uploaded file"""
    deal_id: str
    file_path: str

class UploadedFileInDB(UploadedFileBase):
    """Model for an uploaded file in the database"""
    id: str
    deal_id: str
    user_id: str
    file_path: str
    upload_timestamp: datetime

    class Config:
        from_attributes = True

class UploadedFile(UploadedFileInDB):
    """Model for an uploaded file with all fields"""
    pass

class LeaseAnalysisBase(BaseModel):
    """Base model for lease analysis data"""
    base_rent: Optional[str] = None
    lease_term: Optional[str] = None
    escalations: Optional[str] = None
    tenant_name: Optional[str] = None
    renewals: Optional[List[str]] = None
    break_clauses: Optional[List[str]] = None
    red_flags: Optional[List[str]] = None
    summary: Optional[str] = None

class LeaseAnalysisCreate(LeaseAnalysisBase):
    """Model for creating a new lease analysis"""
    file_id: str
    deal_id: str
    raw_text: str

class LeaseAnalysisInDB(LeaseAnalysisBase):
    """Model for a lease analysis in the database"""
    id: str
    file_id: str
    deal_id: str
    raw_text: str
    analysis_timestamp: datetime

    class Config:
        from_attributes = True

class LeaseAnalysis(LeaseAnalysisInDB):
    """Model for a lease analysis with all fields"""
    pass

class LeaseUploadResponse(BaseModel):
    """Response model for lease upload"""
    status: str
    file: UploadedFile
    analysis: Optional[LeaseAnalysisBase] = None


# Lease Management Schemas
class LeaseStatus(str, Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    UPCOMING = "Upcoming"


class LeaseType(str, Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    INDUSTRIAL = "Industrial"
    MULTIFAMILY = "Multifamily"
    MIXED_USE = "Mixed-Use"


class PaymentHistory(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


# Custom Field Schemas
class CustomFieldBase(BaseModel):
    name: str
    value: Optional[str] = None
    field_type: str = "text"
    options: Optional[List[str]] = None


class CustomFieldCreate(CustomFieldBase):
    tenant_id: UUID4


class CustomFieldUpdate(CustomFieldBase):
    pass


class CustomFieldInDB(CustomFieldBase):
    id: UUID4
    tenant_id: UUID4
    created_at: datetime

    class Config:
        orm_mode = True


class CustomField(CustomFieldInDB):
    pass


# Tenant Schemas
class TenantBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    industry: Optional[str] = None
    credit_rating: Optional[str] = None
    payment_history: Optional[PaymentHistory] = PaymentHistory.GOOD
    notes: Optional[str] = None

    # Additional company information
    year_founded: Optional[int] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

    # Financial health indicators
    annual_revenue: Optional[float] = None
    profit_margin: Optional[float] = None
    debt_to_equity_ratio: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None

    # Satisfaction tracking
    satisfaction_rating: Optional[float] = None


class TenantCreate(TenantBase):
    custom_fields: Optional[List[CustomFieldBase]] = None


class TenantUpdate(TenantBase):
    name: Optional[str] = None
    custom_fields: Optional[List[CustomFieldBase]] = None


class TenantInDB(TenantBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class Tenant(TenantInDB):
    custom_fields: Optional[List[CustomField]] = None


# Renewal Option Schemas
class RenewalOptionBase(BaseModel):
    term: int = Field(..., description="Renewal term in months")
    notice_required: int = Field(..., description="Notice required in months")
    rent_increase: float = Field(..., description="Percentage increase from current rent")


class RenewalOptionCreate(RenewalOptionBase):
    pass


class RenewalOptionUpdate(RenewalOptionBase):
    term: Optional[int] = None
    notice_required: Optional[int] = None
    rent_increase: Optional[float] = None


class RenewalOptionInDB(RenewalOptionBase):
    id: UUID4
    lease_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class RenewalOption(RenewalOptionInDB):
    pass


# Lease Schemas
class LeaseBase(BaseModel):
    asset_id: UUID4
    tenant_id: UUID4
    lease_type: LeaseType
    start_date: datetime
    end_date: datetime
    base_rent: float = Field(..., description="Monthly base rent")
    rent_escalation: float = Field(0, description="Annual percentage increase")
    security_deposit: float = Field(0, description="Security deposit amount")
    lease_area: float = Field(..., description="Square footage")
    status: LeaseStatus = LeaseStatus.UPCOMING
    notes: Optional[str] = None


class LeaseCreate(LeaseBase):
    renewal_options: Optional[List[RenewalOptionCreate]] = []


class LeaseUpdate(BaseModel):
    tenant_id: Optional[UUID4] = None
    lease_type: Optional[LeaseType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    base_rent: Optional[float] = None
    rent_escalation: Optional[float] = None
    security_deposit: Optional[float] = None
    lease_area: Optional[float] = None
    status: Optional[LeaseStatus] = None
    notes: Optional[str] = None


class LeaseInDB(LeaseBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class LeaseWithDetails(LeaseInDB):
    tenant: Tenant
    renewal_options: List[RenewalOption] = []
    asset_name: Optional[str] = None


# Analytics Schemas
class LeaseExpirationSummary(BaseModel):
    expiring_30_days: int
    expiring_90_days: int
    expiring_180_days: int
    expiring_365_days: int
    expired: int


class RentRollSummary(BaseModel):
    total_monthly_rent: float
    total_annual_rent: float
    avg_rent_per_sqft: float
    total_leased_area: float
    occupancy_rate: float


class LeaseAnalytics(BaseModel):
    expiration_summary: LeaseExpirationSummary
    rent_roll_summary: RentRollSummary
    lease_type_distribution: dict
    upcoming_expirations: List[LeaseWithDetails] = []


# Notification Schemas
class LeaseNotification(BaseModel):
    lease_id: UUID4
    asset_name: str
    tenant_name: str
    expiration_date: datetime
    days_remaining: int
    notification_type: str  # e.g., "expiration", "renewal_option", etc.
    message: str
