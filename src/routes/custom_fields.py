"""
API routes for custom fields
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.lease_schema import CustomField, CustomFieldCreate, CustomFieldUpdate
from ..services import custom_field_service

router = APIRouter(
    prefix="/api/custom-fields",
    tags=["custom-fields"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=CustomField)
def create_custom_field(custom_field: CustomFieldCreate, db: Session = Depends(get_db)):
    """Create a new custom field"""
    return custom_field_service.create_custom_field(db, custom_field)


@router.get("/{field_id}", response_model=CustomField)
def get_custom_field(field_id: str, db: Session = Depends(get_db)):
    """Get a custom field by ID"""
    db_field = custom_field_service.get_custom_field(db, field_id)
    if not db_field:
        raise HTTPException(status_code=404, detail="Custom field not found")
    return db_field


@router.put("/{field_id}", response_model=CustomField)
def update_custom_field(field_id: str, custom_field: CustomFieldUpdate, db: Session = Depends(get_db)):
    """Update a custom field"""
    return custom_field_service.update_custom_field(db, field_id, custom_field)


@router.delete("/{field_id}")
def delete_custom_field(field_id: str, db: Session = Depends(get_db)):
    """Delete a custom field"""
    return custom_field_service.delete_custom_field(db, field_id)


@router.get("/tenant/{tenant_id}", response_model=List[CustomField])
def get_tenant_custom_fields(tenant_id: str, db: Session = Depends(get_db)):
    """Get all custom fields for a tenant"""
    return custom_field_service.get_tenant_custom_fields(db, tenant_id)
