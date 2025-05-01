from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.enhanced_underwriting_service import run_underwriting
from ..services.security_service import validate_deal_access, can_edit_deal
from ..utils.limiter import limiter
from fastapi import Request

router = APIRouter()

class UnderwritingRequest(BaseModel):
    """Request model for underwriting"""
    deal_id: str

class UnderwritingResponse(BaseModel):
    """Response model for underwriting"""
    income: Dict[str, Any]
    debt: Dict[str, Any]
    dscr: Dict[str, Any]
    irr: Dict[str, Any]
    exit_cap_sensitivity: Dict[str, Any]
    rent_sensitivity: Dict[str, Any]
    value_add_potential: Dict[str, Any]
    metrics_per_sf: Dict[str, Any]

@router.post("/underwrite", response_model=UnderwritingResponse, tags=["Underwriting"])
@limiter.limit("5/minute")
async def run_underwriting_route(
    request: Request,
    underwriting_request: UnderwritingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Run comprehensive underwriting for a deal
    
    Args:
        underwriting_request: Underwriting request with deal_id
        current_user: Current user
        db: Database session
        
    Returns:
        Underwriting results
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access and check if user can edit
    deal = validate_deal_access(db, underwriting_request.deal_id, current_user)
    if not can_edit_deal(db, deal, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to run underwriting for this deal"
        )
    
    # Run underwriting
    result = run_underwriting(db, underwriting_request.deal_id, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to run underwriting"
        )
    
    return result
