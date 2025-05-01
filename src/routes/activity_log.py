from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.activity_log_schema import ActivityLog, ActivityLogList
from ..services.auth_service_db import get_current_active_user
from ..services.activity_log_service import (
    get_organization_activity,
    get_deal_activity
)
from ..services.security_service import validate_deal_access

router = APIRouter()

@router.get("", response_model=ActivityLogList, tags=["Activity"])
async def get_activity(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[str] = None,
    action_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get activity logs for the current user's organization

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        user_id: Filter by user ID
        action_type: Filter by action type
        start_date: Filter by start date
        end_date: Filter by end date
        current_user: Current user
        db: Database session

    Returns:
        List of activity logs
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )

    try:
        result = get_organization_activity(
            db,
            org_id=current_user.org_id,
            skip=skip,
            limit=limit,
            user_id=user_id,
            action_type=action_type,
            start_date=start_date,
            end_date=end_date
        )

        # Format the response
        logs = []
        for log in result["logs"]:
            logs.append({
                "id": log.id,
                "user": {
                    "id": log.user.id,
                    "name": log.user.name
                },
                "deal_id": log.deal_id,
                "action": log.action,
                "message": log.message,
                "created_at": log.created_at
            })

        return {
            "logs": logs,
            "total": result["total"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/deals/{deal_id}", response_model=ActivityLogList, tags=["Activity"])
async def get_deal_activity_logs(
    deal_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get activity logs for a deal

    Args:
        deal_id: Deal ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current user
        db: Database session

    Returns:
        List of activity logs
    """
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )

    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    try:
        result = get_deal_activity(
            db,
            deal_id=deal_id,
            skip=skip,
            limit=limit
        )

        # Format the response
        logs = []
        for log in result["logs"]:
            # Check if the log is in the user's organization
            if log.org_id != current_user.org_id:
                continue

            logs.append({
                "id": log.id,
                "user": {
                    "id": log.user.id,
                    "name": log.user.name
                },
                "deal_id": log.deal_id,
                "action": log.action,
                "message": log.message,
                "created_at": log.created_at
            })

        return {
            "logs": logs,
            "total": result["total"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
