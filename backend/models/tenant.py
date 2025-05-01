from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from datetime import datetime

from .base import Base


class PaymentHistory(enum.Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic information
    name = Column(String(255), nullable=False)
    contact_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=False)
    contact_phone = Column(String(50), nullable=False)
    industry = Column(String(100), nullable=True)
    credit_rating = Column(String(20), nullable=True)
    payment_history = Column(Enum(PaymentHistory), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Additional company information
    year_founded = Column(Integer, nullable=True)
    company_size = Column(String(50), nullable=True)
    website = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    
    # Financial health indicators
    annual_revenue = Column(Float, nullable=True)
    profit_margin = Column(Float, nullable=True)
    debt_to_equity_ratio = Column(Float, nullable=True)
    current_ratio = Column(Float, nullable=True)
    quick_ratio = Column(Float, nullable=True)
    
    # Satisfaction tracking
    satisfaction_rating = Column(Float, nullable=True)  # 1-5 scale
    
    # Custom fields
    custom_fields = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leases = relationship("Lease", back_populates="tenant")
    satisfaction_history = relationship("SatisfactionRecord", back_populates="tenant", cascade="all, delete-orphan")
    communication_history = relationship("CommunicationRecord", back_populates="tenant", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "contact_name": self.contact_name,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "industry": self.industry,
            "credit_rating": self.credit_rating,
            "payment_history": self.payment_history.value if self.payment_history else None,
            "notes": self.notes,
            "year_founded": self.year_founded,
            "company_size": self.company_size,
            "website": self.website,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "annual_revenue": self.annual_revenue,
            "profit_margin": self.profit_margin,
            "debt_to_equity_ratio": self.debt_to_equity_ratio,
            "current_ratio": self.current_ratio,
            "quick_ratio": self.quick_ratio,
            "satisfaction_rating": self.satisfaction_rating,
            "custom_fields": self.custom_fields,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "satisfaction_history": [record.to_dict() for record in self.satisfaction_history],
            "communication_history": [record.to_dict() for record in self.communication_history]
        }


class SatisfactionRecord(Base):
    __tablename__ = "satisfaction_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    date = Column(DateTime, nullable=False)
    rating = Column(Float, nullable=False)  # 1-5 scale
    feedback = Column(Text, nullable=True)
    recorded_by = Column(String(255), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="satisfaction_history")

    def to_dict(self):
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "date": self.date.isoformat() if self.date else None,
            "rating": self.rating,
            "feedback": self.feedback,
            "recorded_by": self.recorded_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class CommunicationRecord(Base):
    __tablename__ = "communication_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    date = Column(DateTime, nullable=False)
    type = Column(String(50), nullable=False)  # Email, Phone, Meeting, Letter, Other
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    outcome = Column(Text, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    contact_person = Column(String(255), nullable=False)
    recorded_by = Column(String(255), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="communication_history")

    def to_dict(self):
        return {
            "id": str(self.id),
            "tenant_id": str(self.tenant_id),
            "date": self.date.isoformat() if self.date else None,
            "type": self.type,
            "subject": self.subject,
            "description": self.description,
            "outcome": self.outcome,
            "follow_up_date": self.follow_up_date.isoformat() if self.follow_up_date else None,
            "contact_person": self.contact_person,
            "recorded_by": self.recorded_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
