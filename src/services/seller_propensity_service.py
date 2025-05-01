from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timezone, timedelta
from ..models.deal import Deal
from ..activity_log_service import log_action
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def get_seller_propensity(db: Session, deal_id: str) -> Optional[Dict[str, Any]]:
    """
    Get seller propensity for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        Seller propensity or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to get seller propensity: Deal not found - ID: {deal_id}")
        return None
    
    # If propensity is already set, return it
    if deal.seller_propensity:
        return {
            "propensity": deal.seller_propensity,
            "reason": deal.seller_propensity_reason
        }
    
    # Otherwise, generate propensity
    propensity, reason = generate_seller_propensity(db, deal)
    return {
        "propensity": propensity,
        "reason": reason
    }

def update_seller_propensity(
    db: Session, 
    deal_id: str, 
    user_id: str,
    propensity: str,
    reason: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Update seller propensity for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        propensity: Seller propensity
        reason: Reason for propensity
        
    Returns:
        Updated seller propensity or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to update seller propensity: Deal not found - ID: {deal_id}")
        return None
    
    # Validate propensity
    valid_propensities = ["Low", "Medium", "High"]
    if propensity not in valid_propensities:
        logger.warning(f"Invalid seller propensity: {propensity}")
        raise ValueError(f"Invalid seller propensity. Must be one of: {', '.join(valid_propensities)}")
    
    # Update deal
    deal.seller_propensity = propensity
    deal.seller_propensity_reason = reason
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
            action="updated_seller_propensity",
            message=f"Updated seller propensity to {propensity} for {deal.project_name}.",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    return {
        "propensity": deal.seller_propensity,
        "reason": deal.seller_propensity_reason
    }

def generate_seller_propensity(db: Session, deal: Deal) -> Tuple[str, str]:
    """
    Generate seller propensity based on deal attributes
    
    Args:
        db: Database session
        deal: Deal object
        
    Returns:
        Tuple of (propensity, reason)
    """
    # Default to Medium if we can't determine
    if not deal:
        return "Medium", "Insufficient data to determine seller propensity"
    
    # Calculate propensity factors
    propensity_factors = 0
    reasons = []
    
    # Hold period
    current_hold_period = None
    if deal.owner_acquisition_date:
        current_hold_period = (datetime.now(timezone.utc) - deal.owner_acquisition_date).days / 365.0
        if current_hold_period > 7:
            propensity_factors += 2
            reasons.append(f"Long hold period ({current_hold_period:.1f} years)")
        elif current_hold_period > 5:
            propensity_factors += 1
            reasons.append(f"Moderate hold period ({current_hold_period:.1f} years)")
    
    # Property age
    if hasattr(deal, 'property_attributes') and deal.property_attributes and deal.property_attributes.year_built:
        age = datetime.now().year - deal.property_attributes.year_built
        if age > 30:
            propensity_factors += 1
            reasons.append(f"Aging property ({age} years old)")
    
    # Market conditions
    # This would typically involve external market data, but for simplicity we'll use a placeholder
    # In a real implementation, this would check market trends, interest rates, etc.
    propensity_factors += 1
    reasons.append("Current market conditions favor sellers")
    
    # Owner diversification
    # Check if the owner has other properties in the same market
    # This would typically involve querying a database of property owners
    # For simplicity, we'll use a placeholder
    if deal.owner_name:
        # Count other deals with the same owner
        other_deals_count = db.query(Deal).filter(
            Deal.owner_name == deal.owner_name,
            Deal.id != deal.id
        ).count()
        
        if other_deals_count > 3:
            propensity_factors += 1
            reasons.append(f"Owner has multiple properties ({other_deals_count} others)")
    
    # Determine propensity based on factors
    if propensity_factors <= 1:
        propensity = "Low"
    elif propensity_factors <= 3:
        propensity = "Medium"
    else:
        propensity = "High"
    
    # Generate reason text
    if not reasons:
        reason = f"Seller propensity is {propensity.lower()} based on available data"
    else:
        reason = f"Seller propensity is {propensity.lower()} due to: " + "; ".join(reasons)
    
    return propensity, reason
