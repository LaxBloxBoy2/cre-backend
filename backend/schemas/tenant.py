from pydantic import BaseModel, Field, UUID4, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PaymentHistoryEnum(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


class SatisfactionRecordBase(BaseModel):
    date: datetime
    rating: float = Field(..., ge=1, le=5, description="Rating on a scale of 1-5")
    feedback: Optional[str] = None
    recorded_by: str


class SatisfactionRecordCreate(SatisfactionRecordBase):
    pass


class SatisfactionRecordResponse(SatisfactionRecordBase):
    id: UUID4
    tenant_id: UUID4
    created_at: datetime

    class Config:
        orm_mode = True


class CommunicationRecordBase(BaseModel):
    date: datetime
    type: str = Field(..., description="Email, Phone, Meeting, Letter, Other")
    subject: str
    description: str
    outcome: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    contact_person: str
    recorded_by: str


class CommunicationRecordCreate(CommunicationRecordBase):
    pass


class CommunicationRecordResponse(CommunicationRecordBase):
    id: UUID4
    tenant_id: UUID4
    created_at: datetime

    class Config:
        orm_mode = True


class TenantBase(BaseModel):
    name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    industry: Optional[str] = None
    credit_rating: Optional[str] = None
    payment_history: Optional[PaymentHistoryEnum] = None
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
    
    # Custom fields
    custom_fields: Optional[Dict[str, Any]] = None


class TenantCreate(TenantBase):
    pass


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    industry: Optional[str] = None
    credit_rating: Optional[str] = None
    payment_history: Optional[PaymentHistoryEnum] = None
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
    
    # Custom fields
    custom_fields: Optional[Dict[str, Any]] = None


class TenantResponse(TenantBase):
    id: UUID4
    satisfaction_rating: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    satisfaction_history: List[SatisfactionRecordResponse]
    communication_history: List[CommunicationRecordResponse]

    class Config:
        orm_mode = True
