import os
import json
import requests
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..schemas.financing_schema import (
    TermSheetRequest,
    TermSheetResponse,
    CashFlowYear,
    WaterfallTier,
    TermSummaryRequest,
    TermSummaryResponse
)
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def build_term_sheet(request: TermSheetRequest) -> TermSheetResponse:
    """
    Build a term sheet based on the provided financing parameters
    
    Args:
        request: Term sheet request with financing parameters
        
    Returns:
        Term sheet response with calculated values
    """
    try:
        # Calculate total project cost
        total_project_cost = request.loan_amount + request.equity_investment
        
        # Calculate loan-to-cost ratio
        loan_to_cost = request.loan_amount / total_project_cost if total_project_cost > 0 else 0
        
        # Calculate annual debt service
        annual_debt_service = calculate_annual_debt_service(
            loan_amount=request.loan_amount,
            interest_rate=request.interest_rate / 100,  # Convert to decimal
            amortization_years=request.amortization_years
        )
        
        # Calculate cash flow projections
        cash_flow_years = calculate_cash_flow_projections(
            total_project_cost=total_project_cost,
            annual_debt_service=annual_debt_service,
            equity_investment=request.equity_investment,
            preferred_return=request.preferred_return / 100,  # Convert to decimal
            promote_structure=request.promote_structure,
            term_years=request.term_years
        )
        
        # Calculate waterfall tiers
        waterfall_tiers = calculate_waterfall_tiers(request.promote_structure)
        
        # Calculate LP IRR and equity multiple
        lp_irr, equity_multiple = calculate_lp_returns(
            equity_investment=request.equity_investment,
            cash_flow_years=cash_flow_years
        )
        
        # Create response
        response = TermSheetResponse(
            total_project_cost=total_project_cost,
            loan_amount=request.loan_amount,
            equity_investment=request.equity_investment,
            loan_to_cost=loan_to_cost,
            annual_debt_service=annual_debt_service,
            cash_flow_years=cash_flow_years,
            waterfall_tiers=waterfall_tiers,
            estimated_lp_irr=lp_irr,
            equity_multiple=equity_multiple
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error building term sheet: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error building term sheet: {str(e)}"
        )

def calculate_annual_debt_service(
    loan_amount: float,
    interest_rate: float,
    amortization_years: int
) -> float:
    """
    Calculate the annual debt service for a loan
    
    Args:
        loan_amount: The loan amount
        interest_rate: The annual interest rate (as a decimal)
        amortization_years: The amortization period in years
        
    Returns:
        Annual debt service
    """
    # Convert annual interest rate to monthly
    monthly_rate = interest_rate / 12
    
    # Calculate number of payments
    num_payments = amortization_years * 12
    
    # Calculate monthly payment using the formula: P = L[c(1 + c)^n]/[(1 + c)^n - 1]
    # Where P is the payment, L is the loan amount, c is the monthly interest rate, and n is the number of payments
    if monthly_rate > 0:
        monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    else:
        # If interest rate is 0, simply divide the loan amount by the number of payments
        monthly_payment = loan_amount / num_payments
    
    # Calculate annual debt service
    annual_debt_service = monthly_payment * 12
    
    return annual_debt_service

def calculate_cash_flow_projections(
    total_project_cost: float,
    annual_debt_service: float,
    equity_investment: float,
    preferred_return: float,
    promote_structure: Any,
    term_years: int
) -> List[CashFlowYear]:
    """
    Calculate cash flow projections for each year
    
    Args:
        total_project_cost: The total project cost
        annual_debt_service: The annual debt service
        equity_investment: The equity investment
        preferred_return: The preferred return (as a decimal)
        promote_structure: The promote structure
        term_years: The loan term in years
        
    Returns:
        List of cash flow projections by year
    """
    # Initialize list for cash flow years
    cash_flow_years = []
    
    # Assume NOI starts at 7% of total project cost and grows by 3% per year
    initial_noi = total_project_cost * 0.07
    
    # Assume exit cap rate of 6%
    exit_cap_rate = 0.06
    
    for year in range(1, term_years + 1):
        # Calculate NOI for this year (3% growth per year)
        noi = initial_noi * (1.03 ** (year - 1))
        
        # Calculate cash flow (NOI - debt service)
        cash_flow = noi - annual_debt_service
        
        # Calculate preferred return
        pref_return = equity_investment * preferred_return
        
        # Calculate excess cash flow after preferred return
        excess_cash_flow = max(0, cash_flow - pref_return)
        
        # Calculate promote based on the promote structure
        # For simplicity, we'll use the highest tier that applies
        promote_percentage = 0
        for i in range(len(promote_structure.thresholds)):
            if cash_flow / equity_investment * 100 >= promote_structure.thresholds[i]:
                promote_percentage = promote_structure.promotes[i] / 100  # Convert to decimal
        
        # Calculate sponsor promote
        sponsor_promote = excess_cash_flow * promote_percentage
        
        # Calculate LP and GP distributions
        lp_distribution = pref_return + (excess_cash_flow - sponsor_promote)
        gp_distribution = sponsor_promote
        
        # Add exit proceeds in the final year
        if year == term_years:
            # Calculate exit value based on NOI and exit cap rate
            exit_value = noi / exit_cap_rate
            
            # Calculate equity proceeds after paying off the loan
            # Assume loan is interest-only for simplicity
            equity_proceeds = exit_value - annual_debt_service * term_years
            
            # Distribute equity proceeds according to the same waterfall
            lp_distribution += equity_proceeds * (1 - promote_percentage)
            gp_distribution += equity_proceeds * promote_percentage
        
        # Create cash flow year
        cash_flow_year = CashFlowYear(
            year=year,
            noi=noi,
            debt_service=annual_debt_service,
            cash_flow=cash_flow,
            preferred_return=pref_return,
            excess_cash_flow=excess_cash_flow,
            sponsor_promote=sponsor_promote,
            lp_distribution=lp_distribution,
            gp_distribution=gp_distribution
        )
        
        # Add to list
        cash_flow_years.append(cash_flow_year)
    
    return cash_flow_years

def calculate_waterfall_tiers(promote_structure: Any) -> List[WaterfallTier]:
    """
    Calculate waterfall tiers based on the promote structure
    
    Args:
        promote_structure: The promote structure
        
    Returns:
        List of waterfall tiers
    """
    # Initialize list for waterfall tiers
    waterfall_tiers = []
    
    # Add tier for preferred return (tier 0)
    waterfall_tiers.append(
        WaterfallTier(
            tier=0,
            threshold=0,
            promote=0,
            lp_split=100,
            gp_split=0
        )
    )
    
    # Add tiers for each threshold in the promote structure
    for i in range(len(promote_structure.thresholds)):
        threshold = promote_structure.thresholds[i]
        promote = promote_structure.promotes[i]
        
        waterfall_tiers.append(
            WaterfallTier(
                tier=i + 1,
                threshold=threshold,
                promote=promote,
                lp_split=100 - promote,
                gp_split=promote
            )
        )
    
    return waterfall_tiers

def calculate_lp_returns(
    equity_investment: float,
    cash_flow_years: List[CashFlowYear]
) -> Tuple[float, float]:
    """
    Calculate LP IRR and equity multiple
    
    Args:
        equity_investment: The equity investment
        cash_flow_years: List of cash flow projections by year
        
    Returns:
        Tuple of (LP IRR, equity multiple)
    """
    # Extract LP distributions
    lp_distributions = [-equity_investment]  # Initial investment (negative cash flow)
    for year in cash_flow_years:
        lp_distributions.append(year.lp_distribution)
    
    # Calculate IRR
    try:
        irr = np.irr(lp_distributions) * 100  # Convert to percentage
    except:
        irr = 0
    
    # Calculate equity multiple
    total_distributions = sum(year.lp_distribution for year in cash_flow_years)
    equity_multiple = total_distributions / equity_investment if equity_investment > 0 else 0
    
    return irr, equity_multiple

async def generate_term_summary(
    request: TermSummaryRequest,
    db: Optional[Session] = None,
    deal_id: Optional[str] = None
) -> TermSummaryResponse:
    """
    Generate a summary of the term sheet
    
    Args:
        request: Term summary request
        db: Database session (optional)
        deal_id: Deal ID (optional)
        
    Returns:
        Term summary response
    """
    try:
        # Get deal information if deal_id is provided
        deal_info = {}
        if db and deal_id:
            deal = db.query(Deal).filter(Deal.id == deal_id).first()
            if deal:
                deal_info = {
                    "project_name": deal.project_name,
                    "location": deal.location,
                    "property_type": deal.property_type,
                    "acquisition_price": deal.acquisition_price,
                    "construction_cost": deal.construction_cost,
                    "square_footage": deal.square_footage,
                    "projected_rent_per_sf": deal.projected_rent_per_sf
                }
        
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
        
        if use_fallback:
            # Generate a fallback summary
            summary = generate_fallback_summary(request.term_sheet, deal_info)
        else:
            # Generate an AI-powered summary
            summary = await generate_ai_summary(request.term_sheet, deal_info)
        
        # Create response
        response = TermSummaryResponse(
            lp_irr=request.term_sheet.estimated_lp_irr,
            equity_multiple=request.term_sheet.equity_multiple,
            summary=summary
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error generating term summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating term summary: {str(e)}"
        )

def generate_fallback_summary(term_sheet: TermSheetResponse, deal_info: Dict[str, Any]) -> str:
    """
    Generate a fallback summary of the term sheet
    
    Args:
        term_sheet: The term sheet
        deal_info: Information about the deal
        
    Returns:
        Summary of the term sheet
    """
    # Create a basic summary
    summary = f"""## Investment Summary

This investment opportunity offers a projected LP IRR of {term_sheet.estimated_lp_irr:.1f}% and an equity multiple of {term_sheet.equity_multiple:.2f}x over a {len(term_sheet.cash_flow_years)}-year hold period.

### Capital Structure
- Total Project Cost: ${term_sheet.total_project_cost:,.2f}
- Loan Amount: ${term_sheet.loan_amount:,.2f} ({term_sheet.loan_to_cost * 100:.1f}% LTC)
- Equity Investment: ${term_sheet.equity_investment:,.2f}
- Annual Debt Service: ${term_sheet.annual_debt_service:,.2f}

### Waterfall Structure
"""
    
    # Add waterfall tiers
    for tier in term_sheet.waterfall_tiers:
        if tier.tier == 0:
            summary += f"- Preferred Return: {tier.threshold:.1f}% (100% to LP)\n"
        else:
            summary += f"- Tier {tier.tier}: Above {tier.threshold:.1f}% IRR ({tier.lp_split:.1f}% LP / {tier.gp_split:.1f}% GP)\n"
    
    # Add deal information if available
    if deal_info:
        summary += f"""
### Property Information
- Project: {deal_info.get('project_name', 'N/A')}
- Location: {deal_info.get('location', 'N/A')}
- Property Type: {deal_info.get('property_type', 'N/A')}
- Square Footage: {deal_info.get('square_footage', 0):,.0f} SF
"""
    
    return summary

async def generate_ai_summary(term_sheet: TermSheetResponse, deal_info: Dict[str, Any]) -> str:
    """
    Generate an AI-powered summary of the term sheet using Fireworks API
    
    Args:
        term_sheet: The term sheet
        deal_info: Information about the deal
        
    Returns:
        AI-generated summary of the term sheet
    """
    try:
        # Call the Fireworks API
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            return generate_fallback_summary(term_sheet, deal_info)
        
        # Create system message
        system_message = """You are a commercial real estate investment expert specializing in creating pitch-style term sheet summaries. 
        Your task is to create a compelling, professional summary of an investment opportunity based on the provided financial data."""
        
        # Create user message
        user_message = f"""Create a pitch-style summary for the following investment opportunity:

Term Sheet Data:
- Total Project Cost: ${term_sheet.total_project_cost:,.2f}
- Loan Amount: ${term_sheet.loan_amount:,.2f} ({term_sheet.loan_to_cost * 100:.1f}% LTC)
- Equity Investment: ${term_sheet.equity_investment:,.2f}
- Annual Debt Service: ${term_sheet.annual_debt_service:,.2f}
- Projected LP IRR: {term_sheet.estimated_lp_irr:.2f}%
- Equity Multiple: {term_sheet.equity_multiple:.2f}x
- Hold Period: {len(term_sheet.cash_flow_years)} years

Waterfall Structure:
"""
        
        # Add waterfall tiers
        for tier in term_sheet.waterfall_tiers:
            if tier.tier == 0:
                user_message += f"- Preferred Return: {tier.threshold:.1f}% (100% to LP)\n"
            else:
                user_message += f"- Tier {tier.tier}: Above {tier.threshold:.1f}% IRR ({tier.lp_split:.1f}% LP / {tier.gp_split:.1f}% GP)\n"
        
        # Add deal information if available
        if deal_info:
            user_message += f"""
Property Information:
- Project: {deal_info.get('project_name', 'N/A')}
- Location: {deal_info.get('location', 'N/A')}
- Property Type: {deal_info.get('property_type', 'N/A')}
- Square Footage: {deal_info.get('square_footage', 0):,.0f} SF
- Projected Rent: ${deal_info.get('projected_rent_per_sf', 0):,.2f} per SF
"""
        
        user_message += """
Create a professional, compelling investment summary in markdown format that highlights:
1. The investment opportunity and key metrics
2. The capital structure and financing terms
3. The waterfall structure and investor returns
4. The property information (if available)

Format it as a pitch to potential limited partners, emphasizing the attractive returns and risk-adjusted profile.
Keep it concise (300-400 words) but comprehensive.
"""
        
        # Call the Fireworks API
        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "accounts/fireworks/models/llama-v3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 800,
            "temperature": 0.7
        }
        
        response = requests.post(
            "https://api.fireworks.ai/inference/v1/chat/completions",
            headers=headers,
            json=data,
            timeout=60
        )
        
        # Check if the request was successful
        response.raise_for_status()
        
        # Extract the assistant's response
        response_json = response.json()
        summary = response_json["choices"][0]["message"]["content"]
        
        return summary
    
    except Exception as e:
        logger.error(f"Error generating AI summary: {str(e)}")
        return generate_fallback_summary(term_sheet, deal_info)
