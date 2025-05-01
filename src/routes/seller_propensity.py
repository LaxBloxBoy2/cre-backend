from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.seller_propensity_service import get_seller_propensity, update_seller_propensity, generate_seller_propensity
from ..services.security_service import validate_deal_access, can_edit_deal

router = APIRouter()

class SellerPropensityResponse(BaseModel):
    """Response model for seller propensity"""
    propensity: str
    reason: Optional[str] = None

class SellerPropensityUpdate(BaseModel):
    """Update model for seller propensity"""
    propensity: str
    reason: Optional[str] = None

@router.get("/deals/{deal_id}/seller-propensity", response_model=SellerPropensityResponse, tags=["Seller Propensity"])
async def get_deal_seller_propensity(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get seller propensity for a deal
    
    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session
        
    Returns:
        Seller propensity
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Get seller propensity
    propensity = get_seller_propensity(db, deal_id)
    if not propensity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller propensity not found"
        )
    
    return propensity

@router.post("/deals/{deal_id}/generate-propensity", response_model=SellerPropensityResponse, tags=["Seller Propensity"])
async def generate_deal_propensity(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate seller propensity for a deal
    
    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session
        
    Returns:
        Generated seller propensity
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Generate seller propensity
    propensity, reason = generate_seller_propensity(db, deal)
    
    # Update the deal with the generated propensity
    result = update_seller_propensity(db, deal_id, current_user.id, propensity, reason)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failed to update seller propensity"
        )
    
    return result

@router.patch("/deals/{deal_id}/seller-propensity", response_model=SellerPropensityResponse, tags=["Seller Propensity"])
async def update_deal_seller_propensity(
    deal_id: str,
    propensity_update: SellerPropensityUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update seller propensity for a deal
    
    Args:
        deal_id: Deal ID
        propensity_update: Seller propensity update
        current_user: Current user
        db: Database session
        
    Returns:
        Updated seller propensity
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access and check if user can edit
    deal = validate_deal_access(db, deal_id, current_user)
    if not can_edit_deal(db, deal, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to edit this deal"
        )
    
    try:
        result = update_seller_propensity(
            db, 
            deal_id, 
            current_user.id, 
            propensity_update.propensity, 
            propensity_update.reason
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Seller propensity not found"
            )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
