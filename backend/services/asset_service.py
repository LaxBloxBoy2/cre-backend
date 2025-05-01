from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..models import Asset
from ..schemas.asset import AssetCreate, AssetUpdate


def get_all_assets(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    asset_type: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None
) -> List[Asset]:
    """
    Get all assets with optional filtering.
    """
    query = db.query(Asset)
    
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    
    if city:
        query = query.filter(Asset.city.ilike(f"%{city}%"))
    
    if state:
        query = query.filter(Asset.state == state)
    
    return query.offset(skip).limit(limit).all()


def get_asset_by_id(db: Session, asset_id: uuid.UUID) -> Optional[Asset]:
    """
    Get a specific asset by ID.
    """
    return db.query(Asset).filter(Asset.id == asset_id).first()


def create_asset(db: Session, asset: AssetCreate) -> Asset:
    """
    Create a new asset.
    """
    db_asset = Asset(
        name=asset.name,
        asset_type=asset.asset_type,
        address=asset.address,
        city=asset.city,
        state=asset.state,
        zip_code=asset.zip_code,
        total_area=asset.total_area,
        year_built=asset.year_built,
        floors=asset.floors,
        units=asset.units,
        purchase_price=asset.purchase_price,
        current_value=asset.current_value,
        annual_taxes=asset.annual_taxes,
        annual_insurance=asset.annual_insurance,
        custom_fields=asset.custom_fields
    )
    
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    return db_asset


def update_asset(db: Session, db_asset: Asset, asset: AssetUpdate) -> Asset:
    """
    Update an existing asset.
    """
    # Update asset fields if provided
    for key, value in asset.dict(exclude_unset=True).items():
        setattr(db_asset, key, value)
    
    db.commit()
    db.refresh(db_asset)
    
    return db_asset


def delete_asset(db: Session, db_asset: Asset) -> None:
    """
    Delete an asset.
    """
    db.delete(db_asset)
    db.commit()
