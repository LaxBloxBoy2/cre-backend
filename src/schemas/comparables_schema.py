from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ComparableProperty(BaseModel):
    """Model for a comparable property"""
    name: str = Field(..., description="The name of the property")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property")
    cap_rate: float = Field(..., description="The cap rate of the property")
    noi: Optional[float] = Field(None, description="The NOI of the property")
    price_per_sf: Optional[float] = Field(None, description="The price per square foot")
    square_footage: Optional[float] = Field(None, description="The square footage of the property")
    
class ComparablesRequest(BaseModel):
    """Request model for generating comparables"""
    location: str = Field(..., description="The location of the subject property")
    property_type: str = Field(..., description="The type of subject property")
    cap_rate: float = Field(..., description="The cap rate of the subject property")
    noi: Optional[float] = Field(None, description="The NOI of the subject property")
    square_footage: Optional[float] = Field(None, description="The square footage of the subject property")
    
class ComparablesResponse(BaseModel):
    """Response model for generating comparables"""
    subject_cap_rate: float = Field(..., description="The cap rate of the subject property")
    market_avg_cap_rate: float = Field(..., description="The average cap rate of comparable properties")
    delta_bps: str = Field(..., description="The difference between subject and market cap rates in basis points")
    comps: List[ComparableProperty] = Field(..., description="The list of comparable properties")
    summary: str = Field(..., description="A summary of the comparison")
