import os
import json
import requests
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..schemas.benchmark_schema import BenchmarkMetric, BenchmarkResponse
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Define market benchmarks (placeholder values)
MARKET_BENCHMARKS = {
    "irr": {
        "multifamily": 12.5,
        "office": 11.0,
        "retail": 10.5,
        "industrial": 13.0,
        "hospitality": 14.5,
        "default": 12.0
    },
    "cap_rate": {
        "multifamily": 5.0,
        "office": 6.0,
        "retail": 6.5,
        "industrial": 5.5,
        "hospitality": 8.0,
        "default": 6.0
    },
    "dscr": {
        "multifamily": 1.35,
        "office": 1.30,
        "retail": 1.25,
        "industrial": 1.40,
        "hospitality": 1.20,
        "default": 1.30
    },
    "rent_per_sf": {
        "multifamily": 25.0,
        "office": 35.0,
        "retail": 30.0,
        "industrial": 15.0,
        "hospitality": 40.0,
        "default": 30.0
    }
}

def get_market_benchmark(metric: str, property_type: str) -> float:
    """
    Get the market benchmark for a metric and property type
    
    Args:
        metric: Metric name
        property_type: Property type
        
    Returns:
        Market benchmark value
    """
    # Normalize property type
    property_type = property_type.lower() if property_type else "default"
    
    # Get benchmark
    if metric in MARKET_BENCHMARKS:
        if property_type in MARKET_BENCHMARKS[metric]:
            return MARKET_BENCHMARKS[metric][property_type]
        else:
            return MARKET_BENCHMARKS[metric]["default"]
    else:
        return 0.0

async def generate_benchmark_report(
    db: Session,
    deal_ids: List[str],
    market_comparison: bool = True
) -> BenchmarkResponse:
    """
    Generate a benchmark report for a list of deals
    
    Args:
        db: Database session
        deal_ids: List of deal IDs
        market_comparison: Whether to include market comparison
        
    Returns:
        Benchmark report
        
    Raises:
        HTTPException: If any of the deals are not found
    """
    try:
        # Get deals
        deals = db.query(Deal).filter(Deal.id.in_(deal_ids)).all()
        
        # Check if all deals were found
        if len(deals) != len(deal_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more deals not found"
            )
        
        # Calculate metrics
        metrics = calculate_benchmark_metrics(deals, market_comparison)
        
        # Get property types and locations
        property_types = list(set(deal.property_type for deal in deals if deal.property_type))
        locations = list(set(deal.location for deal in deals if deal.location))
        
        # Generate summary
        summary = await generate_benchmark_summary(metrics, deals, market_comparison)
        
        # Create response
        response = BenchmarkResponse(
            metrics=metrics,
            summary=summary,
            deal_count=len(deals),
            property_types=property_types,
            locations=locations
        )
        
        return response
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Error generating benchmark report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating benchmark report: {str(e)}"
        )

def calculate_benchmark_metrics(
    deals: List[Deal],
    market_comparison: bool = True
) -> List[BenchmarkMetric]:
    """
    Calculate benchmark metrics for a list of deals
    
    Args:
        deals: List of deals
        market_comparison: Whether to include market comparison
        
    Returns:
        List of benchmark metrics
    """
    # Initialize metrics
    metrics_data = {
        "irr": [],
        "cap_rate": [],
        "dscr": [],
        "rent_per_sf": []
    }
    
    # Collect metrics from deals
    for deal in deals:
        # IRR
        if deal.projected_irr is not None:
            metrics_data["irr"].append(deal.projected_irr)
        
        # DSCR
        if deal.dscr is not None:
            metrics_data["dscr"].append(deal.dscr)
        
        # Rent per SF
        if deal.projected_rent_per_sf is not None:
            metrics_data["rent_per_sf"].append(deal.projected_rent_per_sf)
        
        # Cap rate
        if deal.acquisition_price and deal.acquisition_price > 0:
            # Calculate NOI (simplified)
            potential_gross_income = deal.square_footage * deal.projected_rent_per_sf
            vacancy_loss = potential_gross_income * (deal.vacancy_rate / 100)
            effective_gross_income = potential_gross_income - vacancy_loss
            operating_expenses = deal.square_footage * deal.operating_expenses_per_sf
            noi = effective_gross_income - operating_expenses
            
            # Calculate cap rate
            cap_rate = (noi / deal.acquisition_price) * 100
            metrics_data["cap_rate"].append(cap_rate)
    
    # Calculate averages
    metrics = []
    for metric_name, values in metrics_data.items():
        if values:
            # Calculate average
            avg_value = sum(values) / len(values)
            
            # Create metric
            metric = BenchmarkMetric(
                name=metric_name,
                value=avg_value,
                market_value=None,
                difference=None,
                difference_percent=None
            )
            
            # Add market comparison if requested
            if market_comparison:
                # Get most common property type
                property_types = [deal.property_type for deal in deals if deal.property_type]
                if property_types:
                    most_common_property_type = max(set(property_types), key=property_types.count)
                    
                    # Get market benchmark
                    market_value = get_market_benchmark(metric_name, most_common_property_type)
                    
                    # Calculate difference
                    difference = avg_value - market_value
                    difference_percent = (difference / market_value) * 100 if market_value > 0 else 0
                    
                    # Update metric
                    metric.market_value = market_value
                    metric.difference = difference
                    metric.difference_percent = difference_percent
            
            metrics.append(metric)
    
    return metrics

async def generate_benchmark_summary(
    metrics: List[BenchmarkMetric],
    deals: List[Deal],
    market_comparison: bool = True
) -> str:
    """
    Generate a summary of the benchmark report
    
    Args:
        metrics: List of benchmark metrics
        deals: List of deals
        market_comparison: Whether to include market comparison
        
    Returns:
        Summary of the benchmark report
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
        
        if use_fallback:
            # Generate a fallback summary
            return generate_fallback_summary(metrics, deals, market_comparison)
        
        # Check if we have a Fireworks API key
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            return generate_fallback_summary(metrics, deals, market_comparison)
        
        # Create system message
        system_message = """You are a commercial real estate investment expert specializing in portfolio analysis.
        Your task is to create a concise, professional summary of a portfolio benchmark report."""
        
        # Create user message
        user_message = f"""Create a concise summary of the following portfolio benchmark report:

Portfolio:
- Number of deals: {len(deals)}
- Property types: {', '.join(list(set(deal.property_type for deal in deals if deal.property_type)))}
- Locations: {', '.join(list(set(deal.location for deal in deals if deal.location)))}

Metrics:
"""
        
        # Add metrics
        for metric in metrics:
            user_message += f"- {metric.name.upper()}: {metric.value:.2f}"
            
            if market_comparison and metric.market_value is not None:
                user_message += f" (Market: {metric.market_value:.2f}, Difference: {metric.difference_percent:+.2f}%)"
            
            user_message += "\n"
        
        user_message += """
Create a professional, concise summary (150-200 words) that:
1. Highlights the key metrics and their performance
2. Compares the portfolio to market benchmarks (if available)
3. Identifies strengths and potential areas of concern
4. Provides context for the performance

Format the summary in markdown with clear paragraphs and bullet points where appropriate.
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
            "max_tokens": 500,
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
        logger.error(f"Error generating benchmark summary: {str(e)}")
        return generate_fallback_summary(metrics, deals, market_comparison)

def generate_fallback_summary(
    metrics: List[BenchmarkMetric],
    deals: List[Deal],
    market_comparison: bool = True
) -> str:
    """
    Generate a fallback summary of the benchmark report
    
    Args:
        metrics: List of benchmark metrics
        deals: List of deals
        market_comparison: Whether to include market comparison
        
    Returns:
        Summary of the benchmark report
    """
    # Create summary
    summary = f"""## Portfolio Benchmark Summary

This benchmark report analyzes {len(deals)} deals across {len(set(deal.property_type for deal in deals if deal.property_type))} property types and {len(set(deal.location for deal in deals if deal.location))} locations.

### Key Metrics:
"""
    
    # Add metrics
    for metric in metrics:
        metric_name = metric.name.upper()
        if metric_name == "IRR":
            metric_name = "Internal Rate of Return"
        elif metric_name == "DSCR":
            metric_name = "Debt Service Coverage Ratio"
        elif metric_name == "CAP_RATE":
            metric_name = "Capitalization Rate"
        elif metric_name == "RENT_PER_SF":
            metric_name = "Rent per Square Foot"
        
        summary += f"- **{metric_name}**: {metric.value:.2f}"
        
        if market_comparison and metric.market_value is not None:
            summary += f" (Market: {metric.market_value:.2f}, Difference: {metric.difference_percent:+.2f}%)"
        
        summary += "\n"
    
    # Add conclusion
    summary += """
### Conclusion:
This portfolio demonstrates performance metrics that reflect the current market conditions. Further analysis of individual deals is recommended to identify specific opportunities for optimization."""
    
    return summary
