import json
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.deal import Deal
from ..models.user import User
from ..schemas.visibility_schema import VisibilityUpdate, VisibilityResponse
from ..security_service import can_edit_deal
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def update_deal_visibility(
    db: Session,
    deal_id: str,
    visibility_update: VisibilityUpdate,
    current_user: User
) -> VisibilityResponse:
    """
    Update the visibility settings for a deal
    
    Args:
        db: Database session
        deal_id: The ID of the deal to update
        visibility_update: The visibility update data
        current_user: The current user
        
    Returns:
        Visibility response with updated settings
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Deal not found - ID: {deal_id}, requested by user: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Check if the user can edit the deal
    if not can_edit_deal(current_user, deal):
        logger.warning(
            f"Unauthorized visibility update attempt - User: {current_user.id} "
            f"tried to update visibility for deal: {deal.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update visibility settings for this deal"
        )
    
    # Update visibility
    deal.visibility = visibility_update.visibility
    
    # Update shared_with_user_ids
    if visibility_update.shared_with is not None:
        # Validate that all shared users exist
        if visibility_update.shared_with:
            validate_shared_users(db, visibility_update.shared_with)
        
        # Update shared_with_user_ids
        deal.shared_with_users = visibility_update.shared_with
    
    # Save changes
    db.commit()
    
    # Return response
    return VisibilityResponse(
        success=True,
        message="Visibility settings updated successfully",
        visibility=deal.visibility,
        shared_with=deal.shared_with_users
    )

def validate_shared_users(db: Session, user_ids: List[str]) -> None:
    """
    Validate that all shared users exist
    
    Args:
        db: Database session
        user_ids: List of user IDs to validate
        
    Raises:
        HTTPException: If any user ID is invalid
    """
    for user_id in user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user ID: {user_id}"
            )

def get_deal_with_visibility(db: Session, deal: Deal, current_user: User) -> Deal:
    """
    Add visibility information to a deal
    
    Args:
        db: Database session
        deal: The deal to enhance
        current_user: The current user
        
    Returns:
        Deal with can_edit flag set
    """
    # Set can_edit flag
    deal.can_edit = can_edit_deal(current_user, deal)
    
    return deal
