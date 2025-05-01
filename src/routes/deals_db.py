from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Literal
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.deal_schema import DealCreate, DealUpdate, Deal, DealList
from ..schemas.tag_schema import TagUpdate
from ..services.auth_service_db import get_current_active_user
from ..services.deal_service import get_deal, get_deals, create_deal, update_deal, delete_deal
from ..services.security_service import validate_deal_access, can_edit_deal
from ..services.activity_log_service import log_action
from ..utils.tag_utils import parse_tags

router = APIRouter()

@router.post("/deals/db", response_model=Deal, status_code=status.HTTP_201_CREATED)
async def create_deal_route(
    deal: DealCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new deal

    Args:
        deal: The deal data to create
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The created deal
    """
    return create_deal(db, deal, current_user.id, current_user.org_id)

@router.get("/deals/db", response_model=DealList)
async def read_deals(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None, description="Filter by status"),
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    irr_gt: Optional[float] = Query(None, description="Filter by IRR greater than"),
    irr_lt: Optional[float] = Query(None, description="Filter by IRR less than"),
    dscr_gt: Optional[float] = Query(None, description="Filter by DSCR greater than"),
    dscr_lt: Optional[float] = Query(None, description="Filter by DSCR less than"),
    visibility: Optional[Literal["internal", "team", "lp_view"]] = Query(None, description="Filter by visibility"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all deals

    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        status: Filter by status
        property_type: Filter by property type
        tags: Filter by tags (comma-separated)
        irr_gt: Filter by IRR greater than
        irr_lt: Filter by IRR less than
        dscr_gt: Filter by DSCR greater than
        dscr_lt: Filter by DSCR less than
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of deals
    """
    # If user is an admin, show all deals
    # If user is in an organization, show all deals in the organization
    # Otherwise, only show their deals
    user_id = None
    org_id = None

    if current_user.role == "Admin":
        # Admin can see all deals
        pass
    elif current_user.org_id:
        # User is in an organization, show all deals in the organization
        org_id = current_user.org_id
    else:
        # User is not in an organization, only show their deals
        user_id = current_user.id

    # Get deals
    deals = get_deals(
        db,
        skip=skip,
        limit=limit,
        user_id=user_id,
        org_id=org_id,
        status=status,
        tags=tags,
        irr_gt=irr_gt,
        irr_lt=irr_lt,
        dscr_gt=dscr_gt,
        dscr_lt=dscr_lt,
        current_user=current_user,
        visibility=visibility
    )

    # Filter by property type if provided
    if property_type:
        deals = [deal for deal in deals if deal.property_type == property_type]

    return {"deals": deals, "total": len(deals)}

@router.get("/deals/db/{deal_id}", response_model=Deal)
async def read_deal(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a deal by ID

    Args:
        deal_id: The ID of the deal to get
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The deal

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access and get the deal
    deal = validate_deal_access(db, deal_id, current_user)

    # Set can_edit flag
    deal.can_edit = can_edit_deal(current_user, deal)

    return deal

@router.put("/deals/db/{deal_id}", response_model=Deal)
async def update_deal_route(
    deal_id: str,
    deal: DealUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a deal

    Args:
        deal_id: The ID of the deal to update
        deal: The deal data to update
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The updated deal

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access and get the deal
    db_deal = validate_deal_access(db, deal_id, current_user)

    # Check if user can edit the deal
    if not can_edit_deal(current_user, db_deal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this deal"
        )

    # Prevent editing of approved/rejected/archived deals unless user is Admin
    if db_deal.status in ["approved", "rejected", "archived"] and current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot edit deal with status '{db_deal.status}'. Only Admins can edit deals in this status."
        )

    # Check status transitions
    if deal.status is not None and deal.status != db_deal.status:
        # Status is being changed, enforce workflow rules

        # draft -> in_review (any user)
        if db_deal.status == "draft" and deal.status == "in_review":
            pass  # Allowed for any user

        # in_review -> approved or rejected (only Manager/Admin)
        elif db_deal.status == "in_review" and deal.status in ["approved", "rejected"]:
            if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Managers or Admins can approve or reject deals"
                )

        # approved -> archived (only Admin)
        elif db_deal.status == "approved" and deal.status == "archived":
            if current_user.role != "Admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only Admins can archive approved deals"
                )

        # Any other transition is not allowed
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from '{db_deal.status}' to '{deal.status}'"
            )

    # If status is changing, add status change metadata
    if deal.status is not None and deal.status != db_deal.status:
        # Create a dictionary with the deal update data
        deal_data = deal.model_dump(exclude_unset=True)

        # Add status change metadata
        from datetime import datetime, timezone
        deal_data["status_changed_at"] = datetime.now(timezone.utc)
        deal_data["status_changed_by"] = current_user.id

        # Create a new DealUpdate instance with the updated data
        from ..schemas.deal_schema import DealUpdate
        updated_deal = DealUpdate(**deal_data)

        return update_deal(db, deal_id=deal_id, deal=updated_deal, user_id=current_user.id, org_id=current_user.org_id)
    else:
        return update_deal(db, deal_id=deal_id, deal=deal, user_id=current_user.id, org_id=current_user.org_id)

@router.delete("/deals/db/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deal_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a deal

    Args:
        deal_id: The ID of the deal to delete
        current_user: The current user (from the token)
        db: Database session

    Returns:
        None

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access and get the deal
    db_deal = validate_deal_access(db, deal_id, current_user)

    # Check if user can edit the deal
    if not can_edit_deal(current_user, db_deal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this deal"
        )

    # Only Admin, Owner, or Manager can delete deals
    if current_user.role != "Admin" and current_user.org_role not in ["Owner", "Manager"] and db_deal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins, Owners, Managers, or the deal creator can delete deals"
        )

    delete_deal(db, deal_id=deal_id, user_id=current_user.id, org_id=current_user.org_id)
    return None


@router.post("/deals/db/{deal_id}/tags", response_model=Deal)
async def add_tags_to_deal(
    deal_id: str,
    tag_update: TagUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add tags to a deal

    Args:
        deal_id: The ID of the deal to update
        tag_update: The tags to add
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The updated deal

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access and get the deal
    db_deal = validate_deal_access(db, deal_id, current_user)

    # Check if user can edit the deal
    if not can_edit_deal(current_user, db_deal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this deal"
        )

    # Get existing tags
    existing_tags = db_deal.tags_list

    # Merge with new tags
    new_tags = parse_tags(tag_update.tags)
    merged_tags = list(set(existing_tags + new_tags))

    # Create a DealUpdate with the merged tags
    from ..schemas.deal_schema import DealUpdate
    deal_update = DealUpdate(tags=merged_tags)

    # Update the deal
    updated_deal = update_deal(db, deal_id=deal_id, deal=deal_update, user_id=current_user.id, org_id=current_user.org_id)

    # Log the action
    try:
        from ..services.activity_log_service import log_action
        log_action(
            db=db,
            user_id=current_user.id,
            org_id=db_deal.org_id,
            action="tags_updated",
            message=f"{current_user.name} updated tags on deal: {db_deal.project_name}. Added: {', '.join(new_tags)}",
            deal_id=deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    return updated_deal
