from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.budget_schema import BudgetAnalyzerRequest, BudgetAnalyzerResponse
from ..services.auth_service_db import get_current_active_user
from ..services.budget_service import analyze_budget
from ..services.security_service import validate_deal_access
from ..services.activity_log_service import log_action

router = APIRouter()

@router.post("/deals/{deal_id}/analyze-budget", response_model=BudgetAnalyzerResponse, tags=["Budget"])
async def analyze_budget_route(
    deal_id: str,
    request: BudgetAnalyzerRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Analyze a development budget for a deal
    
    This endpoint analyzes a development budget by categorizing line items,
    checking against industry benchmarks, and providing recommendations.
    
    Args:
        deal_id: The ID of the deal
        request: The budget analyzer request containing line items
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Budget analyzer response with total cost, category breakdown, red flags, and recommendations
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Check if user has appropriate role (Owner, Manager, or Admin)
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owners, Managers, and Admins can analyze budgets"
        )
    
    # Process the budget analysis
    response = await analyze_budget(
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
            action="analyze_budget",
            message=f"{current_user.name} analyzed budget for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    # Return the response
    return response
