from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from fastapi import HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import uuid

from ..models.lease import Lease, Tenant, RenewalOption, LeaseStatus, LeaseType
from ..models.asset import Asset
from ..schemas.lease_schema import (
    LeaseCreate, LeaseUpdate, TenantCreate, TenantUpdate, RenewalOptionCreate,
    LeaseExpirationSummary, RentRollSummary, LeaseAnalytics, LeaseWithDetails
)


# Lease CRUD operations
def create_lease(db: Session, lease: LeaseCreate):
    """Create a new lease"""
    # Verify asset exists
    asset = db.query(Asset).filter(Asset.id == lease.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == lease.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Create lease
    db_lease = Lease(
        id=uuid.uuid4(),
        asset_id=lease.asset_id,
        tenant_id=lease.tenant_id,
        lease_type=lease.lease_type,
        start_date=lease.start_date,
        end_date=lease.end_date,
        base_rent=lease.base_rent,
        rent_escalation=lease.rent_escalation,
        security_deposit=lease.security_deposit,
        lease_area=lease.lease_area,
        status=lease.status,
        notes=lease.notes
    )
    db.add(db_lease)
    db.flush()  # Flush to get the lease ID

    # Create renewal options if provided
    if lease.renewal_options:
        for option in lease.renewal_options:
            db_option = RenewalOption(
                id=uuid.uuid4(),
                lease_id=db_lease.id,
                term=option.term,
                notice_required=option.notice_required,
                rent_increase=option.rent_increase
            )
            db.add(db_option)

    db.commit()
    db.refresh(db_lease)

    # Return lease with details
    return get_lease(db, str(db_lease.id))


def get_lease(db: Session, lease_id: str):
    """Get a lease by ID with tenant and renewal options"""
    try:
        uuid_id = uuid.UUID(lease_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lease ID format")

    lease = db.query(Lease).options(
        joinedload(Lease.tenant),
        joinedload(Lease.renewal_options),
        joinedload(Lease.asset)
    ).filter(Lease.id == uuid_id).first()

    if lease:
        # Add asset name to the response
        setattr(lease, 'asset_name', lease.asset.name if lease.asset else None)

    return lease


def update_lease(db: Session, lease_id: str, lease: LeaseUpdate):
    """Update a lease"""
    try:
        uuid_id = uuid.UUID(lease_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lease ID format")

    db_lease = db.query(Lease).filter(Lease.id == uuid_id).first()
    if not db_lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    # Update lease fields
    update_data = lease.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lease, key, value)

    # Update timestamps
    db_lease.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_lease)

    return get_lease(db, lease_id)


def delete_lease(db: Session, lease_id: str):
    """Delete a lease"""
    try:
        uuid_id = uuid.UUID(lease_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lease ID format")

    db_lease = db.query(Lease).filter(Lease.id == uuid_id).first()
    if not db_lease:
        raise HTTPException(status_code=404, detail="Lease not found")

    # Delete associated renewal options first
    db.query(RenewalOption).filter(RenewalOption.lease_id == uuid_id).delete()

    # Delete the lease
    db.delete(db_lease)
    db.commit()

    return True


def get_all_leases(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    tenant_id: Optional[str] = None,
    lease_type: Optional[str] = None
):
    """Get all leases with optional filtering"""
    query = db.query(Lease).options(
        joinedload(Lease.tenant),
        joinedload(Lease.renewal_options),
        joinedload(Lease.asset)
    )

    # Apply filters if provided
    if status:
        try:
            status_enum = LeaseStatus[status.upper()]
            query = query.filter(Lease.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if asset_id:
        try:
            uuid_asset_id = uuid.UUID(asset_id)
            query = query.filter(Lease.asset_id == uuid_asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")

    if tenant_id:
        try:
            uuid_tenant_id = uuid.UUID(tenant_id)
            query = query.filter(Lease.tenant_id == uuid_tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    if lease_type:
        try:
            type_enum = LeaseType[lease_type.upper()]
            query = query.filter(Lease.lease_type == type_enum)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid lease type: {lease_type}")

    # Apply pagination
    leases = query.offset(skip).limit(limit).all()

    # Add asset name to each lease
    for lease in leases:
        setattr(lease, 'asset_name', lease.asset.name if lease.asset else None)

    return leases


# Tenant CRUD operations
def create_tenant(db: Session, tenant: TenantCreate):
    """Create a new tenant"""
    # Create tenant with basic fields
    db_tenant = Tenant(
        id=uuid.uuid4(),
        name=tenant.name,
        contact_name=tenant.contact_name,
        contact_email=tenant.contact_email,
        contact_phone=tenant.contact_phone,
        industry=tenant.industry,
        credit_rating=tenant.credit_rating,
        payment_history=tenant.payment_history,
        notes=tenant.notes,

        # Additional company information
        year_founded=tenant.year_founded,
        company_size=tenant.company_size,
        website=tenant.website,
        address=tenant.address,
        city=tenant.city,
        state=tenant.state,
        zip_code=tenant.zip_code,

        # Financial health indicators
        annual_revenue=tenant.annual_revenue,
        profit_margin=tenant.profit_margin,
        debt_to_equity_ratio=tenant.debt_to_equity_ratio,
        current_ratio=tenant.current_ratio,
        quick_ratio=tenant.quick_ratio,

        # Satisfaction tracking
        satisfaction_rating=tenant.satisfaction_rating
    )
    db.add(db_tenant)
    db.flush()  # Flush to get the tenant ID

    # Create custom fields if provided
    if tenant.custom_fields:
        from ..models.custom_field import CustomField, FieldType

        for field in tenant.custom_fields:
            try:
                field_type = FieldType(field.field_type)
            except ValueError:
                field_type = FieldType.TEXT

            db_field = CustomField(
                id=uuid.uuid4(),
                tenant_id=db_tenant.id,
                name=field.name,
                value=field.value,
                field_type=field_type,
                options=field.options
            )
            db.add(db_field)

    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def get_tenant(db: Session, tenant_id: str, include_custom_fields: bool = False):
    """Get a tenant by ID"""
    try:
        uuid_id = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    tenant = db.query(Tenant).filter(Tenant.id == uuid_id).first()

    if tenant and include_custom_fields:
        # Get custom fields for the tenant
        from ..models.custom_field import CustomField
        custom_fields = db.query(CustomField).filter(CustomField.tenant_id == uuid_id).all()
        setattr(tenant, 'custom_fields', custom_fields)

    return tenant


def update_tenant(db: Session, tenant_id: str, tenant: TenantUpdate):
    """Update a tenant"""
    try:
        uuid_id = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    db_tenant = db.query(Tenant).filter(Tenant.id == uuid_id).first()
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Handle custom fields separately
    custom_fields = None
    if hasattr(tenant, 'custom_fields') and tenant.custom_fields is not None:
        custom_fields = tenant.custom_fields
        # Use model_dump instead of dict for Pydantic v2 compatibility
        update_data = tenant.model_dump(exclude={'custom_fields'}, exclude_unset=True)
    else:
        # Use model_dump instead of dict for Pydantic v2 compatibility
        update_data = tenant.model_dump(exclude_unset=True)

    # Update tenant fields
    for key, value in update_data.items():
        setattr(db_tenant, key, value)

    # Update timestamps
    db_tenant.updated_at = datetime.now(timezone.utc)

    # Handle custom fields if provided
    if custom_fields:
        from ..models.custom_field import CustomField, FieldType

        # Get existing custom fields
        existing_fields = db.query(CustomField).filter(CustomField.tenant_id == uuid_id).all()
        existing_field_names = {field.name: field for field in existing_fields}

        # Process each custom field
        for field in custom_fields:
            if field.name in existing_field_names:
                # Update existing field
                db_field = existing_field_names[field.name]

                # Update field type if provided
                if field.field_type:
                    try:
                        field_type = FieldType(field.field_type)
                        db_field.field_type = field_type
                    except ValueError:
                        pass

                # Update other fields
                if field.value is not None:
                    db_field.value = field.value
                if field.options is not None:
                    db_field.options = field.options
            else:
                # Create new field
                try:
                    field_type = FieldType(field.field_type)
                except ValueError:
                    field_type = FieldType.TEXT

                db_field = CustomField(
                    id=uuid.uuid4(),
                    tenant_id=uuid_id,
                    name=field.name,
                    value=field.value,
                    field_type=field_type,
                    options=field.options
                )
                db.add(db_field)

    db.commit()
    db.refresh(db_tenant)
    return db_tenant


def delete_tenant(db: Session, tenant_id: str):
    """Delete a tenant"""
    try:
        uuid_id = uuid.UUID(tenant_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tenant ID format")

    db_tenant = db.query(Tenant).filter(Tenant.id == uuid_id).first()
    if not db_tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Check if tenant has any leases
    lease_count = db.query(Lease).filter(Lease.tenant_id == uuid_id).count()
    if lease_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete tenant with active leases. Tenant has {lease_count} leases."
        )

    db.delete(db_tenant)
    db.commit()
    return True


def get_all_tenants(db: Session, skip: int = 0, limit: int = 100, include_custom_fields: bool = False):
    """Get all tenants"""
    tenants = db.query(Tenant).offset(skip).limit(limit).all()

    if include_custom_fields:
        # Get custom fields for each tenant
        from ..models.custom_field import CustomField
        for tenant in tenants:
            custom_fields = db.query(CustomField).filter(CustomField.tenant_id == tenant.id).all()
            setattr(tenant, 'custom_fields', custom_fields)

    return tenants


# Analytics functions
def calculate_lease_analytics(db: Session, asset_id: Optional[str] = None):
    """Calculate lease analytics"""
    # Base query
    query = db.query(Lease).options(
        joinedload(Lease.tenant),
        joinedload(Lease.asset)
    )

    # Apply asset filter if provided
    if asset_id:
        try:
            uuid_asset_id = uuid.UUID(asset_id)
            query = query.filter(Lease.asset_id == uuid_asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")

    # Get all leases for calculations
    all_leases = query.all()

    # Current date for calculations
    now = datetime.now(timezone.utc)

    # Calculate expiration summary
    expiring_30_days = 0
    expiring_90_days = 0
    expiring_180_days = 0
    expiring_365_days = 0
    expired = 0

    # Calculate rent roll summary
    total_monthly_rent = 0
    total_leased_area = 0
    active_leases = []

    # Calculate lease type distribution
    lease_type_distribution = {
        "Office": 0,
        "Retail": 0,
        "Industrial": 0,
        "Multifamily": 0,
        "Mixed-Use": 0
    }

    # Process each lease
    for lease in all_leases:
        # Update lease status based on current date
        if now < lease.start_date:
            lease.status = LeaseStatus.UPCOMING
        elif now > lease.end_date:
            lease.status = LeaseStatus.EXPIRED
            expired += 1
        else:
            lease.status = LeaseStatus.ACTIVE
            active_leases.append(lease)

            # Calculate days until expiration
            days_until_expiration = (lease.end_date - now).days

            # Update expiration counters
            if days_until_expiration <= 30:
                expiring_30_days += 1
            if days_until_expiration <= 90:
                expiring_90_days += 1
            if days_until_expiration <= 180:
                expiring_180_days += 1
            if days_until_expiration <= 365:
                expiring_365_days += 1

            # Update rent roll calculations
            total_monthly_rent += lease.base_rent
            total_leased_area += lease.lease_area

            # Update lease type distribution
            lease_type_str = lease.lease_type.value
            lease_type_distribution[lease_type_str] += 1

    # Calculate average rent per square foot (annual)
    avg_rent_per_sqft = 0
    if total_leased_area > 0:
        avg_rent_per_sqft = (total_monthly_rent * 12) / total_leased_area

    # Calculate occupancy rate
    occupancy_rate = 0
    if len(all_leases) > 0:
        occupancy_rate = (len(active_leases) / len(all_leases)) * 100

    # Get upcoming expirations (next 180 days)
    upcoming_expirations = get_upcoming_expirations(db, days=180, asset_id=asset_id)

    # Create response objects
    expiration_summary = LeaseExpirationSummary(
        expiring_30_days=expiring_30_days,
        expiring_90_days=expiring_90_days,
        expiring_180_days=expiring_180_days,
        expiring_365_days=expiring_365_days,
        expired=expired
    )

    rent_roll_summary = RentRollSummary(
        total_monthly_rent=total_monthly_rent,
        total_annual_rent=total_monthly_rent * 12,
        avg_rent_per_sqft=avg_rent_per_sqft,
        total_leased_area=total_leased_area,
        occupancy_rate=occupancy_rate
    )

    return LeaseAnalytics(
        expiration_summary=expiration_summary,
        rent_roll_summary=rent_roll_summary,
        lease_type_distribution=lease_type_distribution,
        upcoming_expirations=upcoming_expirations
    )


def get_upcoming_expirations(db: Session, days: int = 180, asset_id: Optional[str] = None):
    """Get upcoming lease expirations within specified days"""
    # Calculate date range
    now = datetime.now(timezone.utc)
    end_date = now + timedelta(days=days)

    # Base query
    query = db.query(Lease).options(
        joinedload(Lease.tenant),
        joinedload(Lease.asset)
    ).filter(
        and_(
            Lease.status == LeaseStatus.ACTIVE,
            Lease.end_date > now,
            Lease.end_date <= end_date
        )
    )

    # Apply asset filter if provided
    if asset_id:
        try:
            uuid_asset_id = uuid.UUID(asset_id)
            query = query.filter(Lease.asset_id == uuid_asset_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid asset ID format")

    # Order by expiration date (soonest first)
    leases = query.order_by(Lease.end_date).all()

    # Add asset name to each lease
    for lease in leases:
        setattr(lease, 'asset_name', lease.asset.name if lease.asset else None)

    return leases
