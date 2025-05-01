from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..models import Tenant, SatisfactionRecord, CommunicationRecord
from ..schemas.tenant import (
    TenantCreate, 
    TenantUpdate, 
    SatisfactionRecordCreate,
    CommunicationRecordCreate
)


def get_all_tenants(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    name: Optional[str] = None,
    industry: Optional[str] = None,
    payment_history: Optional[str] = None
) -> List[Tenant]:
    """
    Get all tenants with optional filtering.
    """
    query = db.query(Tenant)
    
    if name:
        query = query.filter(Tenant.name.ilike(f"%{name}%"))
    
    if industry:
        query = query.filter(Tenant.industry == industry)
    
    if payment_history:
        query = query.filter(Tenant.payment_history == payment_history)
    
    return query.offset(skip).limit(limit).all()


def get_tenant_by_id(db: Session, tenant_id: uuid.UUID) -> Optional[Tenant]:
    """
    Get a specific tenant by ID.
    """
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()


def create_tenant(db: Session, tenant: TenantCreate) -> Tenant:
    """
    Create a new tenant.
    """
    db_tenant = Tenant(
        name=tenant.name,
        contact_name=tenant.contact_name,
        contact_email=tenant.contact_email,
        contact_phone=tenant.contact_phone,
        industry=tenant.industry,
        credit_rating=tenant.credit_rating,
        payment_history=tenant.payment_history,
        notes=tenant.notes,
        year_founded=tenant.year_founded,
        company_size=tenant.company_size,
        website=tenant.website,
        address=tenant.address,
        city=tenant.city,
        state=tenant.state,
        zip_code=tenant.zip_code,
        annual_revenue=tenant.annual_revenue,
        profit_margin=tenant.profit_margin,
        debt_to_equity_ratio=tenant.debt_to_equity_ratio,
        current_ratio=tenant.current_ratio,
        quick_ratio=tenant.quick_ratio,
        custom_fields=tenant.custom_fields
    )
    
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    
    return db_tenant


def update_tenant(db: Session, db_tenant: Tenant, tenant: TenantUpdate) -> Tenant:
    """
    Update an existing tenant.
    """
    # Update tenant fields if provided
    for key, value in tenant.dict(exclude_unset=True).items():
        setattr(db_tenant, key, value)
    
    db.commit()
    db.refresh(db_tenant)
    
    return db_tenant


def delete_tenant(db: Session, db_tenant: Tenant) -> None:
    """
    Delete a tenant.
    """
    db.delete(db_tenant)
    db.commit()


def add_satisfaction_record(
    db: Session, 
    db_tenant: Tenant, 
    record: SatisfactionRecordCreate
) -> SatisfactionRecord:
    """
    Add a satisfaction record for a tenant.
    """
    db_record = SatisfactionRecord(
        tenant_id=db_tenant.id,
        date=record.date,
        rating=record.rating,
        feedback=record.feedback,
        recorded_by=record.recorded_by
    )
    
    db.add(db_record)
    
    # Update tenant's satisfaction rating (average of all ratings)
    all_records = db_tenant.satisfaction_history + [db_record]
    avg_rating = sum(r.rating for r in all_records) / len(all_records)
    db_tenant.satisfaction_rating = avg_rating
    
    db.commit()
    db.refresh(db_record)
    
    return db_record


def add_communication_record(
    db: Session, 
    db_tenant: Tenant, 
    record: CommunicationRecordCreate
) -> CommunicationRecord:
    """
    Add a communication record for a tenant.
    """
    db_record = CommunicationRecord(
        tenant_id=db_tenant.id,
        date=record.date,
        type=record.type,
        subject=record.subject,
        description=record.description,
        outcome=record.outcome,
        follow_up_date=record.follow_up_date,
        contact_person=record.contact_person,
        recorded_by=record.recorded_by
    )
    
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    
    return db_record
