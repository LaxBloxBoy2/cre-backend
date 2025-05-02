from fastapi import HTTPException, Depends
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from ..schemas.portfolio_schema import PortfolioSummaryResponse
from ..deal_service import get_deals
from ..auth_service_db import get_current_active_user
from ..schemas.user_schema import User

async def get_portfolio_summary(db: Session, user: Optional[User] = None) -> PortfolioSummaryResponse:
    """
    Generate a summary of portfolio metrics across all deals

    Args:
        db: Database session
        user: Optional user to filter deals by user ID

    Returns:
        Portfolio summary with aggregate metrics

    Raises:
        HTTPException: If there's an error generating the summary
    """
    try:
        # Get all deals, optionally filtered by user ID
        user_id = user.id if user else None
        deals = get_deals(db, user_id=user_id)

        # Check if there are any deals
        if not deals:
            return PortfolioSummaryResponse(
                total_deals=0,
                average_cap_rate=0.0,
                average_development_margin=0.0,
                total_gross_exit_value=0.0,
                average_project_cost=0.0,
                average_irr=0.0,
                average_dscr=0.0,
                user_id=user.id if user else None
            )

        # Calculate aggregate metrics
        total_deals = len(deals)

        # Initialize variables for calculations
        sum_cap_rate = 0.0
        sum_development_margin = 0.0
        total_exit_value = 0.0
        sum_project_cost = 0.0
        sum_irr = 0.0
        sum_dscr = 0.0

        # Count deals with valid metrics for averaging
        valid_cap_rate_count = 0
        valid_margin_count = 0
        valid_cost_count = 0
        valid_irr_count = 0
        valid_dscr_count = 0

        # Process each deal
        for deal in deals:
            # Extract metrics from underwriting_result if available
            if deal.underwriting_result:
                # Cap rate (using exit_cap_rate from the deal itself)
                if hasattr(deal, 'exit_cap_rate') and deal.exit_cap_rate is not None:
                    sum_cap_rate += deal.exit_cap_rate
                    valid_cap_rate_count += 1

                # Development margin
                if 'development_margin' in deal.underwriting_result:
                    margin = deal.underwriting_result['development_margin']
                    if margin is not None:
                        sum_development_margin += margin
                        valid_margin_count += 1

                # Exit value
                if 'estimated_exit_value' in deal.underwriting_result:
                    exit_value = deal.underwriting_result['estimated_exit_value']
                    if exit_value is not None:
                        total_exit_value += exit_value

                # Project cost
                if 'project_cost' in deal.underwriting_result:
                    cost = deal.underwriting_result['project_cost']
                    if cost is not None:
                        sum_project_cost += cost
                        valid_cost_count += 1

            # IRR and DSCR from the deal model
            if hasattr(deal, 'projected_irr') and deal.projected_irr is not None:
                sum_irr += deal.projected_irr
                valid_irr_count += 1

            if hasattr(deal, 'dscr') and deal.dscr is not None:
                sum_dscr += deal.dscr
                valid_dscr_count += 1

        # Calculate averages (avoid division by zero)
        average_cap_rate = sum_cap_rate / valid_cap_rate_count if valid_cap_rate_count > 0 else 0.0
        average_development_margin = sum_development_margin / valid_margin_count if valid_margin_count > 0 else 0.0
        average_project_cost = sum_project_cost / valid_cost_count if valid_cost_count > 0 else 0.0
        average_irr = sum_irr / valid_irr_count if valid_irr_count > 0 else 0.0
        average_dscr = sum_dscr / valid_dscr_count if valid_dscr_count > 0 else 0.0

        # Create and return the response
        return PortfolioSummaryResponse(
            total_deals=total_deals,
            average_cap_rate=average_cap_rate,
            average_development_margin=average_development_margin,
            total_gross_exit_value=total_exit_value,
            average_project_cost=average_project_cost,
            average_irr=average_irr,
            average_dscr=average_dscr,
            user_id=user.id if user else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating portfolio summary: {str(e)}")
