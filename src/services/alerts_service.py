import json
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.deal import Deal
from ..models.alert import DealAlert
from ..schemas.alert_schema import DealAlertCreate, DealMetricChange, DealChanges
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Define alert thresholds
ALERT_THRESHOLDS = {
    "lease_expiry_days": 90,  # Alert if lease expires within 90 days
    "dscr_warning": 1.2,      # Alert if DSCR falls below 1.2
    "cap_rate_warning": 0.5,  # Alert if cap rate increases by more than 0.5%
    "interest_rate_change": 0.25  # Alert if interest rate changes by more than 0.25%
}

# Define market benchmarks (placeholder values)
MARKET_BENCHMARKS = {
    "cap_rate": {
        "multifamily": 5.0,
        "office": 6.0,
        "retail": 6.5,
        "industrial": 5.5,
        "hospitality": 8.0,
        "default": 6.0
    },
    "exit_cap_rate": {
        "multifamily": 5.5,
        "office": 6.5,
        "retail": 7.0,
        "industrial": 6.0,
        "hospitality": 8.5,
        "default": 6.5
    }
}

def create_alert(db: Session, alert: DealAlertCreate) -> DealAlert:
    """
    Create a new deal alert
    
    Args:
        db: Database session
        alert: Alert data
        
    Returns:
        Created alert
    """
    # Create alert
    db_alert = DealAlert(
        id=str(uuid.uuid4()),
        deal_id=alert.deal_id,
        alert_type=alert.alert_type,
        message=alert.message,
        created_at=datetime.now(timezone.utc),
        resolved=False
    )
    
    # Add to database
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    return db_alert

def get_alerts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    deal_id: Optional[str] = None,
    resolved: Optional[bool] = None
) -> Tuple[List[DealAlert], int]:
    """
    Get alerts
    
    Args:
        db: Database session
        skip: Number of alerts to skip
        limit: Maximum number of alerts to return
        deal_id: Filter by deal ID
        resolved: Filter by resolved status
        
    Returns:
        Tuple of (list of alerts, total count)
    """
    # Create query
    query = db.query(DealAlert)
    
    # Apply filters
    if deal_id:
        query = query.filter(DealAlert.deal_id == deal_id)
    
    if resolved is not None:
        query = query.filter(DealAlert.resolved == resolved)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    alerts = query.order_by(DealAlert.created_at.desc()).offset(skip).limit(limit).all()
    
    return alerts, total

def get_alert(db: Session, alert_id: str) -> Optional[DealAlert]:
    """
    Get an alert by ID
    
    Args:
        db: Database session
        alert_id: Alert ID
        
    Returns:
        Alert or None if not found
    """
    return db.query(DealAlert).filter(DealAlert.id == alert_id).first()

def resolve_alert(db: Session, alert_id: str, user_id: str) -> DealAlert:
    """
    Resolve an alert
    
    Args:
        db: Database session
        alert_id: Alert ID
        user_id: User ID
        
    Returns:
        Updated alert
        
    Raises:
        HTTPException: If the alert is not found
    """
    # Get the alert
    alert = get_alert(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    # Update the alert
    alert.resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolved_by = user_id
    
    # Commit changes
    db.commit()
    db.refresh(alert)
    
    return alert

def check_for_alerts(db: Session) -> List[DealAlert]:
    """
    Check for new alerts
    
    Args:
        db: Database session
        
    Returns:
        List of created alerts
    """
    # Get all active deals
    deals = db.query(Deal).filter(Deal.status.in_(["draft", "in_review", "approved"])).all()
    
    # Initialize list for created alerts
    created_alerts = []
    
    # Check each deal for potential alerts
    for deal in deals:
        # Check for lease expiry
        if deal.lease_expiration_date:
            days_until_expiry = (deal.lease_expiration_date - datetime.now(timezone.utc)).days
            if days_until_expiry <= ALERT_THRESHOLDS["lease_expiry_days"] and days_until_expiry > 0:
                # Create alert
                alert = DealAlertCreate(
                    deal_id=deal.id,
                    alert_type="Lease Expiry",
                    message=f"Lease expires in {days_until_expiry} days on {deal.lease_expiration_date.strftime('%Y-%m-%d')}"
                )
                created_alert = create_alert(db, alert)
                created_alerts.append(created_alert)
        
        # Check for DSCR warning
        if deal.dscr is not None and deal.dscr < ALERT_THRESHOLDS["dscr_warning"]:
            # Create alert
            alert = DealAlertCreate(
                deal_id=deal.id,
                alert_type="DSCR Warning",
                message=f"DSCR is {deal.dscr:.2f}, which is below the recommended minimum of {ALERT_THRESHOLDS['dscr_warning']}"
            )
            created_alert = create_alert(db, alert)
            created_alerts.append(created_alert)
        
        # Check for cap rate warning
        property_type = deal.property_type.lower() if deal.property_type else "default"
        if property_type not in MARKET_BENCHMARKS["cap_rate"]:
            property_type = "default"
        
        # Calculate cap rate
        if deal.acquisition_price and deal.acquisition_price > 0:
            # Calculate NOI (simplified)
            potential_gross_income = deal.square_footage * deal.projected_rent_per_sf
            vacancy_loss = potential_gross_income * (deal.vacancy_rate / 100)
            effective_gross_income = potential_gross_income - vacancy_loss
            operating_expenses = deal.square_footage * deal.operating_expenses_per_sf
            noi = effective_gross_income - operating_expenses
            
            # Calculate cap rate
            cap_rate = (noi / deal.acquisition_price) * 100
            
            # Compare to market benchmark
            market_cap_rate = MARKET_BENCHMARKS["cap_rate"][property_type]
            if cap_rate > market_cap_rate + ALERT_THRESHOLDS["cap_rate_warning"]:
                # Create alert
                alert = DealAlertCreate(
                    deal_id=deal.id,
                    alert_type="Cap Rate Warning",
                    message=f"Cap rate is {cap_rate:.2f}%, which is {cap_rate - market_cap_rate:.2f}% above the market average of {market_cap_rate:.2f}% for {property_type} properties"
                )
                created_alert = create_alert(db, alert)
                created_alerts.append(created_alert)
        
        # Check for exit cap rate warning
        if deal.exit_cap_rate is not None:
            market_exit_cap_rate = MARKET_BENCHMARKS["exit_cap_rate"][property_type]
            if deal.exit_cap_rate > market_exit_cap_rate + ALERT_THRESHOLDS["cap_rate_warning"]:
                # Create alert
                alert = DealAlertCreate(
                    deal_id=deal.id,
                    alert_type="Exit Cap Rate Warning",
                    message=f"Exit cap rate is {deal.exit_cap_rate:.2f}%, which is {deal.exit_cap_rate - market_exit_cap_rate:.2f}% above the market average of {market_exit_cap_rate:.2f}% for {property_type} properties"
                )
                created_alert = create_alert(db, alert)
                created_alerts.append(created_alert)
    
    return created_alerts

def get_deal_changes(db: Session, deal_id: str) -> DealChanges:
    """
    Get changes in deal metrics
    
    Args:
        db: Database session
        deal_id: Deal ID
        
    Returns:
        Deal changes
        
    Raises:
        HTTPException: If the deal is not found
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Get previous metrics from the underwriting_result
    previous_metrics = {}
    if deal.underwriting_result:
        try:
            underwriting_result = json.loads(deal.underwriting_result)
            if isinstance(underwriting_result, dict):
                previous_metrics = underwriting_result.get("previous_metrics", {})
        except:
            pass
    
    # Calculate current metrics
    current_metrics = {
        "cap_rate": None,
        "dscr": deal.dscr,
        "irr": deal.projected_irr,
        "exit_cap_rate": deal.exit_cap_rate
    }
    
    # Calculate cap rate
    if deal.acquisition_price and deal.acquisition_price > 0:
        # Calculate NOI (simplified)
        potential_gross_income = deal.square_footage * deal.projected_rent_per_sf
        vacancy_loss = potential_gross_income * (deal.vacancy_rate / 100)
        effective_gross_income = potential_gross_income - vacancy_loss
        operating_expenses = deal.square_footage * deal.operating_expenses_per_sf
        noi = effective_gross_income - operating_expenses
        
        # Calculate cap rate
        current_metrics["cap_rate"] = (noi / deal.acquisition_price) * 100
    
    # Calculate changes
    changes = []
    for metric, current_value in current_metrics.items():
        if current_value is not None:
            previous_value = previous_metrics.get(metric)
            if previous_value is not None:
                change = current_value - previous_value
                change_str = f"+{change:.2f}" if change > 0 else f"{change:.2f}"
                
                changes.append(DealMetricChange(
                    metric=metric,
                    old_value=previous_value,
                    new_value=current_value,
                    change=change_str
                ))
            else:
                changes.append(DealMetricChange(
                    metric=metric,
                    old_value=None,
                    new_value=current_value,
                    change=None
                ))
    
    # Update previous metrics in the underwriting_result
    if deal.underwriting_result:
        try:
            underwriting_result = json.loads(deal.underwriting_result)
            if isinstance(underwriting_result, dict):
                underwriting_result["previous_metrics"] = current_metrics
                deal.underwriting_result = json.dumps(underwriting_result)
                db.commit()
        except:
            pass
    else:
        # Create new underwriting_result
        underwriting_result = {
            "previous_metrics": current_metrics
        }
        deal.underwriting_result = json.dumps(underwriting_result)
        db.commit()
    
    return DealChanges(changes=changes)
