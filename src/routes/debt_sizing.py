"""
API routes for debt sizing calculations.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.debt_sizing_schema import DebtSizingRequest, DebtSizingResponse
from ..services.auth_service_db import get_current_active_user
from ..services.debt_sizing_service import calculate_debt_sizing, get_deal_noi
from ..services.security_service import validate_deal_access

router = APIRouter()


@router.post("/deals/{id}/debt-size", response_model=DebtSizingResponse)
async def calculate_debt_size(
    id: str,
    request: DebtSizingRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Calculate maximum loan amount based on deal inputs
    
    Args:
        id: Deal ID
        request: The debt sizing request containing NOI, interest rate, DSCR target, and amortization period
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Debt sizing response with maximum loan amount, monthly payment, and annual payment
    """
    # Validate deal access
    deal = validate_deal_access(db, id, current_user)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found or you don't have access to it"
        )
    
    # Convert interest rate from percentage to decimal
    interest_rate_decimal = request.interest_rate / 100
    
    # Use provided NOI or calculate from deal data
    noi = request.noi if request.noi > 0 else get_deal_noi(db, id)
    
    if noi <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NOI must be positive"
        )
    
    # Calculate debt sizing
    result = calculate_debt_sizing(
        noi=noi,
        interest_rate=interest_rate_decimal,
        dscr_target=request.dscr_target,
        amortization_years=request.amortization_years
    )
    
    return DebtSizingResponse(**result)
