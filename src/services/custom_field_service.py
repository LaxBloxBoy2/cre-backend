"""
Service for managing custom fields
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional
import uuid

from ..models.custom_field import CustomField, FieldType
from ..schemas.lease_schema import CustomFieldCreate, CustomFieldUpdate


def create_custom_field(db: Session, custom_field: CustomFieldCreate):
    """Create a new custom field"""
    try:
        field_type = FieldType(custom_field.field_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid field type: {custom_field.field_type}")
    
    db_custom_field = CustomField(
        id=uuid.uuid4(),
        tenant_id=custom_field.tenant_id,
        name=custom_field.name,
        value=custom_field.value,
        field_type=field_type,
        options=custom_field.options
    )
    db.add(db_custom_field)
    db.commit()
    db.refresh(db_custom_field)
    return db_custom_field


def get_custom_field(db: Session, field_id: str):
    """Get a custom field by ID"""
    try:
        uuid_id = uuid.UUID(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid custom field ID format")
    
    return db.query(CustomField).filter(CustomField.id == uuid_id).first()


def update_custom_field(db: Session, field_id: str, custom_field: CustomFieldUpdate):
    """Update a custom field"""
    try:
        uuid_id = uuid.UUID(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid custom field ID format")
    
    db_custom_field = db.query(CustomField).filter(CustomField.id == uuid_id).first()
    if not db_custom_field:
        raise HTTPException(status_code=404, detail="Custom field not found")
    
    # Update field type if provided
    if custom_field.field_type:
        try:
            field_type = FieldType(custom_field.field_type)
            db_custom_field.field_type = field_type
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid field type: {custom_field.field_type}")
    
    # Update other fields
    update_data = custom_field.dict(exclude={"field_type"}, exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_custom_field, key, value)
    
    db.commit()
    db.refresh(db_custom_field)
    return db_custom_field


def delete_custom_field(db: Session, field_id: str):
    """Delete a custom field"""
    try:
        uuid_id = uuid.UUID(field_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid custom field ID format")
    
    db_custom_field = db.query(CustomField).filter(CustomField.id == uuid_id).first()
    if not db_custom_field:
        raise HTTPException(status_code=404, detail="Custom field not found")
    
    db.delete(db_custom_field)
    db.commit()
    return True


def get_tenant_custom_fields(db: Session, tenant_id: str):
    """Get all custom fields for a tenant"""
    try:
        uuid_id = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")
    
    return db.query(CustomField).filter(CustomField.tenant_id == uuid_id).all()
