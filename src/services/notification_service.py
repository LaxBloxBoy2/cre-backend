from sqlalchemy import desc, func
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.notification import Notification
from ..models.user import User
from ..models.deal import Deal
from ..models.organization import Organization
from ..schemas.notification_schema import NotificationCreate

def create_notification(
    db: Session,
    recipient_id: str,
    org_id: str,
    notification_type: str,
    message: str,
    actor_id: Optional[str] = None,
    deal_id: Optional[str] = None
) -> Notification:
    """
    Create a new notification
    
    Args:
        db: Database session
        recipient_id: ID of the recipient user
        org_id: ID of the organization
        notification_type: Type of the notification
        message: Human-readable summary of the notification
        actor_id: ID of the user who triggered the notification
        deal_id: ID of the related deal
        
    Returns:
        Created notification
    """
    # Check if the recipient exists
    recipient = db.query(User).filter(User.id == recipient_id).first()
    if not recipient:
        raise ValueError("Recipient not found")
    
    # Check if the recipient is in the organization
    if recipient.org_id != org_id:
        raise ValueError("Recipient is not in the organization")
    
    # Check if the actor exists (if provided)
    if actor_id:
        actor = db.query(User).filter(User.id == actor_id).first()
        if not actor:
            raise ValueError("Actor not found")
        
        # Check if the actor is in the organization
        if actor.org_id != org_id:
            raise ValueError("Actor is not in the organization")
    
    # Check if the deal exists (if provided)
    if deal_id:
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise ValueError("Deal not found")
        
        # Check if the deal is in the organization
        if deal.org_id != org_id:
            raise ValueError("Deal is not in the organization")
    
    # Create the notification
    notification = Notification(
        org_id=org_id,
        user_id=recipient_id,
        actor_id=actor_id,
        deal_id=deal_id,
        type=notification_type,
        message=message,
        is_read=False,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    return notification

def get_user_notifications(
    db: Session,
    user_id: str,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 100
) -> Dict[str, Any]:
    """
    Get notifications for a user
    
    Args:
        db: Database session
        user_id: ID of the user
        unread_only: Whether to return only unread notifications
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        Dictionary with notifications, total count, and unread count
    """
    # Check if the user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")
    
    # Build query
    query = db.query(Notification).filter(Notification.user_id == user_id)
    
    # Filter by unread if requested
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    # Get total count
    total = query.count()
    
    # Get unread count
    unread_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()
    
    # Get notifications
    notifications = query.order_by(
        desc(Notification.created_at)
    ).offset(skip).limit(limit).all()
    
    return {
        "notifications": notifications,
        "total": total,
        "unread_count": unread_count
    }

def mark_notification_read(db: Session, notification_id: str, user_id: str) -> bool:
    """
    Mark a notification as read
    
    Args:
        db: Database session
        notification_id: ID of the notification
        user_id: ID of the user
        
    Returns:
        True if marked as read, False otherwise
    """
    # Get the notification
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notification:
        return False
    
    # Check if the notification belongs to the user
    if notification.user_id != user_id:
        return False
    
    # Mark as read
    notification.is_read = True
    db.commit()
    
    return True

def mark_all_notifications_read(db: Session, user_id: str) -> int:
    """
    Mark all notifications for a user as read
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Number of notifications marked as read
    """
    # Get all unread notifications for the user
    result = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update(
        {"is_read": True}
    )
    
    db.commit()
    
    return result

def create_mention_notifications(
    db: Session,
    comment_id: str,
    mentioned_user_ids: List[str],
    actor_id: str,
    deal_id: str,
    org_id: str
) -> List[Notification]:
    """
    Create notifications for mentioned users in a comment
    
    Args:
        db: Database session
        comment_id: ID of the comment
        mentioned_user_ids: List of mentioned user IDs
        actor_id: ID of the user who created the comment
        deal_id: ID of the deal
        org_id: ID of the organization
        
    Returns:
        List of created notifications
    """
    # Get the actor
    actor = db.query(User).filter(User.id == actor_id).first()
    if not actor:
        raise ValueError("Actor not found")
    
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")
    
    # Create notifications for each mentioned user
    notifications = []
    for user_id in mentioned_user_ids:
        # Skip if the user is the actor
        if user_id == actor_id:
            continue
        
        # Create the notification
        try:
            notification = create_notification(
                db=db,
                recipient_id=user_id,
                org_id=org_id,
                notification_type="mention",
                message=f"{actor.name} mentioned you in {deal.project_name}.",
                actor_id=actor_id,
                deal_id=deal_id
            )
            notifications.append(notification)
        except ValueError:
            # Skip if the user is not found or not in the organization
            continue
    
    return notifications

def create_status_change_notification(
    db: Session,
    deal_id: str,
    actor_id: str,
    new_status: str
) -> Optional[Notification]:
    """
    Create a notification for a deal status change
    
    Args:
        db: Database session
        deal_id: ID of the deal
        actor_id: ID of the user who changed the status
        new_status: New status of the deal
        
    Returns:
        Created notification or None if the deal owner is the actor
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")
    
    # Get the actor
    actor = db.query(User).filter(User.id == actor_id).first()
    if not actor:
        raise ValueError("Actor not found")
    
    # Skip if the deal owner is the actor
    if deal.user_id == actor_id:
        return None
    
    # Create the notification
    notification = create_notification(
        db=db,
        recipient_id=deal.user_id,
        org_id=deal.org_id,
        notification_type="status_change",
        message=f"{actor.name} changed the status of {deal.project_name} to {new_status}.",
        actor_id=actor_id,
        deal_id=deal_id
    )
    
    return notification

def create_document_upload_notification(
    db: Session,
    deal_id: str,
    actor_id: str,
    document_type: str
) -> List[Notification]:
    """
    Create notifications for managers and owners when a document is uploaded
    
    Args:
        db: Database session
        deal_id: ID of the deal
        actor_id: ID of the user who uploaded the document
        document_type: Type of the document
        
    Returns:
        List of created notifications
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")
    
    # Get the actor
    actor = db.query(User).filter(User.id == actor_id).first()
    if not actor:
        raise ValueError("Actor not found")
    
    # Get managers and owners in the organization
    managers_and_owners = db.query(User).filter(
        User.org_id == deal.org_id,
        User.org_role.in_(["Owner", "Manager"])
    ).all()
    
    # Create notifications for each manager and owner
    notifications = []
    for user in managers_and_owners:
        # Skip if the user is the actor
        if user.id == actor_id:
            continue
        
        # Create the notification
        notification = create_notification(
            db=db,
            recipient_id=user.id,
            org_id=deal.org_id,
            notification_type="document_upload",
            message=f"{actor.name} uploaded a {document_type} for {deal.project_name}.",
            actor_id=actor_id,
            deal_id=deal_id
        )
        notifications.append(notification)
    
    return notifications

def create_comment_notification(
    db: Session,
    deal_id: str,
    actor_id: str
) -> List[Notification]:
    """
    Create notifications for users involved in a deal when a comment is added
    
    Args:
        db: Database session
        deal_id: ID of the deal
        actor_id: ID of the user who added the comment
        
    Returns:
        List of created notifications
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")
    
    # Get the actor
    actor = db.query(User).filter(User.id == actor_id).first()
    if not actor:
        raise ValueError("Actor not found")
    
    # Get users involved in the deal (owner and commenters)
    from ..models.comment import DealComment
    
    # Get unique user IDs from comments on this deal
    comment_user_ids = db.query(DealComment.user_id).filter(
        DealComment.deal_id == deal_id
    ).distinct().all()
    
    # Flatten the list of tuples
    comment_user_ids = [user_id for (user_id,) in comment_user_ids]
    
    # Add the deal owner
    if deal.user_id not in comment_user_ids:
        comment_user_ids.append(deal.user_id)
    
    # Create notifications for each user
    notifications = []
    for user_id in comment_user_ids:
        # Skip if the user is the actor
        if user_id == actor_id:
            continue
        
        # Create the notification
        try:
            notification = create_notification(
                db=db,
                recipient_id=user_id,
                org_id=deal.org_id,
                notification_type="comment",
                message=f"{actor.name} commented on {deal.project_name}.",
                actor_id=actor_id,
                deal_id=deal_id
            )
            notifications.append(notification)
        except ValueError:
            # Skip if the user is not found or not in the organization
            continue
    
    return notifications
