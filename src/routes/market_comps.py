from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.market_comp import MarketComp
from ..schemas.market_comp_schema import (
    MarketCompCreate,
    MarketCompUpdate,
    MarketComp as MarketCompSchema,
    MarketCompList,
    MarketCompSearchRequest,
    MarketCompGeoJSON,
    GeoPoint
)
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.market_comp_service import (
    get_market_comps,
    get_market_comp_by_id,
    search_market_comps,
    convert_to_geojson
)

router = APIRouter()

@router.get("/comps", response_model=MarketCompList, tags=["Market Comps"])
async def get_comps(
    lat: Optional[float] = Query(None, description="Latitude to search around"),
    lng: Optional[float] = Query(None, description="Longitude to search around"),
    radius: Optional[float] = Query(None, description="Radius in miles to search around the coordinates"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    zipcode: Optional[str] = Query(None, description="Filter by ZIP code"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get market comps
    
    This endpoint returns market comps based on the provided filters.
    If latitude and longitude are provided, it will return comps within the specified radius.
    Otherwise, it will return comps based on the other filters.
    
    Args:
        lat: Latitude to search around
        lng: Longitude to search around
        radius: Radius in miles to search around the coordinates
        property_type: Filter by property type
        city: Filter by city
        state: Filter by state
        zipcode: Filter by ZIP code
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        List of market comps
    """
    if lat is not None and lng is not None and radius is not None:
        # Search by coordinates and radius
        search_request = MarketCompSearchRequest(
            center_point=GeoPoint(lat=lat, lng=lng),
            radius_miles=radius,
            property_type=property_type,
            city=city,
            state=state,
            zipcode=zipcode
        )
        
        comps, total = search_market_comps(db, search_request, skip, limit)
    else:
        # Search by filters
        comps, total = get_market_comps(
            db,
            skip=skip,
            limit=limit,
            property_type=property_type,
            city=city,
            state=state,
            zipcode=zipcode
        )
    
    return MarketCompList(comps=comps, total=total)

@router.get("/comps/{comp_id}", response_model=MarketCompSchema, tags=["Market Comps"])
async def get_comp(
    comp_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a market comp by ID
    
    This endpoint returns a specific market comp by its ID.
    
    Args:
        comp_id: Market comp ID
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Market comp
        
    Raises:
        HTTPException: If the market comp is not found
    """
    comp = get_market_comp_by_id(db, comp_id)
    
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market comp with ID {comp_id} not found"
        )
    
    return comp

@router.post("/comps/search", response_model=MarketCompList, tags=["Market Comps"])
async def search_comps(
    search_request: MarketCompSearchRequest,
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Search market comps
    
    This endpoint allows advanced search of market comps based on various criteria.
    
    Args:
        search_request: Search request with filters
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        List of market comps
    """
    comps, total = search_market_comps(db, search_request, skip, limit)
    
    return MarketCompList(comps=comps, total=total)

@router.get("/comps/geojson", response_model=MarketCompGeoJSON, tags=["Market Comps"])
async def get_comps_geojson(
    lat: Optional[float] = Query(None, description="Latitude to search around"),
    lng: Optional[float] = Query(None, description="Longitude to search around"),
    radius: Optional[float] = Query(None, description="Radius in miles to search around the coordinates"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    zipcode: Optional[str] = Query(None, description="Filter by ZIP code"),
    skip: int = Query(0, description="Number of records to skip"),
    limit: int = Query(100, description="Maximum number of records to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get market comps in GeoJSON format
    
    This endpoint returns market comps in GeoJSON format based on the provided filters.
    
    Args:
        lat: Latitude to search around
        lng: Longitude to search around
        radius: Radius in miles to search around the coordinates
        property_type: Filter by property type
        city: Filter by city
        state: Filter by state
        zipcode: Filter by ZIP code
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        GeoJSON object with market comps
    """
    if lat is not None and lng is not None and radius is not None:
        # Search by coordinates and radius
        search_request = MarketCompSearchRequest(
            center_point=GeoPoint(lat=lat, lng=lng),
            radius_miles=radius,
            property_type=property_type,
            city=city,
            state=state,
            zipcode=zipcode
        )
        
        comps, _ = search_market_comps(db, search_request, skip, limit)
    else:
        # Search by filters
        comps, _ = get_market_comps(
            db,
            skip=skip,
            limit=limit,
            property_type=property_type,
            city=city,
            state=state,
            zipcode=zipcode
        )
    
    return convert_to_geojson(comps)
