import json
import numpy as np
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from ..models.deal import Deal
from ..schemas.deal_schema import DealUpdate
from ..activity_log_service import log_action
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def run_underwriting(db: Session, deal_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """
    Run comprehensive underwriting for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Underwriting results or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to run underwriting: Deal not found - ID: {deal_id}")
        return None
    
    # Calculate underwriting metrics
    try:
        results = calculate_underwriting_metrics(deal)
        
        # Update deal with results
        deal.underwriting_result = json.dumps(results)
        deal.projected_irr = results.get("irr", {}).get("base_case")
        deal.dscr = results.get("dscr", {}).get("base_case")
        deal.updated_at = datetime.now(timezone.utc)
        deal.updated_by = user_id
        
        db.commit()
        db.refresh(deal)
        
        # Log the action
        try:
            log_action(
                db=db,
                user_id=user_id,
                org_id=deal.org_id,
                action="ran_underwriting",
                message=f"Ran underwriting for {deal.project_name}.",
                deal_id=deal_id
            )
        except ValueError:
            # Ignore errors in activity logging
            pass
        
        return results
    except Exception as e:
        logger.error(f"Error calculating underwriting metrics: {str(e)}")
        return None

def calculate_underwriting_metrics(deal: Deal) -> Dict[str, Any]:
    """
    Calculate comprehensive underwriting metrics for a deal
    
    Args:
        deal: Deal object
        
    Returns:
        Dictionary of underwriting metrics
    """
    # Extract deal parameters
    acquisition_price = deal.acquisition_price or 0
    construction_cost = deal.construction_cost or 0
    square_footage = deal.square_footage or 1  # Avoid division by zero
    projected_rent_per_sf = deal.projected_rent_per_sf or 0
    vacancy_rate = deal.vacancy_rate or 0
    operating_expenses_per_sf = deal.operating_expenses_per_sf or 0
    exit_cap_rate = deal.exit_cap_rate or 0.07  # Default to 7% if not provided
    
    # Calculate total project cost
    total_project_cost = acquisition_price + construction_cost
    
    # Calculate income metrics
    gross_potential_income = square_footage * projected_rent_per_sf
    effective_gross_income = gross_potential_income * (1 - vacancy_rate)
    operating_expenses = square_footage * operating_expenses_per_sf
    net_operating_income = effective_gross_income - operating_expenses
    
    # Calculate debt metrics
    loan_amount = total_project_cost * 0.65  # Assume 65% LTV
    interest_rate = 0.06  # Assume 6% interest rate
    amortization_years = 30
    loan_term_years = 10
    monthly_payment = calculate_monthly_payment(loan_amount, interest_rate, amortization_years)
    annual_debt_service = monthly_payment * 12
    dscr = net_operating_income / annual_debt_service if annual_debt_service > 0 else 0
    
    # Calculate IRR
    hold_period_years = 5
    annual_noi_growth = 0.03  # Assume 3% annual NOI growth
    irr = calculate_irr(
        total_project_cost,
        net_operating_income,
        annual_noi_growth,
        exit_cap_rate,
        hold_period_years
    )
    
    # Calculate sensitivity analysis
    exit_cap_sensitivity = calculate_exit_cap_sensitivity(
        total_project_cost,
        net_operating_income,
        annual_noi_growth,
        exit_cap_rate,
        hold_period_years
    )
    
    rent_sensitivity = calculate_rent_sensitivity(
        total_project_cost,
        square_footage,
        projected_rent_per_sf,
        vacancy_rate,
        operating_expenses_per_sf,
        annual_noi_growth,
        exit_cap_rate,
        hold_period_years
    )
    
    # Calculate value-add potential
    value_add_potential = calculate_value_add_potential(
        acquisition_price,
        construction_cost,
        net_operating_income,
        exit_cap_rate
    )
    
    # Return comprehensive results
    return {
        "income": {
            "gross_potential_income": round(gross_potential_income, 2),
            "effective_gross_income": round(effective_gross_income, 2),
            "operating_expenses": round(operating_expenses, 2),
            "net_operating_income": round(net_operating_income, 2)
        },
        "debt": {
            "loan_amount": round(loan_amount, 2),
            "interest_rate": interest_rate,
            "amortization_years": amortization_years,
            "loan_term_years": loan_term_years,
            "annual_debt_service": round(annual_debt_service, 2)
        },
        "dscr": {
            "base_case": round(dscr, 2),
            "stress_test_90pct_occupancy": round(dscr * 0.9, 2),
            "stress_test_80pct_occupancy": round(dscr * 0.8, 2)
        },
        "irr": {
            "base_case": round(irr * 100, 2),  # Convert to percentage
            "upside_case": round(irr * 1.2 * 100, 2),  # 20% better
            "downside_case": round(irr * 0.8 * 100, 2)  # 20% worse
        },
        "exit_cap_sensitivity": exit_cap_sensitivity,
        "rent_sensitivity": rent_sensitivity,
        "value_add_potential": value_add_potential,
        "metrics_per_sf": {
            "acquisition_price_per_sf": round(acquisition_price / square_footage, 2),
            "construction_cost_per_sf": round(construction_cost / square_footage, 2),
            "total_cost_per_sf": round(total_project_cost / square_footage, 2),
            "rent_per_sf": round(projected_rent_per_sf, 2),
            "operating_expenses_per_sf": round(operating_expenses_per_sf, 2),
            "noi_per_sf": round(net_operating_income / square_footage, 2)
        }
    }

def calculate_monthly_payment(loan_amount: float, annual_interest_rate: float, amortization_years: int) -> float:
    """
    Calculate monthly loan payment
    
    Args:
        loan_amount: Loan amount
        annual_interest_rate: Annual interest rate (decimal)
        amortization_years: Amortization period in years
        
    Returns:
        Monthly payment
    """
    monthly_interest_rate = annual_interest_rate / 12
    num_payments = amortization_years * 12
    
    if monthly_interest_rate == 0:
        return loan_amount / num_payments
    
    return loan_amount * (monthly_interest_rate * (1 + monthly_interest_rate) ** num_payments) / ((1 + monthly_interest_rate) ** num_payments - 1)

def calculate_irr(
    total_cost: float,
    initial_noi: float,
    annual_noi_growth: float,
    exit_cap_rate: float,
    hold_period_years: int
) -> float:
    """
    Calculate IRR for a real estate investment
    
    Args:
        total_cost: Total project cost
        initial_noi: Initial annual NOI
        annual_noi_growth: Annual NOI growth rate
        exit_cap_rate: Exit capitalization rate
        hold_period_years: Hold period in years
        
    Returns:
        IRR as a decimal
    """
    # Create cash flow array
    cash_flows = [-total_cost]  # Initial investment (negative)
    
    # Annual NOI
    for year in range(1, hold_period_years + 1):
        noi = initial_noi * (1 + annual_noi_growth) ** (year - 1)
        if year == hold_period_years:
            # Add sale proceeds in final year
            final_noi = initial_noi * (1 + annual_noi_growth) ** hold_period_years
            sale_price = final_noi / exit_cap_rate
            cash_flows.append(noi + sale_price)
        else:
            cash_flows.append(noi)
    
    # Calculate IRR
    try:
        irr = np.irr(cash_flows)
        return max(irr, 0)  # Ensure non-negative IRR
    except:
        return 0.10  # Default to 10% if calculation fails

def calculate_exit_cap_sensitivity(
    total_cost: float,
    initial_noi: float,
    annual_noi_growth: float,
    base_exit_cap_rate: float,
    hold_period_years: int
) -> Dict[str, Any]:
    """
    Calculate sensitivity to exit cap rate
    
    Args:
        total_cost: Total project cost
        initial_noi: Initial annual NOI
        annual_noi_growth: Annual NOI growth rate
        base_exit_cap_rate: Base exit capitalization rate
        hold_period_years: Hold period in years
        
    Returns:
        Dictionary of exit cap rate sensitivity
    """
    sensitivity = {}
    
    # Test different exit cap rates
    cap_rates = [
        base_exit_cap_rate - 0.01,  # 100 bps lower
        base_exit_cap_rate - 0.005,  # 50 bps lower
        base_exit_cap_rate,
        base_exit_cap_rate + 0.005,  # 50 bps higher
        base_exit_cap_rate + 0.01  # 100 bps higher
    ]
    
    for cap_rate in cap_rates:
        if cap_rate <= 0:
            continue
            
        irr = calculate_irr(
            total_cost,
            initial_noi,
            annual_noi_growth,
            cap_rate,
            hold_period_years
        )
        
        # Format cap rate as string (e.g., "6.5%")
        cap_rate_str = f"{cap_rate * 100:.1f}%"
        sensitivity[cap_rate_str] = round(irr * 100, 2)  # Convert to percentage
    
    return sensitivity

def calculate_rent_sensitivity(
    total_cost: float,
    square_footage: float,
    base_rent_per_sf: float,
    vacancy_rate: float,
    operating_expenses_per_sf: float,
    annual_noi_growth: float,
    exit_cap_rate: float,
    hold_period_years: int
) -> Dict[str, Any]:
    """
    Calculate sensitivity to rent per square foot
    
    Args:
        total_cost: Total project cost
        square_footage: Square footage
        base_rent_per_sf: Base rent per square foot
        vacancy_rate: Vacancy rate
        operating_expenses_per_sf: Operating expenses per square foot
        annual_noi_growth: Annual NOI growth rate
        exit_cap_rate: Exit capitalization rate
        hold_period_years: Hold period in years
        
    Returns:
        Dictionary of rent sensitivity
    """
    sensitivity = {}
    
    # Test different rent levels
    rent_factors = [0.9, 0.95, 1.0, 1.05, 1.1]  # -10%, -5%, base, +5%, +10%
    
    for factor in rent_factors:
        rent = base_rent_per_sf * factor
        
        # Calculate NOI
        gross_potential_income = square_footage * rent
        effective_gross_income = gross_potential_income * (1 - vacancy_rate)
        operating_expenses = square_footage * operating_expenses_per_sf
        noi = effective_gross_income - operating_expenses
        
        irr = calculate_irr(
            total_cost,
            noi,
            annual_noi_growth,
            exit_cap_rate,
            hold_period_years
        )
        
        # Format rent as string (e.g., "$25.00/SF")
        rent_str = f"${rent:.2f}/SF"
        sensitivity[rent_str] = round(irr * 100, 2)  # Convert to percentage
    
    return sensitivity

def calculate_value_add_potential(
    acquisition_price: float,
    construction_cost: float,
    noi: float,
    exit_cap_rate: float
) -> Dict[str, Any]:
    """
    Calculate value-add potential
    
    Args:
        acquisition_price: Acquisition price
        construction_cost: Construction cost
        noi: Net operating income
        exit_cap_rate: Exit capitalization rate
        
    Returns:
        Dictionary of value-add metrics
    """
    # Calculate metrics
    total_cost = acquisition_price + construction_cost
    stabilized_value = noi / exit_cap_rate if exit_cap_rate > 0 else 0
    value_creation = stabilized_value - total_cost
    value_creation_percentage = (value_creation / total_cost) * 100 if total_cost > 0 else 0
    
    # Determine value-add category
    if value_creation_percentage < 5:
        category = "Low"
        description = "Limited value creation potential"
    elif value_creation_percentage < 15:
        category = "Medium"
        description = "Moderate value creation potential"
    else:
        category = "High"
        description = "Significant value creation potential"
    
    return {
        "stabilized_value": round(stabilized_value, 2),
        "value_creation": round(value_creation, 2),
        "value_creation_percentage": round(value_creation_percentage, 2),
        "category": category,
        "description": description
    }
