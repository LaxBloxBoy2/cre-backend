from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from ..database import Base


class Asset(Base):
    """Model for real estate assets"""
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    property_type = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    
    # Financial information
    value = Column(Float, default=0)
    noi = Column(Float, default=0)
    debt_service = Column(Float, default=0)
    cap_rate = Column(Float, default=0)
    required_capex = Column(Float, default=0)
    
    # Additional details
    square_footage = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    year_renovated = Column(Integer, nullable=True)
    last_refinance_date = Column(DateTime, nullable=True)
    
    # Geographic coordinates
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Ownership information
    fund_id = Column(UUID(as_uuid=True), ForeignKey("funds.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    leases = relationship("Lease", back_populates="asset", cascade="all, delete-orphan")
    fund = relationship("Fund", back_populates="assets")
    
    def __repr__(self):
        return f"<Asset {self.name}>"


class Fund(Base):
    """Model for real estate funds"""
    __tablename__ = "funds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    target_irr = Column(Float, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assets = relationship("Asset", back_populates="fund")
    
    def __repr__(self):
        return f"<Fund {self.name}>"
