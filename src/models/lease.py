from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
import enum

from ..database import Base


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


class PaymentHistory(enum.Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


class Tenant(Base):
    """Model for commercial real estate tenants"""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_name = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    industry = Column(String(100))
    credit_rating = Column(String(20))
    payment_history = Column(Enum(PaymentHistory), default=PaymentHistory.GOOD)
    notes = Column(Text)

    # Additional company information
    year_founded = Column(Integer, nullable=True)
    company_size = Column(String(100), nullable=True)
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
    satisfaction_rating = Column(Float, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    leases = relationship("Lease", back_populates="tenant")
    custom_fields = relationship("CustomField", back_populates="tenant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant {self.name}>"


class Lease(Base):
    """Model for commercial real estate leases"""
    __tablename__ = "leases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    # Lease details
    lease_type = Column(Enum(LeaseType), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    base_rent = Column(Float, nullable=False)  # Monthly base rent
    rent_escalation = Column(Float, default=0)  # Annual percentage increase
    security_deposit = Column(Float, default=0)
    lease_area = Column(Float, nullable=False)  # Square footage
    status = Column(Enum(LeaseStatus), default=LeaseStatus.UPCOMING)

    # Additional details
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    asset = relationship("Asset", back_populates="leases")
    tenant = relationship("Tenant", back_populates="leases")
    renewal_options = relationship("RenewalOption", back_populates="lease", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Lease {self.id}: {self.asset.name} - {self.tenant.name}>"


class RenewalOption(Base):
    """Model for lease renewal options"""
    __tablename__ = "renewal_options"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lease_id = Column(UUID(as_uuid=True), ForeignKey("leases.id"), nullable=False)

    # Renewal details
    term = Column(Integer, nullable=False)  # In months
    notice_required = Column(Integer, nullable=False)  # In months
    rent_increase = Column(Float, nullable=False)  # Percentage increase from current rent

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    lease = relationship("Lease", back_populates="renewal_options")

    def __repr__(self):
        return f"<RenewalOption {self.id}: {self.term} months>"
