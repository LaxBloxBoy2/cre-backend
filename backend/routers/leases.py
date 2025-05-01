from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from ..database import get_db
from ..models import Lease, LeaseStatus, RenewalOption
from ..schemas.lease import LeaseCreate, LeaseUpdate, LeaseResponse, RenewalOptionCreate
from ..services.lease_service import (
    get_all_leases, 
    get_lease_by_id, 
    create_lease, 
    update_lease, 
    delete_lease,
    update_lease_status
)

router = APIRouter(
    prefix="/leases",
    tags=["leases"]
)


@router.get("/", response_model=List[LeaseResponse])
def read_leases(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    tenant_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    lease_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all leases with optional filtering.
    """
    leases = get_all_leases(
        db, 
        skip=skip, 
        limit=limit, 
        status=status,
        tenant_id=tenant_id,
        asset_id=asset_id,
        lease_type=lease_type
    )
    
    # Update lease status based on current date
    updated_leases = []
    for lease in leases:
        updated_lease = update_lease_status(lease)
        updated_leases.append(updated_lease)
    
    return updated_leases


@router.get("/{lease_id}", response_model=LeaseResponse)
def read_lease(lease_id: str, db: Session = Depends(get_db)):
    """
    Get a specific lease by ID.
    """
    try:
        lease_uuid = uuid.UUID(lease_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lease ID format")
    
    lease = get_lease_by_id(db, lease_uuid)
    if lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    # Update lease status based on current date
    updated_lease = update_lease_status(lease)
    
    return updated_lease


@router.post("/", response_model=LeaseResponse)
def create_new_lease(lease: LeaseCreate, db: Session = Depends(get_db)):
    """
    Create a new lease.
    """
    return create_lease(db, lease)


@router.put("/{lease_id}", response_model=LeaseResponse)
def update_existing_lease(lease_id: str, lease: LeaseUpdate, db: Session = Depends(get_db)):
    """
    Update an existing lease.
    """
    try:
        lease_uuid = uuid.UUID(lease_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lease ID format")
    
    db_lease = get_lease_by_id(db, lease_uuid)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    updated_lease = update_lease(db, db_lease, lease)
    
    # Update lease status based on current date
    updated_lease = update_lease_status(updated_lease)
    
    return updated_lease


@router.delete("/{lease_id}")
def delete_existing_lease(lease_id: str, db: Session = Depends(get_db)):
    """
    Delete a lease.
    """
    try:
        lease_uuid = uuid.UUID(lease_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lease ID format")
    
    db_lease = get_lease_by_id(db, lease_uuid)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    
    delete_lease(db, db_lease)
    
    return {"message": "Lease deleted successfully"}
