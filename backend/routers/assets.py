from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from ..database import get_db
from ..models import Asset
from ..schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from ..services.asset_service import (
    get_all_assets,
    get_asset_by_id,
    create_asset,
    update_asset,
    delete_asset
)

router = APIRouter(
    prefix="/assets",
    tags=["assets"]
)


@router.get("/", response_model=List[AssetResponse])
def read_assets(
    skip: int = 0, 
    limit: int = 100,
    asset_type: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all assets with optional filtering.
    """
    return get_all_assets(
        db, 
        skip=skip, 
        limit=limit, 
        asset_type=asset_type,
        city=city,
        state=state
    )


@router.get("/{asset_id}", response_model=AssetResponse)
def read_asset(asset_id: str, db: Session = Depends(get_db)):
    """
    Get a specific asset by ID.
    """
    try:
        asset_uuid = uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    asset = get_asset_by_id(db, asset_uuid)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return asset


@router.post("/", response_model=AssetResponse)
def create_new_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    """
    Create a new asset.
    """
    return create_asset(db, asset)


@router.put("/{asset_id}", response_model=AssetResponse)
def update_existing_asset(asset_id: str, asset: AssetUpdate, db: Session = Depends(get_db)):
    """
    Update an existing asset.
    """
    try:
        asset_uuid = uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    db_asset = get_asset_by_id(db, asset_uuid)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    return update_asset(db, db_asset, asset)


@router.delete("/{asset_id}")
def delete_existing_asset(asset_id: str, db: Session = Depends(get_db)):
    """
    Delete an asset.
    """
    try:
        asset_uuid = uuid.UUID(asset_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid asset ID format")
    
    db_asset = get_asset_by_id(db, asset_uuid)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    delete_asset(db, db_asset)
    
    return {"message": "Asset deleted successfully"}
