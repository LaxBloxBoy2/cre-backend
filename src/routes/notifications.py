from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.notification_schema import Notification, NotificationList
from ..services.auth_service_db import get_current_active_user
from ..services.notification_service import (
    get_user_notifications,
    mark_notification_read,
    mark_all_notifications_read
)

router = APIRouter()

@router.get("", response_model=NotificationList, tags=["Notifications"])
async def get_notifications(
    unread: Optional[bool] = Query(None, description="Filter by unread status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get notifications for the current user
    
    Args:
        unread: Filter by unread status
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current user
        db: Database session
        
    Returns:
        List of notifications
    """
    try:
        result = get_user_notifications(
            db,
            user_id=current_user.id,
            unread_only=unread if unread is not None else False,
            skip=skip,
            limit=limit
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{notification_id}/read", response_model=dict, tags=["Notifications"])
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark a notification as read
    
    Args:
        notification_id: Notification ID
        current_user: Current user
        db: Database session
        
    Returns:
        Success message
    """
    result = mark_notification_read(db, notification_id, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or not owned by the user"
        )
    
    return {"message": "Notification marked as read"}

@router.post("/read-all", response_model=dict, tags=["Notifications"])
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read
    
    Args:
        current_user: Current user
        db: Database session
        
    Returns:
        Success message with count of notifications marked as read
    """
    count = mark_all_notifications_read(db, current_user.id)
    return {"message": f"{count} notifications marked as read"}
