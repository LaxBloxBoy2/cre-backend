from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from ..models.property_attributes import PropertyAttributes
from ..models.deal import Deal
from ..schemas.property_attributes_schema import PropertyAttributesCreate, PropertyAttributesUpdate
from ..activity_log_service import log_action
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def get_property_attributes(db: Session, deal_id: str) -> Optional[PropertyAttributes]:
    """
    Get property attributes for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        Property attributes or None if not found
    """
    return db.query(PropertyAttributes).filter(PropertyAttributes.deal_id == deal_id).first()

def create_property_attributes(
    db: Session, 
    deal_id: str, 
    user_id: str,
    attributes: PropertyAttributesCreate
) -> PropertyAttributes:
    """
    Create property attributes for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        attributes: Property attributes data
        
    Returns:
        Created property attributes
    """
    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to create property attributes: Deal not found - ID: {deal_id}")
        raise ValueError("Deal not found")
    
    # Check if property attributes already exist for this deal
    existing = get_property_attributes(db, deal_id)
    if existing:
        logger.warning(f"Property attributes already exist for deal - ID: {deal_id}")
        raise ValueError("Property attributes already exist for this deal")
    
    # Create property attributes
    db_attributes = PropertyAttributes(
        deal_id=deal_id,
        property_class=attributes.property_class,
        building_style=attributes.building_style,
        year_built=attributes.year_built,
        year_renovated=attributes.year_renovated,
        zoning=attributes.zoning,
        lot_size=attributes.lot_size,
        number_of_floors=attributes.number_of_floors,
        number_of_units=attributes.number_of_units,
        average_unit_size=attributes.average_unit_size,
        parking_spaces=attributes.parking_spaces,
        has_elevator=attributes.has_elevator,
        has_central_air=attributes.has_central_air,
        has_pool=attributes.has_pool,
        has_fitness_center=attributes.has_fitness_center,
        has_rooftop=attributes.has_rooftop,
        has_retail=attributes.has_retail,
        property_subtype=attributes.property_subtype,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(db_attributes)
    db.commit()
    db.refresh(db_attributes)
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=user_id,
            org_id=deal.org_id,
            action="created_property_attributes",
            message=f"Added property attributes to {deal.project_name}.",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    return db_attributes

def update_property_attributes(
    db: Session, 
    deal_id: str, 
    user_id: str,
    attributes: PropertyAttributesUpdate
) -> Optional[PropertyAttributes]:
    """
    Update property attributes for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        attributes: Property attributes data
        
    Returns:
        Updated property attributes or None if not found
    """
    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to update property attributes: Deal not found - ID: {deal_id}")
        raise ValueError("Deal not found")
    
    # Get existing property attributes
    db_attributes = get_property_attributes(db, deal_id)
    if not db_attributes:
        # Create new property attributes if they don't exist
        return create_property_attributes(db, deal_id, user_id, attributes)
    
    # Update property attributes
    update_data = attributes.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_attributes, key, value)
    
    db_attributes.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(db_attributes)
    
    # Log the action
    try:
        log_action(
            db=db,
            user_id=user_id,
            org_id=deal.org_id,
            action="updated_property_attributes",
            message=f"Updated property attributes for {deal.project_name}.",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass
    
    return db_attributes
