import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class PropertyAttributes(Base):
    """Property attributes model for database"""
    __tablename__ = "property_attributes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    
    # Basic property information
    property_class = Column(String, nullable=True)  # Class A, B, C, etc.
    building_style = Column(String, nullable=True)  # Modern, Traditional, etc.
    year_built = Column(Integer, nullable=True)
    year_renovated = Column(Integer, nullable=True)
    zoning = Column(String, nullable=True)
    lot_size = Column(Float, nullable=True)  # in square feet
    number_of_floors = Column(Integer, nullable=True)
    number_of_units = Column(Integer, nullable=True)
    average_unit_size = Column(Float, nullable=True)  # in square feet
    parking_spaces = Column(Integer, nullable=True)
    
    # Additional property features
    has_elevator = Column(Boolean, default=False)
    has_central_air = Column(Boolean, default=False)
    has_pool = Column(Boolean, default=False)
    has_fitness_center = Column(Boolean, default=False)
    has_rooftop = Column(Boolean, default=False)
    has_retail = Column(Boolean, default=False)
    
    # Property subtype
    property_subtype = Column(String, nullable=True)  # e.g., Garden-style, High-rise, etc.
    
    # Relationship
    deal = relationship("Deal", back_populates="property_attributes")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=True)
