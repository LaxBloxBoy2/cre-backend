from fastapi import APIRouter, Depends, HTTPException, status, Path, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.deal_stage_schema import DealStage, DealStageCreate, DealStageUpdate, DealStageList
from ..services.auth_service_db import get_current_active_user
from ..services.security_service import validate_deal_access, can_edit_deal
from ..models.deal_stage import DealStage as DealStageModel
from ..models.deal import Deal
from ..services.activity_log_service import log_action

router = APIRouter(
    prefix="/api",
    tags=["deal stages"],
    responses={404: {"description": "Not found"}},
)

@router.get("/deals/{deal_id}/stages", response_model=List[DealStage], tags=["Deal Stages"])
async def get_deal_stages(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all stages for a deal

    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session

    Returns:
        List of deal stages
    """
    # Validate deal access
    validate_deal_access(db, deal_id, current_user)

    # Get stages
    stages = db.query(DealStageModel).filter(DealStageModel.deal_id == deal_id).order_by(DealStageModel.order).all()

    return stages

@router.patch("/deals/{deal_id}/stages/{stage_id}", response_model=DealStage, tags=["Deal Stages"])
async def update_deal_stage(
    deal_id: str,
    stage_id: str,
    stage_update: DealStageUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a stage for a deal

    Args:
        deal_id: Deal ID
        stage_id: Stage ID
        stage_update: Stage update data
        current_user: Current user
        db: Database session

    Returns:
        Updated stage
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    # Check if user can edit the deal
    if not can_edit_deal(current_user, deal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update stages for this deal"
        )

    # Get stage
    db_stage = db.query(DealStageModel).filter(
        DealStageModel.id == stage_id,
        DealStageModel.deal_id == deal_id
    ).first()

    if not db_stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found"
        )

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
                    user_id=current_user.id,
                    action="complete_stage",
                    message=f"Completed stage '{db_stage.name}' for deal '{deal.project_name}'",
                    deal_id=deal_id
                )
            else:
                db_stage.completed_at = None

                # Log reopening
                log_action(
                    db=db,
                    user_id=current_user.id,
                    action="reopen_stage",
                    message=f"Reopened stage '{db_stage.name}' for deal '{deal.project_name}'",
                    deal_id=deal_id
                )

    db.commit()
    db.refresh(db_stage)

    return db_stage
