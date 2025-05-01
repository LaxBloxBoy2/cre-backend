from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models import Tenant, SatisfactionRecord, CommunicationRecord
from ..schemas.tenant import (
    TenantCreate, 
    TenantUpdate, 
    TenantResponse,
    SatisfactionRecordCreate,
    CommunicationRecordCreate,
    SatisfactionRecordResponse,
    CommunicationRecordResponse
)
from ..services.tenant_service import (
    get_all_tenants,
    get_tenant_by_id,
    create_tenant,
    update_tenant,
    delete_tenant,
    add_satisfaction_record,
    add_communication_record
)

router = APIRouter(
    prefix="/tenants",
    tags=["tenants"]
)


@router.get("/", response_model=List[TenantResponse])
def read_tenants(
    skip: int = 0, 
    limit: int = 100,
    name: Optional[str] = None,
    industry: Optional[str] = None,
    payment_history: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all tenants with optional filtering.
    """
    return get_all_tenants(
        db, 
        skip=skip, 
        limit=limit, 
        name=name,
        industry=industry,
        payment_history=payment_history
    )


@router.get("/{tenant_id}", response_model=TenantResponse)
def read_tenant(tenant_id: str, db: Session = Depends(get_db)):
    """
    Get a specific tenant by ID.
    """
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")
    
    tenant = get_tenant_by_id(db, tenant_uuid)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return tenant


@router.post("/", response_model=TenantResponse)
def create_new_tenant(tenant: TenantCreate, db: Session = Depends(get_db)):
    """
    Create a new tenant.
    """
    return create_tenant(db, tenant)


@router.put("/{tenant_id}", response_model=TenantResponse)
def update_existing_tenant(tenant_id: str, tenant: TenantUpdate, db: Session = Depends(get_db)):
    """
    Update an existing tenant.
    """
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")
    
    db_tenant = get_tenant_by_id(db, tenant_uuid)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return update_tenant(db, db_tenant, tenant)


@router.delete("/{tenant_id}")
def delete_existing_tenant(tenant_id: str, db: Session = Depends(get_db)):
    """
    Delete a tenant.
    """
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")
    
    db_tenant = get_tenant_by_id(db, tenant_uuid)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    delete_tenant(db, db_tenant)
    
    return {"message": "Tenant deleted successfully"}


@router.post("/{tenant_id}/satisfaction", response_model=SatisfactionRecordResponse)
def add_tenant_satisfaction(
    tenant_id: str, 
    record: SatisfactionRecordCreate, 
    db: Session = Depends(get_db)
):
    """
    Add a satisfaction record for a tenant.
    """
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")
    
    db_tenant = get_tenant_by_id(db, tenant_uuid)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return add_satisfaction_record(db, db_tenant, record)


@router.post("/{tenant_id}/communication", response_model=CommunicationRecordResponse)
def add_tenant_communication(
    tenant_id: str, 
    record: CommunicationRecordCreate, 
    db: Session = Depends(get_db)
):
    """
    Add a communication record for a tenant.
    """
    try:
        tenant_uuid = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")
    
    db_tenant = get_tenant_by_id(db, tenant_uuid)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return add_communication_record(db, db_tenant, record)
