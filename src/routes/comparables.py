from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.comparables_schema import ComparablesRequest, ComparablesResponse
from ..services.auth_service_db import get_current_active_user
from ..services.comparables_service import generate_comparables
from ..services.security_service import validate_deal_access
from ..services.activity_log_service import log_action

router = APIRouter()

@router.post("/deals/{deal_id}/generate-comparables", response_model=ComparablesResponse, tags=["Comparables"])
async def generate_comparables_route(
    deal_id: str,
    request: Optional[ComparablesRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate comparables for a deal
    
    This endpoint generates comparable properties for a deal based on location, property type, and cap rate.
    It compares the subject property to similar properties in the market and provides a summary of the comparison.
    
    Args:
        deal_id: The ID of the deal
        request: Optional comparables request (if not provided, deal data will be used)
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Comparables response with subject cap rate, market average cap rate, delta in basis points, comparable properties, and summary
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Check if user has appropriate role (Owner, Manager, or Admin)
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owners, Managers, and Admins can generate comparables"
        )
    
    # Generate comparables
    response = await generate_comparables(
        db=db,
        deal_id=deal_id,
        request=request
    )
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="generate_comparables",
            message=f"{current_user.name} generated comparables for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    # Return the response
    return response
