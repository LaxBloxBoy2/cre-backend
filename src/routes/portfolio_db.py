from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session
from ..schemas.portfolio_schema import PortfolioSummaryResponse
from ..services.portfolio_service import get_portfolio_summary
from ..services.auth_service_db import get_current_active_user
from ..schemas.user_schema import User
from ..database import get_db

router = APIRouter()


@router.get("/portfolio-summary", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary_route(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a summary of portfolio metrics across all deals
    
    If the user is not an admin, returns metrics for the current user's deals only.
    If the user is an admin, returns metrics for all deals.
    
    Args:
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Portfolio summary with aggregate metrics
    """
    # If user is not an admin, filter by user ID
    if current_user.role != "Admin":
        return await get_portfolio_summary(db, user=current_user)
    
    # Otherwise, return summary for all deals
    return await get_portfolio_summary(db)
