from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from datetime import datetime

from .base import Base


class LeaseStatus(enum.Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    UPCOMING = "Upcoming"


class LeaseType(enum.Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    INDUSTRIAL = "Industrial"
    MULTIFAMILY = "Multifamily"
    MIXED_USE = "Mixed-Use"


class Lease(Base):
    __tablename__ = "leases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Lease details
    lease_type = Column(Enum(LeaseType), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    base_rent = Column(Float, nullable=False)  # Monthly base rent
    rent_escalation = Column(Float, nullable=False)  # Annual percentage increase
    security_deposit = Column(Float, nullable=False)
    lease_area = Column(Float, nullable=False)  # Square footage
    status = Column(Enum(LeaseStatus), nullable=False, default=LeaseStatus.UPCOMING)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    asset = relationship("Asset", back_populates="leases")
    tenant = relationship("Tenant", back_populates="leases")
    renewal_options = relationship("RenewalOption", back_populates="lease", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "asset_id": str(self.asset_id),
            "asset_name": self.asset.name if self.asset else None,
            "tenant_id": str(self.tenant_id),
            "tenant_name": self.tenant.name if self.tenant else None,
            "lease_type": self.lease_type.value,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "base_rent": self.base_rent,
            "rent_escalation": self.rent_escalation,
            "security_deposit": self.security_deposit,
            "lease_area": self.lease_area,
            "status": self.status.value,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "renewal_options": [option.to_dict() for option in self.renewal_options]
        }


class RenewalOption(Base):
    __tablename__ = "renewal_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.id"), nullable=False)
    
    term = Column(Integer, nullable=False)  # In months
    notice_required = Column(Integer, nullable=False)  # In months
    rent_increase = Column(Float, nullable=False)  # Percentage increase from current rent
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    lease = relationship("Lease", back_populates="renewal_options")

    def to_dict(self):
        return {
            "id": str(self.id),
            "lease_id": str(self.lease_id),
            "term": self.term,
            "notice_required": self.notice_required,
            "rent_increase": self.rent_increase,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
