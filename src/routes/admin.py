from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.admin_schema import (
    UserListResponse,
    DealListResponse,
    DealStatusUpdate,
    DealStatusUpdateResponse,
    AdminDashboardSummary
)
from ..services.auth_service_db import get_current_active_user
from ..services.admin_service import (
    get_all_users,
    get_all_deals,
    get_deal_by_id,
    update_deal_status,
    get_dashboard_summary
)
from ..models.deal import Deal
from ..utils.limiter import limiter
from ..services.security_service import validate_deal_access

router = APIRouter()

def check_admin_or_manager(current_user: User = Depends(get_current_active_user)):
    """
    Check if the current user is an admin or manager

    Args:
        current_user: Current user

    Returns:
        Current user if admin or manager

    Raises:
        HTTPException: If not admin or manager
    """
    if current_user.role not in ["Admin"] and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin routes"
        )
    return current_user

@router.get("/users", response_model=UserListResponse, tags=["Admin"])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(check_admin_or_manager),
    db: Session = Depends(get_db)
):
    """
    Get all users

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current user
        db: Database session

    Returns:
        List of users
    """
    # If user is Admin, they can see all users
    # If user is Manager/Owner, they can only see users in their organization
    if current_user.role == "Admin":
        return get_all_users(db, skip=skip, limit=limit)
    else:
        # Filter users by organization
        return get_all_users(db, skip=skip, limit=limit, org_id=current_user.org_id)

@router.get("/deals", response_model=DealListResponse, tags=["Admin"])
async def get_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(check_admin_or_manager),
    db: Session = Depends(get_db)
):
    """
    Get all deals

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status
        user_id: Filter by user ID
        start_date: Filter by start date
        end_date: Filter by end date
        current_user: Current user
        db: Database session

    Returns:
        List of deals
    """
    # If user is Admin, they can see all deals
    # If user is Manager/Owner, they can only see deals in their organization
    if current_user.role == "Admin":
        return get_all_deals(
            db,
            skip=skip,
            limit=limit,
            status=status,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )
    else:
        # Filter deals by organization
        return get_all_deals(
            db,
            skip=skip,
            limit=limit,
            status=status,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            org_id=current_user.org_id
        )

@router.get("/deals/{deal_id}", response_model=None, tags=["Admin"])
async def get_deal(
    deal_id: str,
    current_user: User = Depends(check_admin_or_manager),
    db: Session = Depends(get_db)
):
    """
    Get a deal by ID

    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session

    Returns:
        Deal
    """
    deal = get_deal_by_id(db, deal_id=deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # If user is not Admin, check if they have access to the deal
    if current_user.role != "Admin" and deal.org_id != current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this deal"
        )

    return deal

@router.post("/deals/{deal_id}/approve", response_model=DealStatusUpdateResponse, tags=["Admin"])
async def approve_deal(
    deal_id: str,
    request: DealStatusUpdate,
    current_user: User = Depends(check_admin_or_manager),
    db: Session = Depends(get_db)
):
    """
    Approve a deal

    Args:
        deal_id: Deal ID
        request: Deal status update request
        current_user: Current user
        db: Database session

    Returns:
        Updated deal status
    """
    try:
        # Get the deal first to check organization access
        deal = get_deal_by_id(db, deal_id=deal_id)
        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Deal not found"
            )

        # If user is not Admin, check if they have access to the deal
        if current_user.role != "Admin" and deal.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this deal"
            )

        return update_deal_status(
            db,
            deal_id=deal_id,
            status="approved",
            admin_id=current_user.id,
            comment=request.comment
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/deals/{deal_id}/reject", response_model=DealStatusUpdateResponse, tags=["Admin"])
async def reject_deal(
    deal_id: str,
    request: DealStatusUpdate,
    current_user: User = Depends(check_admin_or_manager),
    db: Session = Depends(get_db)
):
    """
    Reject a deal

    Args:
        deal_id: Deal ID
        request: Deal status update request
        current_user: Current user
        db: Database session

    Returns:
        Updated deal status
    """
    try:
        # Get the deal first to check organization access
        deal = get_deal_by_id(db, deal_id=deal_id)
        if not deal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Deal not found"
            )

        # If user is not Admin, check if they have access to the deal
        if current_user.role != "Admin" and deal.org_id != current_user.org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this deal"
            )

        return update_deal_status(
            db,
            deal_id=deal_id,
            status="rejected",
            admin_id=current_user.id,
            comment=request.comment
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/dashboard-summary", response_model=AdminDashboardSummary, tags=["Admin"])
async def dashboard_summary(
    current_user: User = Depends(check_admin_or_manager),
    db: Session = Depends(get_db)
):
    """
    Get admin dashboard summary

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Dashboard summary
    """
    # If user is Admin, they can see all dashboard data
    # If user is Manager/Owner, they can only see data for their organization
    if current_user.role == "Admin":
        return get_dashboard_summary(db)
    else:
        # Filter dashboard data by organization
        return get_dashboard_summary(db, org_id=current_user.org_id)
