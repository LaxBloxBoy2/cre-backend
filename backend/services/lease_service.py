from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..models import Lease, LeaseStatus, RenewalOption
from ..schemas.lease import LeaseCreate, LeaseUpdate, RenewalOptionCreate


def get_all_leases(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    tenant_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    lease_type: Optional[str] = None
) -> List[Lease]:
    """
    Get all leases with optional filtering.
    """
    query = db.query(Lease)
    
    if status:
        query = query.filter(Lease.status == status)
    
    if tenant_id:
        try:
            tenant_uuid = uuid.UUID(tenant_id)
            query = query.filter(Lease.tenant_id == tenant_uuid)
        except ValueError:
            pass
    
    if asset_id:
        try:
            asset_uuid = uuid.UUID(asset_id)
            query = query.filter(Lease.asset_id == asset_uuid)
        except ValueError:
            pass
    
    if lease_type:
        query = query.filter(Lease.lease_type == lease_type)
    
    return query.offset(skip).limit(limit).all()


def get_lease_by_id(db: Session, lease_id: uuid.UUID) -> Optional[Lease]:
    """
    Get a specific lease by ID.
    """
    return db.query(Lease).filter(Lease.id == lease_id).first()


def create_lease(db: Session, lease: LeaseCreate) -> Lease:
    """
    Create a new lease.
    """
    # Determine initial status based on dates
    status = determine_lease_status(lease.start_date, lease.end_date)
    
    # Create the lease
    db_lease = Lease(
        asset_id=lease.asset_id,
        tenant_id=lease.tenant_id,
        lease_type=lease.lease_type,
        start_date=lease.start_date,
        end_date=lease.end_date,
        base_rent=lease.base_rent,
        rent_escalation=lease.rent_escalation,
        security_deposit=lease.security_deposit,
        lease_area=lease.lease_area,
        status=status,
        notes=lease.notes
    )
    
    db.add(db_lease)
    db.flush()  # Flush to get the ID
    
    # Add renewal options if provided
    if lease.renewal_options:
        for option in lease.renewal_options:
            db_option = RenewalOption(
                lease_id=db_lease.id,
                term=option.term,
                notice_required=option.notice_required,
                rent_increase=option.rent_increase
            )
            db.add(db_option)
    
    db.commit()
    db.refresh(db_lease)
    
    return db_lease


def update_lease(db: Session, db_lease: Lease, lease: LeaseUpdate) -> Lease:
    """
    Update an existing lease.
    """
    # Update lease fields if provided
    if lease.lease_type is not None:
        db_lease.lease_type = lease.lease_type
    
    if lease.start_date is not None:
        db_lease.start_date = lease.start_date
    
    if lease.end_date is not None:
        db_lease.end_date = lease.end_date
    
    if lease.base_rent is not None:
        db_lease.base_rent = lease.base_rent
    
    if lease.rent_escalation is not None:
        db_lease.rent_escalation = lease.rent_escalation
    
    if lease.security_deposit is not None:
        db_lease.security_deposit = lease.security_deposit
    
    if lease.lease_area is not None:
        db_lease.lease_area = lease.lease_area
    
    if lease.status is not None:
        db_lease.status = lease.status
    else:
        # Recalculate status based on dates
        db_lease.status = determine_lease_status(db_lease.start_date, db_lease.end_date)
    
    if lease.notes is not None:
        db_lease.notes = lease.notes
    
    # Update renewal options if provided
    if lease.renewal_options is not None:
        # Delete existing options
        db.query(RenewalOption).filter(RenewalOption.lease_id == db_lease.id).delete()
        
        # Add new options
        for option in lease.renewal_options:
            db_option = RenewalOption(
                lease_id=db_lease.id,
                term=option.term,
                notice_required=option.notice_required,
                rent_increase=option.rent_increase
            )
            db.add(db_option)
    
    db.commit()
    db.refresh(db_lease)
    
    return db_lease


def delete_lease(db: Session, db_lease: Lease) -> None:
    """
    Delete a lease.
    """
    db.delete(db_lease)
    db.commit()


def determine_lease_status(start_date: datetime, end_date: datetime) -> LeaseStatus:
    """
    Determine the status of a lease based on its start and end dates.
    """
    now = datetime.utcnow()
    
    if now < start_date:
        return LeaseStatus.UPCOMING
    elif now > end_date:
        return LeaseStatus.EXPIRED
    else:
        return LeaseStatus.ACTIVE


def update_lease_status(lease: Lease) -> Lease:
    """
    Update the status of a lease based on its start and end dates.
    """
    lease.status = determine_lease_status(lease.start_date, lease.end_date)
    return lease


def calculate_rent_for_date(lease: Lease, date: datetime) -> float:
    """
    Calculate the rent for a specific date, taking into account rent escalations.
    """
    # If the lease hasn't started or has expired, return 0
    if date < lease.start_date or date > lease.end_date:
        return 0
    
    # Calculate years since lease start
    years_since_start = (date.year - lease.start_date.year) + (date.month - lease.start_date.month) / 12
    
    # Apply rent escalation
    rent = lease.base_rent * (1 + lease.rent_escalation / 100) ** int(years_since_start)
    
    return rent
