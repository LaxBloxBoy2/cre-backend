from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from geojson_pydantic import Point

class MarketCompBase(BaseModel):
    """Base model for market comp"""
    property_type: str = Field(..., description="Type of property (e.g., Multifamily, Office, Retail)")
    latitude: float = Field(..., description="Latitude coordinate of the property")
    longitude: float = Field(..., description="Longitude coordinate of the property")
    city: str = Field(..., description="City where the property is located")
    state: str = Field(..., description="State where the property is located")
    zipcode: str = Field(..., description="ZIP code where the property is located")
    price: Optional[int] = Field(None, description="Sale price of the property in USD")
    rent: Optional[int] = Field(None, description="Rental price of the property in USD")
    beds: Optional[int] = Field(None, description="Number of bedrooms")
    baths: Optional[int] = Field(None, description="Number of bathrooms")
    sqft: Optional[int] = Field(None, description="Square footage of the property")
    source: str = Field("LoopNet", description="Source of the market comp data")

class MarketCompCreate(MarketCompBase):
    """Create model for market comp"""
    pass

class MarketCompUpdate(BaseModel):
    """Update model for market comp"""
    property_type: Optional[str] = Field(None, description="Type of property")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    city: Optional[str] = Field(None, description="City")
    state: Optional[str] = Field(None, description="State")
    zipcode: Optional[str] = Field(None, description="ZIP code")
    price: Optional[int] = Field(None, description="Sale price in USD")
    rent: Optional[int] = Field(None, description="Rental price in USD")
    beds: Optional[int] = Field(None, description="Number of bedrooms")
    baths: Optional[int] = Field(None, description="Number of bathrooms")
    sqft: Optional[int] = Field(None, description="Square footage")
    source: Optional[str] = Field(None, description="Source of the data")

class MarketCompInDB(MarketCompBase):
    """Database model for market comp"""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class MarketComp(MarketCompInDB):
    """Response model for market comp"""
    pass

class MarketCompList(BaseModel):
    """Response model for list of market comps"""
    comps: List[MarketComp]
    total: int

class GeoPoint(BaseModel):
    """Model for geographic point"""
    lat: float
    lng: float

class BoundingBox(BaseModel):
    """Model for geographic bounding box"""
    southwest: GeoPoint
    northeast: GeoPoint

class MarketCompSearchRequest(BaseModel):
    """Request model for searching market comps"""
    property_type: Optional[str] = Field(None, description="Filter by property type")
    city: Optional[str] = Field(None, description="Filter by city")
    state: Optional[str] = Field(None, description="Filter by state")
    zipcode: Optional[str] = Field(None, description="Filter by ZIP code")
    min_price: Optional[int] = Field(None, description="Minimum price")
    max_price: Optional[int] = Field(None, description="Maximum price")
    min_rent: Optional[int] = Field(None, description="Minimum rent")
    max_rent: Optional[int] = Field(None, description="Maximum rent")
    min_beds: Optional[int] = Field(None, description="Minimum number of bedrooms")
    max_beds: Optional[int] = Field(None, description="Maximum number of bedrooms")
    min_baths: Optional[int] = Field(None, description="Minimum number of bathrooms")
    max_baths: Optional[int] = Field(None, description="Maximum number of bathrooms")
    min_sqft: Optional[int] = Field(None, description="Minimum square footage")
    max_sqft: Optional[int] = Field(None, description="Maximum square footage")
    bounding_box: Optional[BoundingBox] = Field(None, description="Geographic bounding box to search within")
    center_point: Optional[GeoPoint] = Field(None, description="Center point to search around")
    radius_miles: Optional[float] = Field(None, description="Radius in miles to search around center point")

class MarketCompGeoJSON(BaseModel):
    """GeoJSON response model for market comps"""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]
