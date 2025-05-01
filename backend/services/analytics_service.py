from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
from collections import defaultdict

from ..models import Lease, LeaseStatus, LeaseType, Asset, Tenant
from ..schemas.analytics import (
    PropertyTypeDistribution,
    LeaseExpirationTimeline,
    TenantConcentration,
    RentRollSummary
)
from .lease_service import calculate_rent_for_date


def get_property_type_distribution(
    db: Session, 
    asset_id: Optional[uuid.UUID] = None
) -> List[PropertyTypeDistribution]:
    """
    Get the distribution of rent by property type.
    """
    # Get all active leases
    query = db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE)
    
    if asset_id:
        query = query.filter(Lease.asset_id == asset_id)
    
    leases = query.all()
    
    # Calculate total rent
    now = datetime.utcnow()
    total_rent = sum(calculate_rent_for_date(lease, now) for lease in leases)
    
    # Group by property type
    property_types = {}
    
    for lease_type in LeaseType:
        type_leases = [lease for lease in leases if lease.lease_type == lease_type]
        type_rent = sum(calculate_rent_for_date(lease, now) for lease in type_leases)
        percentage = (type_rent / total_rent * 100) if total_rent > 0 else 0
        
        if type_rent > 0:
            property_types[lease_type.value] = {
                "name": lease_type.value,
                "value": type_rent,
                "percentage": percentage,
                "count": len(type_leases)
            }
    
    # Convert to list and sort by rent (descending)
    result = [PropertyTypeDistribution(**data) for data in property_types.values()]
    result.sort(key=lambda x: x.value, reverse=True)
    
    return result


def get_lease_expiration_timeline(
    db: Session, 
    asset_id: Optional[uuid.UUID] = None,
    years_ahead: int = 5
) -> List[LeaseExpirationTimeline]:
    """
    Get the timeline of lease expirations.
    """
    # Get all active leases
    query = db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE)
    
    if asset_id:
        query = query.filter(Lease.asset_id == asset_id)
    
    leases = query.all()
    
    # Group by year and quarter
    now = datetime.utcnow()
    max_date = now + timedelta(days=365 * years_ahead)
    
    expirations = defaultdict(lambda: {"count": 0, "rent": 0, "area": 0})
    
    for lease in leases:
        if lease.end_date <= max_date:
            year = lease.end_date.year
            quarter = (lease.end_date.month - 1) // 3 + 1
            period = f"{year} Q{quarter}"
            
            expirations[period]["count"] += 1
            expirations[period]["rent"] += lease.base_rent
            expirations[period]["area"] += lease.lease_area
            expirations[period]["year"] = year
            expirations[period]["quarter"] = quarter
            expirations[period]["timestamp"] = int(lease.end_date.timestamp())
    
    # Convert to list and sort by date
    result = []
    
    for period, data in expirations.items():
        result.append(LeaseExpirationTimeline(
            period=period,
            year=data["year"],
            quarter=data["quarter"],
            count=data["count"],
            rent=data["rent"],
            area=data["area"],
            timestamp=data["timestamp"]
        ))
    
    result.sort(key=lambda x: x.timestamp)
    
    return result


def get_tenant_concentration(
    db: Session, 
    asset_id: Optional[uuid.UUID] = None,
    top_n: int = 5
) -> List[TenantConcentration]:
    """
    Get the concentration of rent by tenant.
    """
    # Get all active leases
    query = db.query(Lease).filter(Lease.status == LeaseStatus.ACTIVE)
    
    if asset_id:
        query = query.filter(Lease.asset_id == asset_id)
    
    leases = query.all()
    
    # Calculate total rent
    now = datetime.utcnow()
    total_rent = sum(calculate_rent_for_date(lease, now) for lease in leases)
    
    # Group by tenant
    tenants = {}
    
    for lease in leases:
        tenant_id = str(lease.tenant_id)
        tenant_name = lease.tenant.name if lease.tenant else "Unknown"
        
        if tenant_id not in tenants:
            tenants[tenant_id] = {
                "id": tenant_id,
                "name": tenant_name,
                "rent": 0,
                "percentage": 0
            }
        
        tenants[tenant_id]["rent"] += calculate_rent_for_date(lease, now)
    
    # Calculate percentages
    for tenant_id, data in tenants.items():
        data["percentage"] = (data["rent"] / total_rent * 100) if total_rent > 0 else 0
    
    # Convert to list and sort by rent (descending)
    result = [TenantConcentration(**data) for data in tenants.values()]
    result.sort(key=lambda x: x.rent, reverse=True)
    
    # Take top N tenants and group the rest as "Others"
    if len(result) > top_n:
        top_tenants = result[:top_n]
        other_tenants = result[top_n:]
        
        other_rent = sum(tenant.rent for tenant in other_tenants)
        other_percentage = sum(tenant.percentage for tenant in other_tenants)
        
        top_tenants.append(TenantConcentration(
            id="others",
            name="Others",
            rent=other_rent,
            percentage=other_percentage
        ))
        
        return top_tenants
    
    return result


def get_rent_roll_summary(
    db: Session, 
    asset_id: Optional[uuid.UUID] = None
) -> RentRollSummary:
    """
    Get a summary of the rent roll data.
    """
    # Get all leases
    query = db.query(Lease)
    
    if asset_id:
        query = query.filter(Lease.asset_id == asset_id)
        
        # Get the asset for occupancy calculation
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        total_area = asset.total_area if asset else 0
    else:
        # Get total area of all assets
        total_area = db.query(func.sum(Asset.total_area)).scalar() or 0
    
    leases = query.all()
    active_leases = [lease for lease in leases if lease.status == LeaseStatus.ACTIVE]
    
    # Calculate metrics
    now = datetime.utcnow()
    ninety_days = now + timedelta(days=90)
    one_year = now + timedelta(days=365)
    
    total_monthly_rent = sum(calculate_rent_for_date(lease, now) for lease in active_leases)
    total_leased_area = sum(lease.lease_area for lease in active_leases)
    
    # Calculate average rent per sqft (annual)
    average_rent_per_sqft = (total_monthly_rent * 12 / total_leased_area) if total_leased_area > 0 else 0
    
    # Calculate occupancy rate
    occupancy_rate = (total_leased_area / total_area * 100) if total_area > 0 else 0
    
    # Count leases expiring soon
    expiring_within_90_days = sum(1 for lease in active_leases if lease.end_date <= ninety_days)
    expiring_within_year = sum(1 for lease in active_leases if lease.end_date <= one_year)
    
    # Get top property type
    property_types = get_property_type_distribution(db, asset_id)
    top_property_type = property_types[0].name if property_types else "N/A"
    top_property_type_percentage = property_types[0].percentage if property_types else 0
    
    return RentRollSummary(
        total_monthly_rent=total_monthly_rent,
        total_leased_area=total_leased_area,
        average_rent_per_sqft=average_rent_per_sqft,
        active_leases_count=len(active_leases),
        expiring_within_90_days=expiring_within_90_days,
        expiring_within_year=expiring_within_year,
        occupancy_rate=occupancy_rate,
        top_property_type=top_property_type,
        top_property_type_percentage=top_property_type_percentage
    )
