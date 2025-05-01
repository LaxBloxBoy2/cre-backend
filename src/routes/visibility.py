from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.visibility_schema import VisibilityUpdate, VisibilityResponse
from ..services.auth_service_db import get_current_active_user
from ..services.visibility_service import update_deal_visibility
from ..services.activity_log_service import log_action
from ..services.security_service import validate_deal_access

router = APIRouter()

@router.put("/deals/{deal_id}/visibility", response_model=VisibilityResponse, tags=["Visibility"])
async def update_visibility_route(
    deal_id: str,
    visibility_update: VisibilityUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update the visibility settings for a deal
    
    This endpoint allows Owners, Managers, and Admins to update the visibility settings for a deal.
    Visibility can be set to 'internal' (only the owner can see), 'team' (all team members can see),
    or 'lp_view' (limited partners can see). The deal can also be shared with specific users.
    
    Args:
        deal_id: The ID of the deal to update
        visibility_update: The visibility update data
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Visibility response with updated settings
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Check if user has appropriate role (Owner, Manager, or Admin)
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owners, Managers, and Admins can update visibility settings"
        )
    
    # Update visibility
    response = update_deal_visibility(
        db=db,
        deal_id=deal_id,
        visibility_update=visibility_update,
        current_user=current_user
    )
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="update_visibility",
            message=f"{current_user.name} updated visibility settings for deal: {deal.project_name} to {visibility_update.visibility}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    # Return the response
    return response
