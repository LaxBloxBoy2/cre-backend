from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from ..models.deal_stage import DealStage
from ..models.deal import Deal
from ..schemas.deal_stage_schema import DealStageCreate, DealStageUpdate
from ..security_service import validate_deal_access
from ..activity_log_service import log_action

def get_deal_stages(db: Session, deal_id: str, user_id: str, org_id: Optional[str] = None) -> List[DealStage]:
    """
    Get all stages for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        List of deal stages
    """
    # Validate deal access
    validate_deal_access(db, deal_id, user_id, org_id)
    
    # Get stages
    stages = db.query(DealStage).filter(DealStage.deal_id == deal_id).order_by(DealStage.order).all()
    
    return stages

def get_deal_stage(db: Session, stage_id: str, user_id: str, org_id: Optional[str] = None) -> DealStage:
    """
    Get a deal stage by ID
    
    Args:
        db: Database session
        stage_id: Stage ID
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Deal stage
    """
    # Get stage
    stage = db.query(DealStage).filter(DealStage.id == stage_id).first()
    
    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found"
        )
    
    # Validate deal access
    validate_deal_access(db, stage.deal_id, user_id, org_id)
    
    return stage

def create_deal_stage(db: Session, stage: DealStageCreate, deal_id: str, user_id: str, org_id: Optional[str] = None) -> DealStage:
    """
    Create a new deal stage
    
    Args:
        db: Database session
        stage: Stage data
        deal_id: Deal ID
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Created deal stage
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, user_id, org_id)
    
    # Create stage
    db_stage = DealStage(
        deal_id=deal_id,
        name=stage.name,
        order=stage.order,
        target_days=stage.target_days,
        completed=False
    )
    
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="create_stage",
        message=f"Created stage '{stage.name}' for deal '{deal.project_name}'",
        deal_id=deal_id
    )
    
    return db_stage

def update_deal_stage(db: Session, stage_id: str, stage_update: DealStageUpdate, user_id: str, org_id: Optional[str] = None) -> DealStage:
    """
    Update a deal stage
    
    Args:
        db: Database session
        stage_id: Stage ID
        stage_update: Stage update data
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Updated deal stage
    """
    # Get stage
    db_stage = get_deal_stage(db, stage_id, user_id, org_id)
    
    # Get deal for logging
    deal = db.query(Deal).filter(Deal.id == db_stage.deal_id).first()
    
    # Update stage
    if stage_update.name is not None:
        db_stage.name = stage_update.name
    
    if stage_update.order is not None:
        db_stage.order = stage_update.order
    
    if stage_update.target_days is not None:
        db_stage.target_days = stage_update.target_days
    
    if stage_update.completed is not None:
        # Only update completed status if it's changing
        if db_stage.completed != stage_update.completed:
            db_stage.completed = stage_update.completed
            
            if stage_update.completed:
                db_stage.completed_at = datetime.now(timezone.utc)
                
                # Log completion
                log_action(
                    db=db,
                    user_id=user_id,
                    org_id=org_id,
                    action="complete_stage",
                    message=f"Completed stage '{db_stage.name}' for deal '{deal.project_name}'",
                    deal_id=db_stage.deal_id
                )
            else:
                db_stage.completed_at = None
                
                # Log reopening
                log_action(
                    db=db,
                    user_id=user_id,
                    org_id=org_id,
                    action="reopen_stage",
                    message=f"Reopened stage '{db_stage.name}' for deal '{deal.project_name}'",
                    deal_id=db_stage.deal_id
                )
    
    db.commit()
    db.refresh(db_stage)
    
    return db_stage

def delete_deal_stage(db: Session, stage_id: str, user_id: str, org_id: Optional[str] = None) -> None:
    """
    Delete a deal stage
    
    Args:
        db: Database session
        stage_id: Stage ID
        user_id: User ID
        org_id: Organization ID
    """
    # Get stage
    db_stage = get_deal_stage(db, stage_id, user_id, org_id)
    
    # Get deal for logging
    deal = db.query(Deal).filter(Deal.id == db_stage.deal_id).first()
    
    # Delete stage
    db.delete(db_stage)
    db.commit()
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="delete_stage",
        message=f"Deleted stage '{db_stage.name}' for deal '{deal.project_name}'",
        deal_id=db_stage.deal_id
    )

def initialize_default_stages(db: Session, deal_id: str, user_id: str, org_id: Optional[str] = None) -> List[DealStage]:
    """
    Initialize default stages for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        List of created deal stages
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, user_id, org_id)
    
    # Check if stages already exist
    existing_stages = db.query(DealStage).filter(DealStage.deal_id == deal_id).count()
    if existing_stages > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deal already has stages"
        )
    
    # Default stages
    default_stages = [
        {"name": "Initial", "order": 1, "target_days": 7},
        {"name": "Due Diligence", "order": 2, "target_days": 14},
        {"name": "Negotiation", "order": 3, "target_days": 10},
        {"name": "Final Approval", "order": 4, "target_days": 7},
        {"name": "Closing", "order": 5, "target_days": 10}
    ]
    
    # Create stages
    created_stages = []
    for stage_data in default_stages:
        db_stage = DealStage(
            deal_id=deal_id,
            name=stage_data["name"],
            order=stage_data["order"],
            target_days=stage_data["target_days"],
            completed=False
        )
        
        db.add(db_stage)
        created_stages.append(db_stage)
    
    db.commit()
    
    # Refresh stages
    for stage in created_stages:
        db.refresh(stage)
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="initialize_stages",
        message=f"Initialized default stages for deal '{deal.project_name}'",
        deal_id=deal_id
    )
    
    return created_stages
