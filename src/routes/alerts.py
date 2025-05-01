from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.alert_schema import DealAlert, DealAlertList, DealAlertResolve, DealChanges
from ..services.auth_service_db import get_current_active_user
from ..services.alerts_service import get_alerts, get_alert, resolve_alert, get_deal_changes
from ..services.security_service import validate_deal_access
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

@router.get("/alerts", response_model=DealAlertList, tags=["Alerts"])
async def list_alerts(
    skip: int = Query(0, description="Number of alerts to skip"),
    limit: int = Query(100, description="Maximum number of alerts to return"),
    deal_id: Optional[str] = Query(None, description="Filter by deal ID"),
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List alerts
    
    This endpoint returns a list of alerts, optionally filtered by deal ID and resolved status.
    
    Args:
        skip: Number of alerts to skip (for pagination)
        limit: Maximum number of alerts to return (for pagination)
        deal_id: Filter by deal ID
        resolved: Filter by resolved status
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        List of alerts
    """
    # Check if user has appropriate role (Analyst, Manager, or Admin)
    if current_user.role not in ["Admin", "Manager", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Analysts, Managers, and Admins can view alerts"
        )
    
    # If deal_id is provided, validate access to the deal
    if deal_id:
        validate_deal_access(db, deal_id, current_user)
    
    # Get alerts
    alerts, total = get_alerts(
        db=db,
        skip=skip,
        limit=limit,
        deal_id=deal_id,
        resolved=resolved
    )
    
    return DealAlertList(alerts=alerts, total=total)

@router.post("/alerts/{alert_id}/resolve", response_model=DealAlert, tags=["Alerts"])
async def resolve_alert_route(
    alert_id: str,
    resolution: DealAlertResolve,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Resolve an alert
    
    This endpoint marks an alert as resolved.
    
    Args:
        alert_id: The ID of the alert to resolve
        resolution: Resolution data
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        The resolved alert
        
    Raises:
        HTTPException: If the alert is not found or the user is not authorized
    """
    # Get the alert
    alert = get_alert(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Validate access to the deal
    validate_deal_access(db, alert.deal_id, current_user)
    
    # Check if user has appropriate role (Manager or Admin)
    if current_user.role not in ["Admin", "Manager"] and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers and Admins can resolve alerts"
        )
    
    # Resolve the alert
    resolved_alert = resolve_alert(db, alert_id, current_user.id)
    
    return resolved_alert

@router.get("/deals/{deal_id}/changes", response_model=DealChanges, tags=["Alerts"])
async def get_deal_changes_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get changes in deal metrics
    
    This endpoint returns changes in deal metrics compared to the previous state.
    
    Args:
        deal_id: The ID of the deal
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Deal changes
        
    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate access to the deal
    validate_deal_access(db, deal_id, current_user)
    
    # Get deal changes
    changes = get_deal_changes(db, deal_id)
    
    return changes
