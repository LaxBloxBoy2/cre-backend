import os
import json
import requests
from fastapi import HTTPException
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..schemas.budget_schema import BudgetAnalyzerRequest, BudgetAnalyzerResponse, CategoryBreakdown
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Define category mappings
CATEGORY_MAPPINGS = {
    # Hard Costs
    "construction": "Hard Costs",
    "building": "Hard Costs",
    "structure": "Hard Costs",
    "foundation": "Hard Costs",
    "framing": "Hard Costs",
    "concrete": "Hard Costs",
    "masonry": "Hard Costs",
    "steel": "Hard Costs",
    "carpentry": "Hard Costs",
    "roofing": "Hard Costs",
    "windows": "Hard Costs",
    "doors": "Hard Costs",
    "finishes": "Hard Costs",
    "flooring": "Hard Costs",
    "painting": "Hard Costs",
    "plumbing": "Hard Costs",
    "electrical": "Hard Costs",
    "hvac": "Hard Costs",
    "mechanical": "Hard Costs",
    "elevator": "Hard Costs",
    "site work": "Hard Costs",
    "landscaping": "Hard Costs",
    "demolition": "Hard Costs",
    "mep": "Hard Costs",
    
    # Soft Costs
    "architect": "Soft Costs",
    "engineering": "Soft Costs",
    "design": "Soft Costs",
    "permits": "Soft Costs",
    "legal": "Soft Costs",
    "insurance": "Soft Costs",
    "taxes": "Soft Costs",
    "fees": "Soft Costs",
    "marketing": "Soft Costs",
    "leasing": "Soft Costs",
    "financing": "Soft Costs",
    "interest": "Soft Costs",
    "survey": "Soft Costs",
    "environmental": "Soft Costs",
    "testing": "Soft Costs",
    "inspection": "Soft Costs",
    "consultant": "Soft Costs",
    "professional": "Soft Costs",
    
    # Contingency
    "contingency": "Contingency",
    "reserve": "Contingency",
    "allowance": "Contingency",
    
    # Land
    "land": "Land",
    "acquisition": "Land",
    "purchase": "Land",
    
    # Developer Fee
    "developer": "Developer Fee",
    "development fee": "Developer Fee",
    
    # General Contractor Fee
    "gc": "GC Fee",
    "general contractor": "GC Fee",
    "contractor fee": "GC Fee",
    
    # Other
    "furniture": "FF&E",
    "fixtures": "FF&E",
    "equipment": "FF&E",
    "ff&e": "FF&E",
    
    # Miscellaneous
    "misc": "Miscellaneous",
    "other": "Miscellaneous"
}

# Define industry benchmarks
INDUSTRY_BENCHMARKS = {
    "Contingency": {"min": 5, "max": 10, "message": "Contingency should be 5-10% of total budget"},
    "GC Fee": {"min": 3, "max": 7, "message": "GC Fee should be 3-7% of Hard Costs"},
    "Hard Costs": {"min": 65, "max": 80, "message": "Hard Costs typically represent 65-80% of total budget"},
    "Soft Costs": {"min": 15, "max": 25, "message": "Soft Costs typically represent 15-25% of total budget"},
    "Developer Fee": {"min": 3, "max": 5, "message": "Developer Fee typically represents 3-5% of total budget"},
    "FF&E": {"min": 2, "max": 8, "message": "FF&E typically represents 2-8% of total budget"}
}

# Define required categories
REQUIRED_CATEGORIES = ["Hard Costs", "Soft Costs", "Contingency", "GC Fee"]

async def analyze_budget(
    db: Session,
    deal_id: str,
    request: BudgetAnalyzerRequest
) -> BudgetAnalyzerResponse:
    """
    Analyze a development budget
    
    Args:
        db: Database session
        deal_id: Deal ID
        request: Budget analyzer request
        
    Returns:
        Budget analyzer response
    """
    try:
        # Get the deal
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        
        # Categorize line items
        categorized_items = categorize_line_items(request.line_items)
        
        # Calculate total cost
        total_cost = sum(item.amount for item in request.line_items)
        
        # Calculate category breakdown
        category_breakdown = calculate_category_breakdown(categorized_items, total_cost)
        
        # Check for red flags
        red_flags = check_for_red_flags(category_breakdown, categorized_items)
        
        # Generate recommendations
        recommendations = generate_recommendations(red_flags, category_breakdown)
        
        # Create response
        response = BudgetAnalyzerResponse(
            total_cost=total_cost,
            category_breakdown=category_breakdown,
            red_flags=red_flags,
            recommendations=recommendations
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error analyzing budget: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing budget: {str(e)}")

def categorize_line_items(line_items: List[Any]) -> Dict[str, float]:
    """
    Categorize line items into standard categories
    
    Args:
        line_items: List of line items
        
    Returns:
        Dictionary of categorized items
    """
    categorized_items = {}
    
    for item in line_items:
        category = item.category.lower()
        amount = item.amount
        
        # Try to map the category to a standard category
        mapped_category = "Miscellaneous"
        for key, value in CATEGORY_MAPPINGS.items():
            if key in category:
                mapped_category = value
                break
        
        # Add to the categorized items
        if mapped_category in categorized_items:
            categorized_items[mapped_category] += amount
        else:
            categorized_items[mapped_category] = amount
    
    return categorized_items

def calculate_category_breakdown(categorized_items: Dict[str, float], total_cost: float) -> List[CategoryBreakdown]:
    """
    Calculate the breakdown of the budget by category
    
    Args:
        categorized_items: Dictionary of categorized items
        total_cost: Total cost of the budget
        
    Returns:
        List of category breakdowns
    """
    category_breakdown = []
    
    for category, amount in categorized_items.items():
        percentage = (amount / total_cost) * 100 if total_cost > 0 else 0
        category_breakdown.append(
            CategoryBreakdown(
                category=category,
                amount=amount,
                percentage=percentage
            )
        )
    
    # Sort by amount descending
    category_breakdown.sort(key=lambda x: x.amount, reverse=True)
    
    return category_breakdown

def check_for_red_flags(category_breakdown: List[CategoryBreakdown], categorized_items: Dict[str, float]) -> List[str]:
    """
    Check for red flags in the budget
    
    Args:
        category_breakdown: List of category breakdowns
        categorized_items: Dictionary of categorized items
        
    Returns:
        List of red flags
    """
    red_flags = []
    
    # Check for missing required categories
    for category in REQUIRED_CATEGORIES:
        if category not in categorized_items:
            red_flags.append(f"Missing {category}")
    
    # Check against industry benchmarks
    for category_item in category_breakdown:
        category = category_item.category
        percentage = category_item.percentage
        
        if category in INDUSTRY_BENCHMARKS:
            benchmark = INDUSTRY_BENCHMARKS[category]
            if percentage < benchmark["min"]:
                red_flags.append(f"{category} ({percentage:.1f}%) is below industry benchmark ({benchmark['min']}%)")
            elif percentage > benchmark["max"]:
                red_flags.append(f"{category} ({percentage:.1f}%) is above industry benchmark ({benchmark['max']}%)")
    
    # Check for unusually high or low MEP costs
    hard_costs = categorized_items.get("Hard Costs", 0)
    mep_costs = 0
    for category, amount in categorized_items.items():
        if "MEP" in category:
            mep_costs += amount
    
    if hard_costs > 0 and mep_costs > 0:
        mep_percentage = (mep_costs / hard_costs) * 100
        if mep_percentage < 10:
            red_flags.append(f"Unusually low MEP allocation ({mep_percentage:.1f}% of Hard Costs)")
        elif mep_percentage > 30:
            red_flags.append(f"Unusually high MEP allocation ({mep_percentage:.1f}% of Hard Costs)")
    
    return red_flags

def generate_recommendations(red_flags: List[str], category_breakdown: List[CategoryBreakdown]) -> List[str]:
    """
    Generate recommendations based on red flags
    
    Args:
        red_flags: List of red flags
        category_breakdown: List of category breakdowns
        
    Returns:
        List of recommendations
    """
    recommendations = []
    
    # Generate recommendations based on red flags
    for flag in red_flags:
        if "Missing" in flag:
            category = flag.split("Missing ")[1]
            recommendations.append(f"Add a line item for {category}")
        
        elif "below industry benchmark" in flag:
            category = flag.split(" (")[0]
            if category == "Contingency":
                recommendations.append(f"Consider increasing {category} to 5-10% of total budget")
            elif category == "GC Fee":
                recommendations.append(f"Consider increasing {category} to 3-7% of Hard Costs")
            elif category == "Hard Costs":
                recommendations.append(f"Review Hard Costs allocation - typically 65-80% of total budget")
            elif category == "Soft Costs":
                recommendations.append(f"Review Soft Costs allocation - typically 15-25% of total budget")
        
        elif "Unusually low MEP allocation" in flag:
            recommendations.append("Review MEP costs - typically 15-25% of Hard Costs")
    
    # Add general recommendations if there are no specific ones
    if not recommendations:
        recommendations.append("Budget appears to be within industry standards")
    
    return recommendations
