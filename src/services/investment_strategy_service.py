from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone
from ..models.deal import Deal
from ..schemas.deal_schema import DealUpdate
from ..activity_log_service import log_action
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def get_investment_strategy(db: Session, deal_id: str) -> Optional[Dict[str, Any]]:
    """
    Get investment strategy for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        Investment strategy or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to get investment strategy: Deal not found - ID: {deal_id}")
        return None
    
    # If strategy is already set, return it
    if deal.investment_strategy:
        return {
            "strategy": deal.investment_strategy,
            "insights": generate_strategy_insights(deal)
        }
    
    # Otherwise, generate a strategy
    strategy = generate_investment_strategy(deal)
    return {
        "strategy": strategy,
        "insights": generate_strategy_insights(deal, strategy)
    }

def update_investment_strategy(
    db: Session, 
    deal_id: str, 
    user_id: str,
    strategy: str
) -> Optional[Dict[str, Any]]:
    """
    Update investment strategy for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        strategy: Investment strategy
        
    Returns:
        Updated investment strategy or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to update investment strategy: Deal not found - ID: {deal_id}")
        return None
    
    # Validate strategy
    valid_strategies = ["Core", "Core Plus", "Value Add", "Opportunistic"]
    if strategy not in valid_strategies:
        logger.warning(f"Invalid investment strategy: {strategy}")
        raise ValueError(f"Invalid investment strategy. Must be one of: {', '.join(valid_strategies)}")
    
    # Update deal
    deal.investment_strategy = strategy
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
            action="updated_investment_strategy",
            message=f"Updated investment strategy to {strategy} for {deal.project_name}.",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    return {
        "strategy": deal.investment_strategy,
        "insights": generate_strategy_insights(deal)
    }

def generate_investment_strategy(deal: Deal) -> str:
    """
    Generate investment strategy based on deal attributes
    
    Args:
        deal: Deal object
        
    Returns:
        Investment strategy (Core, Core Plus, Value Add, Opportunistic)
    """
    # Default to Value Add if we can't determine
    if not deal:
        return "Value Add"
    
    # Calculate risk factors
    risk_factors = 0
    
    # Age of property (if available)
    if hasattr(deal, 'property_attributes') and deal.property_attributes and deal.property_attributes.year_built:
        age = datetime.now().year - deal.property_attributes.year_built
        if age < 5:
            risk_factors += 0  # New properties are lower risk
        elif age < 15:
            risk_factors += 1  # Moderately aged properties
        elif age < 30:
            risk_factors += 2  # Older properties need more work
        else:
            risk_factors += 3  # Very old properties are high risk/opportunity
    else:
        # If we don't know the age, assume moderate risk
        risk_factors += 1
    
    # Vacancy rate
    if deal.vacancy_rate is not None:
        if deal.vacancy_rate < 0.05:
            risk_factors += 0  # Low vacancy is lower risk
        elif deal.vacancy_rate < 0.10:
            risk_factors += 1  # Moderate vacancy
        elif deal.vacancy_rate < 0.20:
            risk_factors += 2  # High vacancy
        else:
            risk_factors += 3  # Very high vacancy
    else:
        # If we don't know the vacancy, assume moderate risk
        risk_factors += 1
    
    # Construction cost relative to acquisition price
    if deal.acquisition_price and deal.construction_cost:
        construction_ratio = deal.construction_cost / deal.acquisition_price
        if construction_ratio < 0.05:
            risk_factors += 0  # Minimal construction needed
        elif construction_ratio < 0.15:
            risk_factors += 1  # Some construction needed
        elif construction_ratio < 0.30:
            risk_factors += 2  # Significant construction needed
        else:
            risk_factors += 3  # Major construction/redevelopment
    else:
        # If we don't know the construction cost, assume moderate risk
        risk_factors += 1
    
    # Determine strategy based on risk factors
    if risk_factors <= 1:
        return "Core"
    elif risk_factors <= 3:
        return "Core Plus"
    elif risk_factors <= 6:
        return "Value Add"
    else:
        return "Opportunistic"

def generate_strategy_insights(deal: Deal, strategy: Optional[str] = None) -> List[str]:
    """
    Generate insights based on investment strategy
    
    Args:
        deal: Deal object
        strategy: Investment strategy (if None, use deal.investment_strategy)
        
    Returns:
        List of insights
    """
    if not strategy:
        strategy = deal.investment_strategy or generate_investment_strategy(deal)
    
    insights = []
    
    if strategy == "Core":
        insights = [
            "Stable, low-risk investment with predictable cash flow",
            "Typically newer or recently renovated Class A properties",
            "Located in prime markets with strong fundamentals",
            "Minimal property improvements needed",
            "Target returns: 7-10% IRR"
        ]
    elif strategy == "Core Plus":
        insights = [
            "Relatively stable properties with opportunity for modest value enhancement",
            "Well-maintained Class A or B properties in good locations",
            "Some property improvements or operational enhancements needed",
            "Slightly higher risk profile than Core with better return potential",
            "Target returns: 9-13% IRR"
        ]
    elif strategy == "Value Add":
        insights = [
            "Properties with significant upside potential through renovation or repositioning",
            "Typically Class B or C properties in improving locations",
            "Substantial property improvements or operational changes required",
            "Higher risk profile with potential for strong returns",
            "Target returns: 12-18% IRR"
        ]
    elif strategy == "Opportunistic":
        insights = [
            "High-risk, high-reward investments requiring major intervention",
            "May involve ground-up development, complete repositioning, or distressed assets",
            "Significant capital improvements and longer investment horizon",
            "Highest risk profile with potential for exceptional returns",
            "Target returns: 18%+ IRR"
        ]
    
    # Add property-specific insights
    if deal.property_type:
        insights.append(f"Property type ({deal.property_type}) aligns with {strategy.lower()} investment profile")
    
    if hasattr(deal, 'property_attributes') and deal.property_attributes:
        if deal.property_attributes.year_built:
            age = datetime.now().year - deal.property_attributes.year_built
            if strategy == "Core" and age > 15:
                insights.append(f"Property age ({age} years) is higher than typical for Core investments")
            elif strategy == "Opportunistic" and age < 10:
                insights.append(f"Property age ({age} years) is lower than typical for Opportunistic investments")
    
    return insights
