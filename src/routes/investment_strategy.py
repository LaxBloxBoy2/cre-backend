from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.investment_strategy_service import get_investment_strategy, update_investment_strategy
from ..services.security_service import validate_deal_access, can_edit_deal

router = APIRouter()

class InvestmentStrategyResponse(BaseModel):
    """Response model for investment strategy"""
    strategy: str
    insights: List[str]

class InvestmentStrategyUpdate(BaseModel):
    """Update model for investment strategy"""
    strategy: str

@router.get("/deals/{deal_id}/investment-strategy", response_model=InvestmentStrategyResponse, tags=["Investment Strategy"])
async def get_deal_investment_strategy(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get investment strategy for a deal
    
    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session
        
    Returns:
        Investment strategy
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Get investment strategy
    strategy = get_investment_strategy(db, deal_id)
    if not strategy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investment strategy not found"
        )
    
    return strategy

@router.patch("/deals/{deal_id}/investment-strategy", response_model=InvestmentStrategyResponse, tags=["Investment Strategy"])
async def update_deal_investment_strategy(
    deal_id: str,
    strategy_update: InvestmentStrategyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update investment strategy for a deal
    
    Args:
        deal_id: Deal ID
        strategy_update: Investment strategy update
        current_user: Current user
        db: Database session
        
    Returns:
        Updated investment strategy
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
        result = update_investment_strategy(db, deal_id, current_user.id, strategy_update.strategy)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment strategy not found"
            )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
