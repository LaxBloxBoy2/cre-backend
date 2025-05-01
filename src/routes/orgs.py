from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.organization_schema import (
    OrganizationCreate,
    OrganizationUpdate,
    Organization,
    OrganizationWithMembers,
    InviteCreate,
    Invite
)
from pydantic import BaseModel
from ..services.auth_service_db import get_current_active_user
from ..services.org_service import (
    create_organization,
    get_organization,
    get_organization_by_user,
    get_organization_with_members,
    update_organization,
    delete_organization,
    check_user_in_organization,
    check_user_is_owner_or_manager,
    update_organization_last_active
)
from ..services.invite_service import (
    create_invite,
    get_pending_invites_by_organization,
    cancel_invite
)

router = APIRouter()

@router.post("", response_model=Organization, status_code=status.HTTP_201_CREATED, tags=["Organizations"])
async def create_org(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new organization

    Args:
        org_data: Organization data
        current_user: Current user
        db: Database session

    Returns:
        Created organization
    """
    # Check if the user is already in an organization
    existing_org = get_organization_by_user(db, current_user.id)
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already in an organization"
        )

    try:
        return create_organization(db, org_data, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/my", response_model=Organization, tags=["Organizations"])
async def get_my_org(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's organization

    Args:
        current_user: Current user
        db: Database session

    Returns:
        User's organization
    """
    org = get_organization_by_user(db, current_user.id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not in an organization"
        )

    # Update last_active_at
    update_organization_last_active(db, org.id)

    return org

@router.get("/my/members", response_model=OrganizationWithMembers, tags=["Organizations"])
async def get_my_org_with_members(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's organization with members

    Args:
        current_user: Current user
        db: Database session

    Returns:
        User's organization with members
    """
    org = get_organization_by_user(db, current_user.id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not in an organization"
        )

    # Update last_active_at
    update_organization_last_active(db, org.id)

    return get_organization_with_members(db, org.id)

@router.put("/my", response_model=Organization, tags=["Organizations"])
async def update_my_org(
    org_data: OrganizationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update the current user's organization

    Args:
        org_data: Organization data to update
        current_user: Current user
        db: Database session

    Returns:
        Updated organization
    """
    org = get_organization_by_user(db, current_user.id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not in an organization"
        )

    # Check if the user is an owner
    if current_user.org_role != "Owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can update the organization"
        )

    return update_organization(db, org.id, org_data)

@router.delete("/my", status_code=status.HTTP_204_NO_CONTENT, tags=["Organizations"])
async def delete_my_org(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's organization

    Args:
        current_user: Current user
        db: Database session

    Returns:
        No content
    """
    org = get_organization_by_user(db, current_user.id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not in an organization"
        )

    # Check if the user is an owner
    if current_user.org_role != "Owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can delete the organization"
        )

    result = delete_organization(db, org.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete organization"
        )

@router.post("/invite", response_model=Invite, tags=["Organizations"])
async def invite_to_org(
    invite_data: InviteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Invite a user to the current user's organization

    Args:
        invite_data: Invite data
        current_user: Current user
        db: Database session

    Returns:
        Created invite
    """
    org = get_organization_by_user(db, current_user.id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not in an organization"
        )

    # Check if the user is an owner or manager
    if current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners and managers can invite users"
        )

    try:
        return create_invite(db, invite_data, org.id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/invites", response_model=List[Invite], tags=["Organizations"])
async def get_org_invites(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all pending invites for the current user's organization

    Args:
        current_user: Current user
        db: Database session

    Returns:
        List of pending invites
    """
    org = get_organization_by_user(db, current_user.id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not in an organization"
        )

    # Check if the user is an owner or manager
    if current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners and managers can view invites"
        )

    return get_pending_invites_by_organization(db, org.id)

@router.delete("/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Organizations"])
async def cancel_org_invite(
    invite_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an invite

    Args:
        invite_id: Invite ID
        current_user: Current user
        db: Database session

    Returns:
        No content
    """
    result = cancel_invite(db, invite_id, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to cancel invite"
        )


class OrganizationStats(BaseModel):
    """Response model for organization statistics"""
    total_orgs: int
    orgs_by_industry: Dict[str, int]
    avg_team_size: float
    total_users: int
    active_orgs_last_30_days: int


@router.get("/stats", response_model=OrganizationStats, tags=["Organizations"])
async def get_org_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get organization statistics (Admin only)

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Organization statistics
    """
    # Check if the user is an admin
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access organization statistics"
        )

    # Get all organizations
    orgs = db.query(Organization).all()

    # Get all users
    users = db.query(User).all()

    # Calculate statistics
    total_orgs = len(orgs)

    # Count organizations by industry
    orgs_by_industry = {}
    for org in orgs:
        if org.industry:
            if org.industry in orgs_by_industry:
                orgs_by_industry[org.industry] += 1
            else:
                orgs_by_industry[org.industry] = 1

    # Calculate average team size
    total_team_size = 0
    orgs_with_team_size = 0
    for org in orgs:
        if org.team_size:
            total_team_size += org.team_size
            orgs_with_team_size += 1

    avg_team_size = total_team_size / orgs_with_team_size if orgs_with_team_size > 0 else 0

    # Count total users
    total_users = len(users)

    # Count active organizations in the last 30 days
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.now() - timedelta(days=30)
    active_orgs = 0
    for org in orgs:
        if org.last_active_at and org.last_active_at >= thirty_days_ago:
            active_orgs += 1

    return OrganizationStats(
        total_orgs=total_orgs,
        orgs_by_industry=orgs_by_industry,
        avg_team_size=avg_team_size,
        total_users=total_users,
        active_orgs_last_30_days=active_orgs
    )
