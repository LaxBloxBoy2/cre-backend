from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.property_attributes_schema import PropertyAttributes, PropertyAttributesCreate, PropertyAttributesUpdate
from ..services.auth_service_db import get_current_active_user
from ..services.property_attributes_service import get_property_attributes, create_property_attributes, update_property_attributes
from ..services.security_service import validate_deal_access, can_edit_deal

router = APIRouter()

@router.get("/deals/{deal_id}/property-attributes", response_model=PropertyAttributes, tags=["Property Attributes"])
async def get_deal_property_attributes(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get property attributes for a deal
    
    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session
        
    Returns:
        Property attributes
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Get property attributes
    attributes = get_property_attributes(db, deal_id)
    if not attributes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property attributes not found"
        )
    
    return attributes

@router.post("/deals/{deal_id}/property-attributes", response_model=PropertyAttributes, tags=["Property Attributes"])
async def create_deal_property_attributes(
    deal_id: str,
    attributes: PropertyAttributesCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create property attributes for a deal
    
    Args:
        deal_id: Deal ID
        attributes: Property attributes data
        current_user: Current user
        db: Database session
        
    Returns:
        Created property attributes
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
        return create_property_attributes(db, deal_id, current_user.id, attributes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/deals/{deal_id}/property-attributes", response_model=PropertyAttributes, tags=["Property Attributes"])
async def update_deal_property_attributes(
    deal_id: str,
    attributes: PropertyAttributesUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update property attributes for a deal
    
    Args:
        deal_id: Deal ID
        attributes: Property attributes data
        current_user: Current user
        db: Database session
        
    Returns:
        Updated property attributes
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
        result = update_property_attributes(db, deal_id, current_user.id, attributes)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property attributes not found"
            )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
