"""
Debt Sizing Service for calculating maximum loan amount based on NOI and DSCR.
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from ..models.deal import Deal


def calculate_mortgage_constant(interest_rate: float, amortization_years: int) -> float:
    """
    Calculate the mortgage constant based on interest rate and amortization period.
    
    Args:
        interest_rate: Annual interest rate as a decimal (e.g., 0.065 for 6.5%)
        amortization_years: Amortization period in years
        
    Returns:
        Mortgage constant as a decimal
    """
    # Convert annual interest rate to monthly
    monthly_rate = interest_rate / 12
    
    # Calculate number of payments
    num_payments = amortization_years * 12
    
    # Calculate mortgage constant using the formula: c = (r(1+r)^n)/((1+r)^n-1)
    # Where c is the mortgage constant, r is the monthly interest rate, and n is the number of payments
    if monthly_rate > 0:
        mortgage_constant = (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
        annual_mortgage_constant = mortgage_constant * 12
    else:
        # If interest rate is 0, simply divide by the number of payments
        annual_mortgage_constant = 1 / amortization_years
    
    return annual_mortgage_constant


def calculate_debt_sizing(
    noi: float,
    interest_rate: float,
    dscr_target: float,
    amortization_years: int
) -> Dict[str, Any]:
    """
    Calculate the maximum loan amount based on NOI, interest rate, DSCR target, and amortization period.
    
    Args:
        noi: Net Operating Income (annual)
        interest_rate: Annual interest rate as a decimal (e.g., 0.065 for 6.5%)
        dscr_target: Debt Service Coverage Ratio target (e.g., 1.25)
        amortization_years: Amortization period in years
        
    Returns:
        Dictionary with max_loan_amount, monthly_payment, and annual_payment
    """
    # Calculate maximum annual debt service
    max_annual_debt_service = noi / dscr_target
    
    # Calculate mortgage constant
    mortgage_constant = calculate_mortgage_constant(interest_rate, amortization_years)
    
    # Calculate maximum loan amount
    max_loan_amount = max_annual_debt_service / mortgage_constant
    
    # Calculate monthly payment
    monthly_payment = max_loan_amount * mortgage_constant / 12
    
    # Calculate annual payment
    annual_payment = monthly_payment * 12
    
    return {
        "max_loan_amount": round(max_loan_amount, 2),
        "monthly_payment": round(monthly_payment, 2),
        "annual_payment": round(annual_payment, 2)
    }


def get_deal_noi(db: Session, deal_id: str) -> float:
    """
    Calculate the NOI for a deal from the database.
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        Net Operating Income (NOI)
    """
    # Get the deal from the database
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    
    if not deal:
        return 0
    
    # Calculate NOI
    gross_potential_income = deal.square_footage * deal.projected_rent_per_sf
    effective_gross_income = gross_potential_income * (1 - deal.vacancy_rate)
    operating_expenses = deal.square_footage * deal.operating_expenses_per_sf
    noi = effective_gross_income - operating_expenses
    
    return noi
