from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta

from ..database import get_db
from ..models.fund_optimizer import FundOptimizerRun, OptimizerAction, OptimizationStatus, ActionType
from ..schemas.fund_optimizer import (
    OptimizationRequest, 
    OptimizationResponse, 
    OptimizationRunDetail,
    OptimizerActionResponse
)
from ..services.optimizer import FundOptimizer

router = APIRouter(prefix="/fund", tags=["fund_optimizer"])


@router.post("/optimize", response_model=OptimizationResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_optimization(
    request: OptimizationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start a new fund optimization run"""
    
    # Create a new optimization run record
    run = FundOptimizerRun(
        fund_id=request.fund_id,
        horizon_months=request.target_horizon_years * 12,
        min_dscr=request.constraints.min_dscr,
        max_leverage=request.constraints.max_leverage,
        status=OptimizationStatus.PENDING
    )
    
    db.add(run)
    db.commit()
    db.refresh(run)
    
    # Start the optimization in the background
    optimizer = FundOptimizer(run.id, db)
    background_tasks.add_task(optimizer.run_optimization)
    
    return OptimizationResponse(
        run_id=run.id,
        status=run.status.value,
        message="Optimization started successfully"
    )


@router.get("/optimize/{run_id}", response_model=OptimizationRunDetail)
async def get_optimization_run(run_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get details of a specific optimization run"""
    
    run = db.query(FundOptimizerRun).filter(FundOptimizerRun.id == run_id).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization run with ID {run_id} not found"
        )
    
    # Get all actions for this run
    actions = db.query(OptimizerAction).filter(OptimizerAction.run_id == run_id).all()
    
    # Convert actions to response model
    action_responses = []
    for action in actions:
        action_response = OptimizerActionResponse(
            id=action.id,
            asset_id=action.asset_id,
            month=action.month,
            action_type=action.action_type.value,
            confidence_score=action.confidence_score
        )
        
        # Add action-specific details
        if action.action_type == ActionType.CAPEX and action.capex_amount:
            action_response.details = {"capex_amount": action.capex_amount}
        elif action.action_type == ActionType.REFINANCE and action.refinance_amount:
            action_response.details = {"refinance_amount": action.refinance_amount}
        elif action.action_type == ActionType.SELL and action.sale_price:
            action_response.details = {"sale_price": action.sale_price}
        
        action_responses.append(action_response)
    
    # Create the response
    return OptimizationRunDetail(
        id=run.id,
        fund_id=run.fund_id,
        start_timestamp=run.start_timestamp,
        horizon_months=run.horizon_months,
        optimized_irr=run.optimized_irr,
        baseline_irr=run.baseline_irr,
        status=run.status.value,
        actions=action_responses,
        constraints={
            "min_dscr": run.min_dscr,
            "max_leverage": run.max_leverage
        }
    )


@router.delete("/optimize/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_optimization(run_id: uuid.UUID, db: Session = Depends(get_db)):
    """Cancel an ongoing optimization run"""
    
    run = db.query(FundOptimizerRun).filter(FundOptimizerRun.id == run_id).first()
    
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Optimization run with ID {run_id} not found"
        )
    
    if run.status not in [OptimizationStatus.PENDING, OptimizationStatus.RUNNING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel optimization run with status {run.status.value}"
        )
    
    # Update the status to FAILED
    run.status = OptimizationStatus.FAILED
    db.commit()
    
    return None
