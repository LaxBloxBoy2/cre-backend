import os
import requests
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.deal import Deal
from ..schemas.metrics_schema import MetricExplanationResponse
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Define static explanations for fallback
STATIC_EXPLANATIONS = {
    "irr": "Internal Rate of Return (IRR) is the annualized rate of return that makes the net present value of all cash flows equal to zero. Investors typically look for 12-18% on value-add projects.",
    "dscr": "Debt Service Coverage Ratio (DSCR) measures the property's ability to cover debt payments. A DSCR of 1.0 means the property generates just enough income to cover debt service. Lenders typically require a minimum DSCR of 1.2-1.3.",
    "cap_rate": "Capitalization Rate (Cap Rate) is the ratio of Net Operating Income (NOI) to property value. It represents the unlevered return on the asset. Lower cap rates indicate lower risk and higher property values.",
    "lease_structure": "Lease structure refers to the terms and conditions of the lease agreement, including lease term, rent escalations, renewal options, and tenant responsibilities.",
    "exit_cap_rate": "Exit Cap Rate is the projected capitalization rate at the time of sale. It's typically higher than the entry cap rate to account for property aging and market risk."
}

# Define benchmark ranges for metrics
BENCHMARK_RANGES = {
    "irr": {
        "core": (6, 8),
        "core_plus": (8, 10),
        "value_add": (10, 14),
        "opportunistic": (14, 20)
    },
    "dscr": {
        "minimum": 1.2,
        "strong": 1.5,
        "excellent": 2.0
    },
    "cap_rate": {
        "class_a": (3.5, 5.0),
        "class_b": (5.0, 7.0),
        "class_c": (7.0, 10.0)
    },
    "exit_cap_rate": {
        "typical_premium": 0.5  # Typical premium over entry cap rate
    }
}

def get_metric_value(db: Session, deal_id: str, metric: str) -> float:
    """
    Get the value of a specific metric for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        metric: Metric name
        
    Returns:
        Metric value
        
    Raises:
        HTTPException: If the deal is not found or the metric is not available
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Get the metric value
    if metric == "irr":
        if deal.projected_irr is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IRR not available for this deal"
            )
        return deal.projected_irr
    elif metric == "dscr":
        if deal.dscr is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DSCR not available for this deal"
            )
        return deal.dscr
    elif metric == "cap_rate":
        # Calculate cap rate from NOI and acquisition price
        if not deal.acquisition_price or deal.acquisition_price == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cap rate not available for this deal"
            )
        
        # Calculate NOI (simplified)
        potential_gross_income = deal.square_footage * deal.projected_rent_per_sf
        vacancy_loss = potential_gross_income * (deal.vacancy_rate / 100)
        effective_gross_income = potential_gross_income - vacancy_loss
        operating_expenses = deal.square_footage * deal.operating_expenses_per_sf
        noi = effective_gross_income - operating_expenses
        
        # Calculate cap rate
        cap_rate = (noi / deal.acquisition_price) * 100
        return cap_rate
    elif metric == "exit_cap_rate":
        if deal.exit_cap_rate is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exit cap rate not available for this deal"
            )
        return deal.exit_cap_rate
    elif metric == "lease_structure":
        # For lease structure, we'll return a placeholder value
        # In a real implementation, this would come from lease data
        return 0.0
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported metric: {metric}"
        )

def get_comparison_text(metric: str, value: float) -> str:
    """
    Get comparison text for a metric value
    
    Args:
        metric: Metric name
        value: Metric value
        
    Returns:
        Comparison text
    """
    if metric == "irr":
        if value < BENCHMARK_RANGES["irr"]["core"][0]:
            return "This IRR is below typical core investment returns (6-8%)."
        elif value <= BENCHMARK_RANGES["irr"]["core"][1]:
            return "This IRR is in line with typical core investment returns (6-8%)."
        elif value <= BENCHMARK_RANGES["irr"]["core_plus"][1]:
            return "This IRR is in line with typical core-plus investment returns (8-10%)."
        elif value <= BENCHMARK_RANGES["irr"]["value_add"][1]:
            return "This IRR is in line with typical value-add investment returns (10-14%)."
        else:
            return "This IRR is in line with opportunistic investment returns (14%+)."
    elif metric == "dscr":
        if value < BENCHMARK_RANGES["dscr"]["minimum"]:
            return f"This DSCR is below the typical minimum lender requirement of {BENCHMARK_RANGES['dscr']['minimum']}."
        elif value < BENCHMARK_RANGES["dscr"]["strong"]:
            return "This DSCR meets minimum lender requirements but is below what's considered a strong DSCR (1.5+)."
        elif value < BENCHMARK_RANGES["dscr"]["excellent"]:
            return "This DSCR is considered strong by most lenders."
        else:
            return "This DSCR is excellent and well above typical lender requirements."
    elif metric == "cap_rate":
        if value < BENCHMARK_RANGES["cap_rate"]["class_a"][0]:
            return "This cap rate is below typical Class A property cap rates (3.5-5%)."
        elif value <= BENCHMARK_RANGES["cap_rate"]["class_a"][1]:
            return "This cap rate is in line with typical Class A property cap rates (3.5-5%)."
        elif value <= BENCHMARK_RANGES["cap_rate"]["class_b"][1]:
            return "This cap rate is in line with typical Class B property cap rates (5-7%)."
        else:
            return "This cap rate is in line with typical Class C property cap rates (7%+)."
    elif metric == "exit_cap_rate":
        return f"Exit cap rates are typically {BENCHMARK_RANGES['exit_cap_rate']['typical_premium']}% higher than entry cap rates to account for property aging and market risk."
    else:
        return ""

async def generate_metric_explanation(
    db: Session,
    deal_id: str,
    metric: str
) -> MetricExplanationResponse:
    """
    Generate an explanation for a specific metric
    
    Args:
        db: Database session
        deal_id: Deal ID
        metric: Metric name
        
    Returns:
        Metric explanation response
    """
    try:
        # Get the metric value
        value = get_metric_value(db, deal_id, metric)
        
        # Get the deal for additional context
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        
        # Get comparison text
        comparison = get_comparison_text(metric, value)
        
        # Check if we should use a dynamic explanation
        use_dynamic = os.getenv("USE_DYNAMIC_EXPLANATIONS", "false").lower() == "true"
        
        if use_dynamic and os.getenv("FIREWORKS_API_KEY"):
            # Generate dynamic explanation using LLM
            explanation = await generate_dynamic_explanation(metric, value, deal)
        else:
            # Use static explanation
            explanation = STATIC_EXPLANATIONS.get(metric, "No explanation available.")
            
            # Add value-specific context
            if metric == "irr":
                explanation = f"An IRR of {value:.1f}% means the project is expected to generate a {value:.1f}% annualized return over its holding period. {explanation}"
            elif metric == "dscr":
                explanation = f"A DSCR of {value:.2f} means the property generates {value:.2f} times the income needed to cover debt service. {explanation}"
            elif metric == "cap_rate":
                explanation = f"A cap rate of {value:.2f}% represents an unlevered yield of {value:.2f}% on the investment. {explanation}"
            elif metric == "exit_cap_rate":
                explanation = f"An exit cap rate of {value:.2f}% is used to estimate the property's sale value at the end of the holding period. {explanation}"
        
        # Create response
        response = MetricExplanationResponse(
            metric=metric.upper(),
            value=value,
            explanation=explanation,
            comparison=comparison
        )
        
        return response
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Error generating metric explanation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating metric explanation: {str(e)}"
        )

async def generate_dynamic_explanation(metric: str, value: float, deal: Deal) -> str:
    """
    Generate a dynamic explanation for a metric using LLM
    
    Args:
        metric: Metric name
        value: Metric value
        deal: Deal object
        
    Returns:
        Dynamic explanation
    """
    try:
        # Get Fireworks API key
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            return STATIC_EXPLANATIONS.get(metric, "No explanation available.")
        
        # Create system message
        system_message = """You are a commercial real estate expert explaining financial metrics to investors.
        Provide clear, concise explanations that are informative and educational.
        Focus on what the metric means in practical terms and how it compares to industry standards."""
        
        # Create user message
        user_message = f"""Explain the following metric for a commercial real estate investment:

Metric: {metric.upper()}
Value: {value}
Property Type: {deal.property_type}
Location: {deal.location}

Please provide:
1. What this specific value means for this investment
2. How this compares to industry standards
3. What investors should know about this metric

Keep your explanation under 150 words and focus on practical implications."""
        
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
            "max_tokens": 300,
            "temperature": 0.3
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
        explanation = response_json["choices"][0]["message"]["content"]
        
        return explanation
    
    except Exception as e:
        logger.error(f"Error generating dynamic explanation: {str(e)}")
        return STATIC_EXPLANATIONS.get(metric, "No explanation available.")
