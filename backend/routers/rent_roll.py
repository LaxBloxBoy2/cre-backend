from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import Lease, LeaseStatus, LeaseType
from ..schemas.analytics import (
    PropertyTypeDistribution,
    LeaseExpirationTimeline,
    TenantConcentration,
    RentRollSummary
)
from ..services.analytics_service import (
    get_property_type_distribution,
    get_lease_expiration_timeline,
    get_tenant_concentration,
    get_rent_roll_summary
)

router = APIRouter(
    prefix="/rent-roll",
    tags=["rent-roll"]
)


@router.get("/summary", response_model=RentRollSummary)
def get_summary(
    asset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get a summary of the rent roll data.
    """
    asset_uuid = None
    if asset_id:
        try:
            asset_uuid = uuid.UUID(asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    return get_rent_roll_summary(db, asset_uuid)


@router.get("/property-type-distribution", response_model=List[PropertyTypeDistribution])
def get_distribution_by_property_type(
    asset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get the distribution of rent by property type.
    """
    asset_uuid = None
    if asset_id:
        try:
            asset_uuid = uuid.UUID(asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    return get_property_type_distribution(db, asset_uuid)


@router.get("/lease-expiration-timeline", response_model=List[LeaseExpirationTimeline])
def get_lease_expirations(
    asset_id: Optional[str] = None,
    years_ahead: int = 5,
    db: Session = Depends(get_db)
):
    """
    Get the timeline of lease expirations.
    """
    asset_uuid = None
    if asset_id:
        try:
            asset_uuid = uuid.UUID(asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    return get_lease_expiration_timeline(db, asset_uuid, years_ahead)


@router.get("/tenant-concentration", response_model=List[TenantConcentration])
def get_concentration_by_tenant(
    asset_id: Optional[str] = None,
    top_n: int = 5,
    db: Session = Depends(get_db)
):
    """
    Get the concentration of rent by tenant.
    """
    asset_uuid = None
    if asset_id:
        try:
            asset_uuid = uuid.UUID(asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    return get_tenant_concentration(db, asset_uuid, top_n)
