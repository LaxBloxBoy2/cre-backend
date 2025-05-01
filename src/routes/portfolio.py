from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from ..schemas.portfolio_schema import PortfolioSummaryResponse
from ..services.portfolio_service import get_portfolio_summary
from ..services.auth_service import get_current_user, get_current_active_user
from ..schemas.auth_schema import User

router = APIRouter()


@router.get("/portfolio-summary", response_model=PortfolioSummaryResponse)
async def get_portfolio_summary_route(current_user: Optional[User] = Depends(get_current_user)):
    """
    Get a summary of portfolio metrics across all deals
    
    If authenticated, returns metrics for the current user's deals only.
    If not authenticated or if the user is an admin, returns metrics for all deals.
    
    Returns:
        Portfolio summary with aggregate metrics
    """
    # If user is authenticated and not an admin, filter by user ID
    if current_user and current_user.role != "Admin":
        return await get_portfolio_summary(user=current_user)
    
    # Otherwise, return summary for all deals
    return await get_portfolio_summary()
