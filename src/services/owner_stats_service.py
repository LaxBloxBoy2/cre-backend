from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from ..models.deal import Deal
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def get_owner_hold_stats(db: Session, deal_id: str) -> Optional[Dict[str, Any]]:
    """
    Get owner hold statistics for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        Owner hold statistics or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to get owner hold stats: Deal not found - ID: {deal_id}")
        return None
    
    # If owner name is not set, return None
    if not deal.owner_name:
        logger.warning(f"Failed to get owner hold stats: Owner name not set - Deal ID: {deal_id}")
        return None
    
    # Calculate current hold period
    current_hold = None
    if deal.owner_acquisition_date:
        current_hold = (datetime.now(timezone.utc) - deal.owner_acquisition_date).days / 365.0
    
    # Get all deals with the same owner
    owner_deals = db.query(Deal).filter(
        Deal.owner_name == deal.owner_name,
        Deal.owner_acquisition_date.isnot(None)
    ).all()
    
    # Calculate average hold period
    average_hold = None
    if owner_deals:
        # Get completed deals (those that have been sold)
        completed_deals = [d for d in owner_deals if d.status == "sold"]
        
        if completed_deals:
            # Calculate average hold period for completed deals
            hold_periods = []
            for d in completed_deals:
                if d.owner_acquisition_date and d.status_changed_at:
                    hold_period = (d.status_changed_at - d.owner_acquisition_date).days / 365.0
                    hold_periods.append(hold_period)
            
            if hold_periods:
                average_hold = sum(hold_periods) / len(hold_periods)
        
        # If no completed deals, use current hold periods
        if average_hold is None:
            hold_periods = []
            for d in owner_deals:
                if d.owner_acquisition_date:
                    hold_period = (datetime.now(timezone.utc) - d.owner_acquisition_date).days / 365.0
                    hold_periods.append(hold_period)
            
            if hold_periods:
                average_hold = sum(hold_periods) / len(hold_periods)
    
    # Get owner portfolio size
    portfolio_size = db.query(Deal).filter(Deal.owner_name == deal.owner_name).count()
    
    # Get owner property types
    property_types = db.query(Deal.property_type).filter(
        Deal.owner_name == deal.owner_name,
        Deal.property_type.isnot(None)
    ).distinct().all()
    property_types = [pt[0] for pt in property_types]
    
    # Get owner locations
    locations = db.query(Deal.location).filter(
        Deal.owner_name == deal.owner_name,
        Deal.location.isnot(None)
    ).distinct().all()
    locations = [loc[0] for loc in locations]
    
    return {
        "owner_name": deal.owner_name,
        "owner_type": deal.owner_type,
        "current_hold": current_hold,
        "average_hold": average_hold,
        "portfolio_size": portfolio_size,
        "property_types": property_types,
        "locations": locations
    }
