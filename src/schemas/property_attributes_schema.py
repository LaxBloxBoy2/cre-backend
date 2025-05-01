from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PropertyAttributesBase(BaseModel):
    """Base model for property attributes"""
    property_class: Optional[str] = Field(None, description="Property class (A, B, C, etc.)")
    building_style: Optional[str] = Field(None, description="Building style (Modern, Traditional, etc.)")
    year_built: Optional[int] = Field(None, description="Year the property was built")
    year_renovated: Optional[int] = Field(None, description="Year the property was last renovated")
    zoning: Optional[str] = Field(None, description="Zoning designation")
    lot_size: Optional[float] = Field(None, description="Lot size in square feet")
    number_of_floors: Optional[int] = Field(None, description="Number of floors")
    number_of_units: Optional[int] = Field(None, description="Number of units")
    average_unit_size: Optional[float] = Field(None, description="Average unit size in square feet")
    parking_spaces: Optional[int] = Field(None, description="Number of parking spaces")
    has_elevator: Optional[bool] = Field(None, description="Whether the property has an elevator")
    has_central_air: Optional[bool] = Field(None, description="Whether the property has central air conditioning")
    has_pool: Optional[bool] = Field(None, description="Whether the property has a pool")
    has_fitness_center: Optional[bool] = Field(None, description="Whether the property has a fitness center")
    has_rooftop: Optional[bool] = Field(None, description="Whether the property has a rooftop amenity")
    has_retail: Optional[bool] = Field(None, description="Whether the property has retail space")
    property_subtype: Optional[str] = Field(None, description="Property subtype (Garden-style, High-rise, etc.)")

class PropertyAttributesCreate(PropertyAttributesBase):
    """Create model for property attributes"""
    pass

class PropertyAttributesUpdate(PropertyAttributesBase):
    """Update model for property attributes"""
    pass

class PropertyAttributesInDB(PropertyAttributesBase):
    """Database model for property attributes"""
    id: str
    deal_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PropertyAttributes(PropertyAttributesInDB):
    """Response model for property attributes"""
    pass
