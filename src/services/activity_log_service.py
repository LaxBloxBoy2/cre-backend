import logging
from sqlalchemy import desc
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from ..models.activity_log import ActivityLog
from ..models.user import User
from ..models.deal import Deal
from ..models.organization import Organization
from ..schemas.activity_log_schema import ActivityLogCreate
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def log_action(
    db: Session,
    user_id: str,
    org_id: str,
    action: str,
    message: str,
    deal_id: Optional[str] = None
) -> ActivityLog:
    """
    Log an action

    Args:
        db: Database session
        user_id: ID of the user who performed the action
        org_id: ID of the organization
        action: Action performed
        message: Human-readable summary of the action
        deal_id: ID of the related deal

    Returns:
        Created activity log
    """
    # Check if the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning(f"Failed to log action: User not found - ID: {user_id}")
        raise ValueError("User not found")

    # Check if the organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        logger.warning(f"Failed to log action: Organization not found - ID: {org_id}")
        raise ValueError("Organization not found")

    # Check if the deal exists (if provided)
    if deal_id:
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            logger.warning(f"Failed to log action: Deal not found - ID: {deal_id}")
            raise ValueError("Deal not found")

        # Check if the deal is in the organization
        if deal.org_id != org_id:
            logger.warning(f"Failed to log action: Deal {deal_id} is not in organization {org_id}")
            raise ValueError("Deal is not in the organization")

    # Create the activity log
    activity_log = ActivityLog(
        user_id=user_id,
        org_id=org_id,
        deal_id=deal_id,
        action=action,
        message=message,
        created_at=datetime.now(timezone.utc)
    )

    db.add(activity_log)
    db.commit()
    db.refresh(activity_log)

    # Log the action to the application log
    logger.info(f"Activity logged: {action} - {message} - User: {user_id}, Org: {org_id}, Deal: {deal_id}")

    return activity_log

def get_organization_activity(
    db: Session,
    org_id: str,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> Dict[str, Any]:
    """
    Get activity logs for an organization

    Args:
        db: Database session
        org_id: ID of the organization
        skip: Number of records to skip
        limit: Maximum number of records to return
        user_id: Filter by user ID
        action_type: Filter by action type
        start_date: Filter by start date
        end_date: Filter by end date

    Returns:
        Dictionary with activity logs and total count
    """
    # Build query
    query = db.query(ActivityLog).filter(ActivityLog.org_id == org_id)

    # Apply filters
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)

    if action_type:
        query = query.filter(ActivityLog.action == action_type)

    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)

    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)

    # Get total count
    total = query.count()

    # Get activity logs
    logs = query.order_by(
        desc(ActivityLog.created_at)
    ).offset(skip).limit(limit).all()

    return {
        "logs": logs,
        "total": total
    }

def get_deal_activity(
    db: Session,
    deal_id: str,
    skip: int = 0,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Get activity logs for a deal

    Args:
        db: Database session
        deal_id: ID of the deal
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Dictionary with activity logs and total count
    """
    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Failed to get deal activity: Deal not found - ID: {deal_id}")
        raise ValueError("Deal not found")

    # Get total count
    total = db.query(ActivityLog).filter(ActivityLog.deal_id == deal_id).count()

    # Get activity logs
    logs = db.query(ActivityLog).filter(
        ActivityLog.deal_id == deal_id
    ).order_by(
        desc(ActivityLog.created_at)
    ).offset(skip).limit(limit).all()

    return {
        "logs": logs,
        "total": total
    }

def get_recent_activity(
    db: Session,
    org_id: str,
    days: int = 7,
    limit: int = 10
) -> List[ActivityLog]:
    """
    Get recent activity logs for an organization

    Args:
        db: Database session
        org_id: ID of the organization
        days: Number of days to look back
        limit: Maximum number of records to return

    Returns:
        List of activity logs
    """
    # Calculate the start date
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Get activity logs
    logs = db.query(ActivityLog).filter(
        ActivityLog.org_id == org_id,
        ActivityLog.created_at >= start_date
    ).order_by(
        desc(ActivityLog.created_at)
    ).limit(limit).all()

    return logs
