from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.geocoding_service import geocode_address, geocode_address_google
from ..utils.limiter import limiter
from fastapi import Request

router = APIRouter()

class GeocodeRequest(BaseModel):
    """Request model for geocoding"""
    address: str

class GeocodeResponse(BaseModel):
    """Response model for geocoding"""
    lat: float
    lng: float
    formatted_address: str

@router.post("/geocode", response_model=GeocodeResponse, tags=["Geocoding"])
@limiter.limit("10/minute")
async def geocode_address_route(
    request: Request,
    geocode_request: GeocodeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Geocode an address
    
    Args:
        geocode_request: Geocode request with address
        current_user: Current user
        db: Database session
        
    Returns:
        Geocode response with lat, lng, and formatted_address
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Try OpenCage first
    result, error = geocode_address(geocode_request.address)
    
    # If OpenCage fails, try Google Maps
    if not result:
        result, error = geocode_address_google(geocode_request.address)
    
    # If both fail, return error
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error or "Failed to geocode address"
        )
    
    return GeocodeResponse(
        lat=result["lat"],
        lng=result["lng"],
        formatted_address=result["formatted_address"]
    )
