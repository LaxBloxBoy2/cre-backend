from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..services.auth_service import get_current_user
from ..schemas.user_schema import User
from ..schemas.metric_schema import MetricExplanation

router = APIRouter(
    prefix="/api",
    tags=["metrics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/deals/{deal_id}/explain-metric", response_model=MetricExplanation)
async def explain_metric(
    deal_id: str,
    metric: str = Query(..., description="Metric to explain"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get explanation for a metric
    """
    # Get explanation based on metric type
    explanation = get_metric_explanation(metric, deal_id)
    
    if not explanation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown metric: {metric}"
        )
    
    return explanation

def get_metric_explanation(metric: str, deal_id: str = "global") -> MetricExplanation:
    """
    Get explanation for a metric
    
    Args:
        metric: Metric name
        deal_id: Deal ID (optional)
        
    Returns:
        Metric explanation
    """
    explanations = {
        "irr": MetricExplanation(
            metric="Internal Rate of Return (IRR)",
            explanation="Internal Rate of Return (IRR) is the annualized rate of return an investment is expected to generate. It's the discount rate that makes the net present value (NPV) of all cash flows equal to zero. Higher IRR values indicate more desirable investment opportunities.",
            comparison="For commercial real estate, an IRR of 15-20% is considered excellent, 12-15% is good, and below 10% may be considered moderate to low depending on the risk profile and market conditions.",
            value="15.2%"
        ),
        "cap_rate": MetricExplanation(
            metric="Capitalization Rate",
            explanation="Capitalization Rate (Cap Rate) is the ratio between the net operating income (NOI) of a property and its current market value. It represents the potential return on investment and is used to estimate the investor's potential return on a real estate investment.",
            comparison="A lower cap rate (4-6%) typically indicates lower risk and higher property value, while a higher cap rate (8-10%+) may indicate higher risk or a property in a less desirable location.",
            value="5.5%"
        ),
        "dscr": MetricExplanation(
            metric="Debt Service Coverage Ratio",
            explanation="Debt Service Coverage Ratio (DSCR) is a measure of a property's cash flow relative to its debt obligations. It's calculated by dividing the property's net operating income (NOI) by its total debt service. A DSCR greater than 1 indicates that the property generates sufficient income to cover its debt payments.",
            comparison="Most lenders require a minimum DSCR of 1.25, with 1.5 or higher considered strong. A DSCR below 1.0 indicates negative cash flow.",
            value="1.35"
        ),
        "development_margin": MetricExplanation(
            metric="Development Margin",
            explanation="Development Margin is the profit margin on a real estate development project, calculated as the difference between the project's exit value and its total cost, expressed as a percentage of the total cost.",
            comparison="For commercial real estate development, margins typically range from 15-25%, with higher-risk projects requiring higher margins to compensate for the additional risk.",
            value="18.5%"
        ),
        "equity_multiple": MetricExplanation(
            metric="Equity Multiple",
            explanation="Equity Multiple shows how much the initial investment is expected to grow over the investment period. It's calculated by dividing the total cash distributions by the total equity invested. An equity multiple of 2.0x means each dollar invested is projected to return two dollars (including the original dollar).",
            comparison="For commercial real estate investments with a 5-7 year hold period, an equity multiple of 1.5-2.0x is considered good, while 2.0-2.5x is excellent.",
            value="2.1x"
        ),
        "occupancy": MetricExplanation(
            metric="Occupancy Rate",
            explanation="Occupancy rate indicates the percentage of the property that is leased to tenants. It's a key metric for income-producing properties as it directly impacts the property's revenue potential.",
            comparison="Market-specific, but generally 90-95% is considered good for most commercial property types. Class A properties in prime locations often target 95%+ occupancy.",
            value="93%"
        ),
        "noi": MetricExplanation(
            metric="Net Operating Income",
            explanation="Net Operating Income (NOI) is the income generated by a property after deducting operating expenses but before deducting taxes and financing costs. It's a key metric for evaluating a property's profitability.",
            comparison="NOI varies widely based on property size, type, and location. What's most important is the trend (increasing or decreasing) and how it compares to similar properties in the market.",
            value="$1,815,000"
        ),
        "ltv": MetricExplanation(
            metric="Loan-to-Value Ratio",
            explanation="Loan-to-Value (LTV) ratio is the ratio of the loan amount to the appraised value of the property. It's used by lenders to assess the risk of a loan.",
            comparison="Commercial real estate loans typically have maximum LTVs of 65-75%, with lower LTVs (50-60%) for higher-risk property types or locations.",
            value="65%"
        ),
        "roi": MetricExplanation(
            metric="Return on Investment",
            explanation="Return on Investment (ROI) measures the return on an investment relative to its cost. It's calculated by dividing the net profit by the cost of the investment, then expressing it as a percentage.",
            comparison="ROI expectations vary by property type and risk profile, but generally 8-12% annual ROI is considered good for commercial real estate investments.",
            value="12.5%"
        )
    }
    
    # Return explanation if available
    return explanations.get(metric.lower())
