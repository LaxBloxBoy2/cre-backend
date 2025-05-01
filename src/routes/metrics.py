from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.metrics_schema import MetricExplanationResponse
from ..services.auth_service_db import get_current_active_user
from ..services.metrics_service import generate_metric_explanation
from ..services.security_service import validate_deal_access
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

@router.get("/deals/{deal_id}/explain-metric", response_model=MetricExplanationResponse, tags=["Metrics"])
async def explain_metric(
    deal_id: str,
    metric: str = Query(..., description="The metric to explain (irr, dscr, cap_rate, lease_structure, exit_cap_rate)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get an explanation for a specific metric
    
    This endpoint provides a plain-English explanation of a financial metric for a deal,
    including what the metric means, how it compares to industry standards, and what
    investors should know about it.
    
    Args:
        deal_id: The ID of the deal
        metric: The metric to explain (irr, dscr, cap_rate, lease_structure, exit_cap_rate)
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Metric explanation response
        
    Raises:
        HTTPException: If the deal is not found, the user is not authorized, or the metric is not supported
    """
    # Validate deal access
    validate_deal_access(db, deal_id, current_user)
    
    # Normalize metric name
    metric = metric.lower()
    
    # Validate metric
    valid_metrics = ["irr", "dscr", "cap_rate", "lease_structure", "exit_cap_rate"]
    if metric not in valid_metrics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported metric: {metric}. Valid metrics are: {', '.join(valid_metrics)}"
        )
    
    # Generate explanation
    explanation = await generate_metric_explanation(db, deal_id, metric)
    
    return explanation
