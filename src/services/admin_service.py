from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from ..models.user import User
from ..models.deal import Deal
from ..schemas.admin_schema import (
    UserAdminResponse,
    DealAdminResponse,
    DealStatusUpdateResponse,
    AdminDashboardSummary
)
from ..notification_service import create_status_change_notification
from ..activity_log_service import log_action

def get_all_users(db: Session, skip: int = 0, limit: int = 100, org_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Get all users with deal count

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Dictionary with users and total count
    """
    # Build query filters
    filters = []
    if org_id:
        filters.append(User.org_id == org_id)

    # Get total count
    total = db.query(func.count(User.id)).filter(*filters).scalar()

    # Get users with deal count
    users = db.query(
        User,
        func.count(Deal.id).label("deal_count")
    ).outerjoin(
        Deal, User.id == Deal.user_id
    ).filter(
        *filters
    ).group_by(
        User.id
    ).order_by(
        User.created_at.desc()
    ).offset(skip).limit(limit).all()

    # Format response
    result = []
    for user, deal_count in users:
        result.append(
            UserAdminResponse(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                created_at=user.created_at,
                deal_count=deal_count,
                last_login=None  # We don't track last login yet
            )
        )

    return {
        "users": result,
        "total": total
    }

def get_all_deals(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    org_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get all deals with filters

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status
        user_id: Filter by user ID
        start_date: Filter by start date
        end_date: Filter by end date

    Returns:
        Dictionary with deals and total count
    """
    # Build query filters
    filters = []
    if status:
        filters.append(Deal.status == status)
    if user_id:
        filters.append(Deal.user_id == user_id)
    if start_date:
        filters.append(Deal.created_at >= start_date)
    if end_date:
        filters.append(Deal.created_at <= end_date)
    if org_id:
        filters.append(Deal.org_id == org_id)

    # Get total count
    total = db.query(func.count(Deal.id)).filter(*filters).scalar()

    # Get deals with user info
    deals = db.query(
        Deal,
        User.name.label("user_name")
    ).join(
        User, Deal.user_id == User.id
    ).filter(
        *filters
    ).order_by(
        Deal.created_at.desc()
    ).offset(skip).limit(limit).all()

    # Format response
    result = []
    for deal, user_name in deals:
        result.append(
            DealAdminResponse(
                id=deal.id,
                project_name=deal.project_name,
                user_id=deal.user_id,
                user_name=user_name,
                status=deal.status,
                location=deal.location,
                property_type=deal.property_type,
                created_at=deal.created_at
            )
        )

    return {
        "deals": result,
        "total": total
    }

def get_deal_by_id(db: Session, deal_id: str) -> Optional[Deal]:
    """
    Get a deal by ID

    Args:
        db: Database session
        deal_id: Deal ID

    Returns:
        Deal object or None if not found
    """
    return db.query(Deal).filter(Deal.id == deal_id).first()

def update_deal_status(
    db: Session,
    deal_id: str,
    status: str,
    admin_id: str,
    comment: Optional[str] = None
) -> DealStatusUpdateResponse:
    """
    Update a deal's status

    Args:
        db: Database session
        deal_id: Deal ID
        status: New status
        admin_id: Admin user ID
        comment: Optional comment

    Returns:
        Updated deal status
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")

    # Update the deal
    deal.status = status.lower()  # Convert to lowercase
    deal.updated_by = admin_id
    deal.updated_at = datetime.now(timezone.utc)
    deal.status_changed_at = datetime.now(timezone.utc)
    deal.status_changed_by = admin_id
    deal.admin_comment = comment

    # Save changes
    db.commit()
    db.refresh(deal)

    # Get admin name
    admin = db.query(User).filter(User.id == admin_id).first()
    admin_name = admin.name if admin else "Unknown"

    # Create notification for the deal owner
    try:
        create_status_change_notification(
            db=db,
            deal_id=deal_id,
            actor_id=admin_id,
            new_status=status
        )
    except ValueError:
        # Ignore errors in notification creation
        pass

    # Log the action
    try:
        log_action(
            db=db,
            user_id=admin_id,
            org_id=deal.org_id,
            action="admin_status_change",
            message=f"{admin_name} {status.lower()} the deal: {deal.project_name}.",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    # Return response
    return DealStatusUpdateResponse(
        id=deal.id,
        status=deal.status,
        updated_by=admin_name,
        updated_at=deal.updated_at,
        comment=deal.admin_comment
    )

def get_dashboard_summary(db: Session, org_id: Optional[str] = None) -> AdminDashboardSummary:
    """
    Get admin dashboard summary

    Args:
        db: Database session

    Returns:
        Dashboard summary
    """
    # Build query filters
    user_filters = []
    deal_filters = []
    if org_id:
        user_filters.append(User.org_id == org_id)
        deal_filters.append(Deal.org_id == org_id)

    # Get total users
    total_users = db.query(func.count(User.id)).filter(*user_filters).scalar()

    # Get total deals
    total_deals = db.query(func.count(Deal.id)).filter(*deal_filters).scalar()

    # Get approved deals
    approved_deals = db.query(func.count(Deal.id)).filter(Deal.status == "approved", *deal_filters).scalar()

    # Get rejected deals
    rejected_deals = db.query(func.count(Deal.id)).filter(Deal.status == "rejected", *deal_filters).scalar()

    # Get active users in last 7 days
    # Note: This is a placeholder since we don't track last login yet
    # In a real implementation, you would query a login_history table or similar
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    active_users = db.query(func.count(User.id)).filter(User.created_at >= seven_days_ago, *user_filters).scalar()

    # Return summary
    return AdminDashboardSummary(
        total_users=total_users,
        total_deals=total_deals,
        approved_deals=approved_deals,
        rejected_deals=rejected_deals,
        active_users_last_7d=active_users
    )
