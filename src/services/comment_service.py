import re
from sqlalchemy import desc
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.comment import DealComment
from ..models.user import User
from ..models.deal import Deal
from ..schemas.comment_schema import CommentCreate
from ..notification_service import create_mention_notifications, create_comment_notification
from ..activity_log_service import log_action

def extract_mentions(content: str) -> List[str]:
    """
    Extract @mentions from comment content

    Args:
        content: Comment content

    Returns:
        List of usernames mentioned
    """
    # Extract usernames from @mentions
    mentions = re.findall(r'@(\w+)', content)
    return mentions

def get_user_ids_by_names(db: Session, usernames: List[str], org_id: str) -> List[str]:
    """
    Get user IDs by usernames in the same organization

    Args:
        db: Database session
        usernames: List of usernames
        org_id: Organization ID

    Returns:
        List of user IDs
    """
    user_ids = []
    for username in usernames:
        user = db.query(User).filter(
            User.name.ilike(f"%{username}%"),
            User.org_id == org_id
        ).first()
        if user:
            user_ids.append(user.id)
    return user_ids

def create_comment(db: Session, deal_id: str, user_id: str, org_id: str, comment_data: CommentCreate) -> DealComment:
    """
    Create a new comment

    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        org_id: Organization ID
        comment_data: Comment data

    Returns:
        Created comment
    """
    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")

    # Check if the deal belongs to the organization
    if deal.org_id != org_id:
        raise ValueError("Deal does not belong to the organization")

    # Extract mentions from content
    mentions = extract_mentions(comment_data.content)
    tagged_user_ids = get_user_ids_by_names(db, mentions, org_id) if mentions else None

    # Create the comment
    comment = DealComment(
        deal_id=deal_id,
        user_id=user_id,
        org_id=org_id,
        content=comment_data.content,
        type=comment_data.type,
        tagged_user_ids=tagged_user_ids,
        created_at=datetime.now(timezone.utc)
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Create notifications for mentions
    if tagged_user_ids:
        create_mention_notifications(
            db=db,
            comment_id=comment.id,
            mentioned_user_ids=tagged_user_ids,
            actor_id=user_id,
            deal_id=deal_id,
            org_id=org_id
        )

    # Create notifications for users involved in the deal
    create_comment_notification(
        db=db,
        deal_id=deal_id,
        actor_id=user_id
    )

    # Log the action
    try:
        # Get the user's name
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "Unknown"

        # Get the deal name
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        deal_name = deal.project_name if deal else "Unknown"

        log_action(
            db=db,
            user_id=user_id,
            org_id=org_id,
            action="commented",
            message=f"{user_name} added a {comment.type} to {deal_name}.",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    return comment

def get_comments(db: Session, deal_id: str, org_id: str, skip: int = 0, limit: int = 100) -> Dict[str, Any]:
    """
    Get all comments for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        org_id: Organization ID
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        Dictionary with comments and total count
    """
    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")

    # Check if the deal belongs to the organization
    if deal.org_id != org_id:
        raise ValueError("Deal does not belong to the organization")

    # Get total count
    total = db.query(DealComment).filter(
        DealComment.deal_id == deal_id,
        DealComment.org_id == org_id
    ).count()

    # Get comments
    comments = db.query(DealComment).filter(
        DealComment.deal_id == deal_id,
        DealComment.org_id == org_id
    ).order_by(
        desc(DealComment.created_at)
    ).offset(skip).limit(limit).all()

    return {
        "comments": comments,
        "total": total
    }

def get_comment(db: Session, comment_id: str) -> Optional[DealComment]:
    """
    Get a comment by ID

    Args:
        db: Database session
        comment_id: Comment ID

    Returns:
        Comment or None if not found
    """
    return db.query(DealComment).filter(DealComment.id == comment_id).first()

def delete_comment(db: Session, comment_id: str, user_id: str, is_admin: bool = False) -> bool:
    """
    Delete a comment

    Args:
        db: Database session
        comment_id: Comment ID
        user_id: User ID
        is_admin: Whether the user is an admin

    Returns:
        True if deleted, False otherwise
    """
    comment = get_comment(db, comment_id)
    if not comment:
        return False

    # Check if the user is authorized to delete the comment
    if not is_admin and comment.user_id != user_id:
        return False

    # Log the action before deleting
    try:
        # Get the user's name
        user = db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "Unknown"

        # Get the deal name
        deal = db.query(Deal).filter(Deal.id == comment.deal_id).first()
        deal_name = deal.project_name if deal else "Unknown"

        log_action(
            db=db,
            user_id=user_id,
            org_id=comment.org_id,
            action="deleted_comment",
            message=f"{user_name} deleted a {comment.type} from {deal_name}.",
            deal_id=comment.deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    db.delete(comment)
    db.commit()

    return True
