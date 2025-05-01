from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import uuid

from ..database import get_db
from ..models.lease import Lease, Tenant, RenewalOption, LeaseStatus, LeaseType
from ..schemas.lease_schema import (
    LeaseCreate, LeaseUpdate, LeaseWithDetails, Tenant as TenantSchema,
    TenantCreate, TenantUpdate, RenewalOptionCreate, LeaseAnalytics,
    LeaseExpirationSummary, RentRollSummary, CustomField, CustomFieldCreate, CustomFieldUpdate
)
from ..services.lease_service import (
    create_lease, get_lease, update_lease, delete_lease, get_all_leases,
    create_tenant, get_tenant, update_tenant, delete_tenant, get_all_tenants,
    calculate_lease_analytics, get_upcoming_expirations
)
from ..services.custom_field_service import (
    create_custom_field, get_custom_field, update_custom_field,
    delete_custom_field, get_tenant_custom_fields
)

router = APIRouter(
    prefix="/lease-management",
    tags=["lease-management"],
    responses={404: {"description": "Not found"}},
)


# Lease endpoints
@router.post("/leases/", response_model=LeaseWithDetails, status_code=status.HTTP_201_CREATED)
def create_new_lease(lease: LeaseCreate, db: Session = Depends(get_db)):
    """Create a new lease"""
    return create_lease(db=db, lease=lease)


@router.get("/leases/", response_model=List[LeaseWithDetails])
def read_leases(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    lease_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all leases with optional filtering"""
    return get_all_leases(
        db=db,
        skip=skip,
        limit=limit,
        status=status,
        asset_id=asset_id,
        tenant_id=tenant_id,
        lease_type=lease_type
    )


@router.get("/leases/{lease_id}", response_model=LeaseWithDetails)
def read_lease(lease_id: str, db: Session = Depends(get_db)):
    """Get a specific lease by ID"""
    db_lease = get_lease(db=db, lease_id=lease_id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    return db_lease


@router.put("/leases/{lease_id}", response_model=LeaseWithDetails)
def update_existing_lease(lease_id: str, lease: LeaseUpdate, db: Session = Depends(get_db)):
    """Update an existing lease"""
    db_lease = get_lease(db=db, lease_id=lease_id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    return update_lease(db=db, lease_id=lease_id, lease=lease)


@router.delete("/leases/{lease_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_lease(lease_id: str, db: Session = Depends(get_db)):
    """Delete a lease"""
    db_lease = get_lease(db=db, lease_id=lease_id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")
    delete_lease(db=db, lease_id=lease_id)
    return {"status": "success"}


# Tenant endpoints
@router.post("/tenants/", response_model=TenantSchema, status_code=status.HTTP_201_CREATED)
def create_new_tenant(tenant: TenantCreate, db: Session = Depends(get_db)):
    """Create a new tenant"""
    return create_tenant(db=db, tenant=tenant)


@router.get("/tenants/", response_model=List[TenantSchema])
def read_tenants(skip: int = 0, limit: int = 100, include_custom_fields: bool = False, db: Session = Depends(get_db)):
    """Get all tenants"""
    return get_all_tenants(db=db, skip=skip, limit=limit, include_custom_fields=include_custom_fields)


@router.get("/tenants/{tenant_id}", response_model=TenantSchema)
def read_tenant(tenant_id: str, include_custom_fields: bool = False, db: Session = Depends(get_db)):
    """Get a specific tenant by ID"""
    db_tenant = get_tenant(db=db, tenant_id=tenant_id, include_custom_fields=include_custom_fields)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant


@router.put("/tenants/{tenant_id}", response_model=TenantSchema)
def update_existing_tenant(tenant_id: str, tenant: TenantUpdate, db: Session = Depends(get_db)):
    """Update an existing tenant"""
    db_tenant = get_tenant(db=db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return update_tenant(db=db, tenant_id=tenant_id, tenant=tenant)


@router.delete("/tenants/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_tenant(tenant_id: str, db: Session = Depends(get_db)):
    """Delete a tenant"""
    db_tenant = get_tenant(db=db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    delete_tenant(db=db, tenant_id=tenant_id)
    return {"status": "success"}


# Analytics endpoints
@router.get("/analytics/", response_model=LeaseAnalytics)
def get_lease_analytics(
    asset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get lease analytics including expiration summary and rent roll summary"""
    return calculate_lease_analytics(db=db, asset_id=asset_id)


@router.get("/analytics/expirations/", response_model=List[LeaseWithDetails])
def get_lease_expirations(
    days: int = Query(180, description="Number of days to look ahead for expirations"),
    asset_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get upcoming lease expirations within specified days"""
    return get_upcoming_expirations(db=db, days=days, asset_id=asset_id)


# Utility endpoints
@router.post("/leases/{lease_id}/update-status", response_model=LeaseWithDetails)
def update_lease_status(lease_id: str, db: Session = Depends(get_db)):
    """Update lease status based on current date"""
    db_lease = get_lease(db=db, lease_id=lease_id)
    if db_lease is None:
        raise HTTPException(status_code=404, detail="Lease not found")

    now = datetime.now(timezone.utc)

    # Update status based on dates
    if now < db_lease.start_date:
        status = LeaseStatus.UPCOMING
    elif now > db_lease.end_date:
        status = LeaseStatus.EXPIRED
    else:
        status = LeaseStatus.ACTIVE

    # Only update if status has changed
    if db_lease.status != status:
        lease_update = LeaseUpdate(status=status)
        return update_lease(db=db, lease_id=lease_id, lease=lease_update)

    return db_lease


# Custom field endpoints
@router.post("/tenants/{tenant_id}/custom-fields", response_model=CustomField)
def create_tenant_custom_field(tenant_id: str, custom_field: CustomFieldCreate, db: Session = Depends(get_db)):
    """Create a new custom field for a tenant"""
    # Verify tenant exists
    db_tenant = get_tenant(db=db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Set tenant_id in the custom field
    custom_field_dict = custom_field.model_dump()
    custom_field_dict["tenant_id"] = tenant_id

    # Create custom field
    return create_custom_field(db=db, custom_field=CustomFieldCreate(**custom_field_dict))


@router.get("/tenants/{tenant_id}/custom-fields", response_model=List[CustomField])
def read_tenant_custom_fields(tenant_id: str, db: Session = Depends(get_db)):
    """Get all custom fields for a tenant"""
    # Verify tenant exists
    db_tenant = get_tenant(db=db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")

    return get_tenant_custom_fields(db=db, tenant_id=tenant_id)


@router.get("/custom-fields/{field_id}", response_model=CustomField)
def read_custom_field(field_id: str, db: Session = Depends(get_db)):
    """Get a custom field by ID"""
    db_field = get_custom_field(db=db, field_id=field_id)
    if db_field is None:
        raise HTTPException(status_code=404, detail="Custom field not found")
    return db_field


@router.put("/custom-fields/{field_id}", response_model=CustomField)
def update_custom_field_endpoint(field_id: str, custom_field: CustomFieldUpdate, db: Session = Depends(get_db)):
    """Update a custom field"""
    db_field = get_custom_field(db=db, field_id=field_id)
    if db_field is None:
        raise HTTPException(status_code=404, detail="Custom field not found")
    return update_custom_field(db=db, field_id=field_id, custom_field=custom_field)


@router.delete("/custom-fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_field_endpoint(field_id: str, db: Session = Depends(get_db)):
    """Delete a custom field"""
    db_field = get_custom_field(db=db, field_id=field_id)
    if db_field is None:
        raise HTTPException(status_code=404, detail="Custom field not found")
    delete_custom_field(db=db, field_id=field_id)
    return {"status": "success"}