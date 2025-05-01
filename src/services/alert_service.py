from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone
from ..models.alert import DealAlert
from ..models.deal import Deal
from ..schemas.alert_schema import DealAlertCreate, DealAlertResolve
from ..security_service import validate_deal_access
from ..activity_log_service import log_action

def get_alerts(db: Session, deal_id: Optional[str] = None, user_id: Optional[str] = None, 
               org_id: Optional[str] = None, resolved: Optional[bool] = None) -> List[DealAlert]:
    """
    Get alerts
    
    Args:
        db: Database session
        deal_id: Deal ID (optional)
        user_id: User ID (optional)
        org_id: Organization ID (optional)
        resolved: Filter by resolution status (optional)
        
    Returns:
        List of alerts
    """
    # Build query
    query = db.query(DealAlert)
    
    # Apply deal filter if provided
    if deal_id:
        # Validate deal access
        validate_deal_access(db, deal_id, user_id, org_id)
        query = query.filter(DealAlert.deal_id == deal_id)
    elif user_id and org_id:
        # Filter by organization
        query = query.join(Deal).filter(Deal.org_id == org_id)
    elif user_id:
        # Filter by user
        query = query.join(Deal).filter(Deal.user_id == user_id)
    
    # Apply resolution filter if provided
    if resolved is not None:
        query = query.filter(DealAlert.resolved == resolved)
    
    # Get alerts
    alerts = query.order_by(DealAlert.created_at.desc()).all()
    
    return alerts

def get_alert(db: Session, alert_id: str, user_id: str, org_id: Optional[str] = None) -> DealAlert:
    """
    Get an alert by ID
    
    Args:
        db: Database session
        alert_id: Alert ID
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Alert
    """
    # Get alert
    alert = db.query(DealAlert).filter(DealAlert.id == alert_id).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Validate deal access
    validate_deal_access(db, alert.deal_id, user_id, org_id)
    
    return alert

def create_alert(db: Session, alert: DealAlertCreate, user_id: str, org_id: Optional[str] = None) -> DealAlert:
    """
    Create a new alert
    
    Args:
        db: Database session
        alert: Alert data
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Created alert
    """
    # Validate deal access
    deal = validate_deal_access(db, alert.deal_id, user_id, org_id)
    
    # Create alert
    db_alert = DealAlert(
        deal_id=alert.deal_id,
        alert_type=alert.alert_type,
        message=alert.message,
        severity=alert.severity,
        resolved=False
    )
    
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="create_alert",
        message=f"Created alert for deal '{deal.project_name}': {alert.message}",
        deal_id=alert.deal_id
    )
    
    return db_alert

def resolve_alert(db: Session, alert_id: str, resolution: DealAlertResolve, user_id: str, org_id: Optional[str] = None) -> DealAlert:
    """
    Resolve an alert
    
    Args:
        db: Database session
        alert_id: Alert ID
        resolution: Resolution data
        user_id: User ID
        org_id: Organization ID
        
    Returns:
        Resolved alert
    """
    # Get alert
    db_alert = get_alert(db, alert_id, user_id, org_id)
    
    # Check if already resolved
    if db_alert.resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert is already resolved"
        )
    
    # Get deal for logging
    deal = db.query(Deal).filter(Deal.id == db_alert.deal_id).first()
    
    # Resolve alert
    db_alert.resolved = True
    db_alert.resolved_at = datetime.now(timezone.utc)
    db_alert.resolved_by = user_id
    
    db.commit()
    db.refresh(db_alert)
    
    # Log action
    resolution_note = f" with note: {resolution.resolution_note}" if resolution.resolution_note else ""
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="resolve_alert",
        message=f"Resolved alert for deal '{deal.project_name}'{resolution_note}",
        deal_id=db_alert.deal_id
    )
    
    return db_alert

def delete_alert(db: Session, alert_id: str, user_id: str, org_id: Optional[str] = None) -> None:
    """
    Delete an alert
    
    Args:
        db: Database session
        alert_id: Alert ID
        user_id: User ID
        org_id: Organization ID
    """
    # Get alert
    db_alert = get_alert(db, alert_id, user_id, org_id)
    
    # Get deal for logging
    deal = db.query(Deal).filter(Deal.id == db_alert.deal_id).first()
    
    # Delete alert
    db.delete(db_alert)
    db.commit()
    
    # Log action
    log_action(
        db=db,
        user_id=user_id,
        org_id=org_id,
        action="delete_alert",
        message=f"Deleted alert for deal '{deal.project_name}'",
        deal_id=db_alert.deal_id
    )
