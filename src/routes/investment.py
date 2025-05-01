import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.investment_schema import InvestmentMemoRequest, InvestmentMemoResponse
from ..services.investment_service import generate_investment_memo
from ..services.deal_service import get_deal
from ..services.auth_service_db import get_current_active_user
from ..services.security_service import validate_deal_access
from ..services.activity_log_service import log_action

router = APIRouter()


@router.post("/generate-memo", response_model=InvestmentMemoResponse)
async def generate_memo_route(
    request: InvestmentMemoRequest,
    current_user: Optional[User] = Depends(get_current_active_user),
    db: Optional[Session] = Depends(get_db)
):
    """
    Generate an investment memo for a commercial real estate property

    Args:
        request: The investment memo request containing property details
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Investment memo response with the generated memo
    """
    # Log the action if user is authenticated
    if current_user and db:
        try:
            log_action(
                db=db,
                user_id=current_user.id,
                org_id=current_user.org_id,
                action="generate_memo",
                message=f"{current_user.name} generated an investment memo for a {request.property_type} property in {request.location}"
            )
        except ValueError:
            # Ignore errors in activity logging
            pass

    return await generate_investment_memo(request)


@router.post("/deals/{deal_id}/generate-memo", response_model=InvestmentMemoResponse)
async def generate_deal_memo_route(
    deal_id: str,
    style: Optional[str] = Query("detailed", description="Style of the memo (brief, detailed, pitch)"),
    format: Optional[str] = Query("markdown", description="Format of the memo (markdown, pdf)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate an investment memo for a specific deal

    This endpoint generates a professional investment memo for a deal, including:
    - Executive Summary
    - Deal Metrics (IRR, DSCR, NOI)
    - Red Flags (if any)
    - Exit Strategy
    - AI Recommendation

    The memo can be generated in different styles (brief, detailed, pitch) and formats (markdown, pdf).

    Args:
        deal_id: The ID of the deal
        style: Style of the memo (brief, detailed, pitch)
        format: Format of the memo (markdown, pdf)
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Investment memo response with the generated memo

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    # Check if user has appropriate role (Owner, Manager, or Admin)
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owners, Managers, and Admins can generate memos"
        )

    # Calculate NOI
    annual_rental_income = deal.projected_rent_per_sf * deal.square_footage * (1 - deal.vacancy_rate)
    noi = annual_rental_income - (deal.operating_expenses_per_sf * deal.square_footage)

    # Get red flags from underwriting_result if available
    red_flags = None
    if deal.underwriting_result:
        try:
            underwriting_data = json.loads(deal.underwriting_result)
            if "red_flags" in underwriting_data and underwriting_data["red_flags"]:
                red_flags = underwriting_data["red_flags"]
        except (json.JSONDecodeError, TypeError):
            pass

    # Create an investment memo request from the deal
    request = InvestmentMemoRequest(
        property_price=deal.acquisition_price + deal.construction_cost,
        rental_income=deal.projected_rent_per_sf * deal.square_footage * (1 - deal.vacancy_rate) / 12,  # Monthly rental income
        location=deal.location,
        property_type=deal.property_type,
        cap_rate=deal.exit_cap_rate,
        square_footage=int(deal.square_footage),
        tags=deal.tags_list if deal.tags else None,
        projected_irr=deal.projected_irr,
        dscr=deal.dscr,
        noi=noi,
        red_flags=red_flags,
        exit_strategy=f"Sell in year 5 at a {deal.exit_cap_rate:.2f}% cap rate",
        style=style,
        format=format
    )

    # Log the action
    try:
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=deal.org_id if deal.org_id else current_user.org_id,
            action="generate_memo",
            message=f"{current_user.name} generated an investment memo for deal: {deal.project_name}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Generate the memo
    return await generate_investment_memo(request)
