import uuid
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import HTTPException
from ..schemas.crud_deal_schema import DealCreate, DealUpdate, Deal

# In-memory database for deals
deals_db: Dict[str, Deal] = {}


def create_deal(deal: DealCreate) -> Deal:
    """
    Create a new deal
    
    Args:
        deal: The deal data to create
        
    Returns:
        The created deal with ID and timestamps
    """
    # Generate a unique ID
    deal_id = str(uuid.uuid4())
    
    # Get current timestamp
    now = datetime.now()
    
    # Create a new Deal object
    new_deal = Deal(
        id=deal_id,
        project_name=deal.project_name,
        location=deal.location,
        property_type=deal.property_type,
        acquisition_price=deal.acquisition_price,
        construction_cost=deal.construction_cost,
        square_footage=deal.square_footage,
        projected_rent_per_sf=deal.projected_rent_per_sf,
        vacancy_rate=deal.vacancy_rate,
        operating_expenses_per_sf=deal.operating_expenses_per_sf,
        exit_cap_rate=deal.exit_cap_rate,
        underwriting_result=deal.underwriting_result,
        ai_memo=deal.ai_memo,
        status=deal.status,
        created_at=now,
        updated_at=now
    )
    
    # Save to the in-memory database
    deals_db[deal_id] = new_deal
    
    return new_deal


def get_deals() -> List[Deal]:
    """
    Get all deals
    
    Returns:
        List of all deals
    """
    return list(deals_db.values())


def get_deal(deal_id: str) -> Deal:
    """
    Get a deal by ID
    
    Args:
        deal_id: The ID of the deal to get
        
    Returns:
        The deal with the specified ID
        
    Raises:
        HTTPException: If the deal is not found
    """
    if deal_id not in deals_db:
        raise HTTPException(status_code=404, detail=f"Deal with ID {deal_id} not found")
    
    return deals_db[deal_id]


def update_deal(deal_id: str, deal_update: DealUpdate) -> Deal:
    """
    Update a deal
    
    Args:
        deal_id: The ID of the deal to update
        deal_update: The deal data to update
        
    Returns:
        The updated deal
        
    Raises:
        HTTPException: If the deal is not found
    """
    # Check if the deal exists
    if deal_id not in deals_db:
        raise HTTPException(status_code=404, detail=f"Deal with ID {deal_id} not found")
    
    # Get the existing deal
    existing_deal = deals_db[deal_id]
    
    # Create a dictionary from the existing deal
    existing_deal_dict = existing_deal.model_dump()
    
    # Create a dictionary from the update data, excluding None values
    update_data = {k: v for k, v in deal_update.model_dump().items() if v is not None}
    
    # Update the existing deal data
    existing_deal_dict.update(update_data)
    
    # Update the updated_at timestamp
    existing_deal_dict["updated_at"] = datetime.now()
    
    # Create a new Deal object with the updated data
    updated_deal = Deal(**existing_deal_dict)
    
    # Save to the in-memory database
    deals_db[deal_id] = updated_deal
    
    return updated_deal


def delete_deal(deal_id: str) -> Dict[str, str]:
    """
    Delete a deal
    
    Args:
        deal_id: The ID of the deal to delete
        
    Returns:
        A message indicating the deal was deleted
        
    Raises:
        HTTPException: If the deal is not found
    """
    # Check if the deal exists
    if deal_id not in deals_db:
        raise HTTPException(status_code=404, detail=f"Deal with ID {deal_id} not found")
    
    # Delete the deal
    del deals_db[deal_id]
    
    return {"message": f"Deal with ID {deal_id} deleted"}
