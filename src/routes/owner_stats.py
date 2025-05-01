from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from ..database import get_db
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.owner_stats_service import get_owner_hold_stats
from ..services.security_service import validate_deal_access

router = APIRouter()

class OwnerHoldStats(BaseModel):
    """Response model for owner hold statistics"""
    owner_name: str
    owner_type: Optional[str] = None
    current_hold: Optional[float] = None
    average_hold: Optional[float] = None
    portfolio_size: int
    property_types: List[str]
    locations: List[str]

@router.get("/deals/{deal_id}/owner-hold-stats", response_model=OwnerHoldStats, tags=["Owner Stats"])
async def get_deal_owner_hold_stats(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get owner hold statistics for a deal
    
    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session
        
    Returns:
        Owner hold statistics
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Get owner hold statistics
    stats = get_owner_hold_stats(db, deal_id)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner hold statistics not found"
        )
    
    return stats
