from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.financing_schema import (
    TermSheetRequest,
    TermSheetResponse,
    TermSummaryRequest,
    TermSummaryResponse
)
from ..services.auth_service_db import get_current_active_user
from ..services.financing_service import build_term_sheet, generate_term_summary
from ..services.security_service import validate_deal_access, can_edit_deal
from ..services.activity_log_service import log_action
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

@router.post("/deals/{deal_id}/build-terms", response_model=TermSheetResponse, tags=["Financing"])
async def build_terms_route(
    deal_id: str,
    request: TermSheetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Build a term sheet for a deal
    
    This endpoint calculates financial projections based on the provided loan and equity parameters.
    It returns a detailed term sheet with debt service, cash flow projections, promote waterfall splits,
    and estimated LP IRR.
    
    Args:
        deal_id: The ID of the deal
        request: The term sheet request with financing parameters
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Term sheet response with calculated values
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Check if user has appropriate role (Owner, Manager, or Admin)
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owners, Managers, and Admins can build term sheets"
        )
    
    # Build the term sheet
    term_sheet = build_term_sheet(request)
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="build_terms",
            message=f"{current_user.name} built a term sheet for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    # Return the term sheet
    return term_sheet

@router.post("/deals/{deal_id}/generate-term-summary", response_model=TermSummaryResponse, tags=["Financing"])
async def generate_term_summary_route(
    deal_id: str,
    request: TermSummaryRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate a summary of a term sheet for a deal
    
    This endpoint generates a pitch-style summary of a term sheet, highlighting the key financial metrics
    and investment opportunity. It uses AI to create a compelling narrative based on the term sheet data.
    
    Args:
        deal_id: The ID of the deal
        request: The term summary request with term sheet data
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Term summary response with LP IRR, equity multiple, and summary
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Check if user has appropriate role (Owner, Manager, or Admin)
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owners, Managers, and Admins can generate term summaries"
        )
    
    # Generate the term summary
    term_summary = await generate_term_summary(
        request=request,
        db=db,
        deal_id=deal_id
    )
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="generate_term_summary",
            message=f"{current_user.name} generated a term summary for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    # Return the term summary
    return term_summary
