from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum
from datetime import datetime

from .base import Base


class AssetType(enum.Enum):
    OFFICE = "Office"
    RETAIL = "Retail"
    INDUSTRIAL = "Industrial"
    MULTIFAMILY = "Multifamily"
    MIXED_USE = "Mixed-Use"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Basic information
    name = Column(String(255), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=False)
    
    # Property details
    total_area = Column(Float, nullable=False)  # Square footage
    year_built = Column(Integer, nullable=True)
    floors = Column(Integer, nullable=True)
    units = Column(Integer, nullable=True)
    
    # Financial information
    purchase_price = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    annual_taxes = Column(Float, nullable=True)
    annual_insurance = Column(Float, nullable=True)
    
    # Custom fields
    custom_fields = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leases = relationship("Lease", back_populates="asset")

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "asset_type": self.asset_type.value,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "total_area": self.total_area,
            "year_built": self.year_built,
            "floors": self.floors,
            "units": self.units,
            "purchase_price": self.purchase_price,
            "current_value": self.current_value,
            "annual_taxes": self.annual_taxes,
            "annual_insurance": self.annual_insurance,
            "custom_fields": self.custom_fields,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "leases_count": len(self.leases) if self.leases else 0
        }
