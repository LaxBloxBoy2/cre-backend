import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Union, Dict, Any
from ..models.user import User
from ..models.deal import Deal
from ..models.organization import Organization
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def validate_org_ownership(current_user: User, deal: Deal) -> None:
    """
    Validate that the current user has access to the deal based on organization ownership
    and visibility settings

    Args:
        current_user: The current user
        deal: The deal to validate

    Raises:
        HTTPException: If the user is not authorized to access the deal
    """
    # Admin users can access any deal
    if current_user.role == "Admin":
        return

    # Check if the user is the owner of the deal
    if deal.user_id == current_user.id:
        return

    # Check if the deal is shared directly with this user
    if hasattr(deal, 'shared_with_user_ids') and deal.shared_with_user_ids:
        try:
            shared_with = deal.shared_with_users
            if current_user.id in shared_with:
                return
        except Exception:
            # If there's an error parsing the shared_with_user_ids, fall back to org check
            pass

    # Check if the user is in the same organization as the deal
    if not current_user.org_id or not deal.org_id or current_user.org_id != deal.org_id:
        logger.warning(
            f"Unauthorized access attempt - User: {current_user.id} (org: {current_user.org_id}) "
            f"tried to access deal: {deal.id} (org: {deal.org_id})"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this deal"
        )

    # Check visibility settings
    if hasattr(deal, 'visibility'):
        # If visibility is 'internal', only the owner and admins can access
        if deal.visibility == "internal" and deal.user_id != current_user.id:
            logger.warning(
                f"Visibility restriction - User: {current_user.id} tried to access internal deal: {deal.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This deal is marked as internal and can only be accessed by its owner"
            )

def validate_deal_access(db: Session, deal_id: str, current_user: User) -> Deal:
    """
    Validate that the current user has access to the deal and return the deal

    Args:
        db: Database session
        deal_id: The ID of the deal to validate
        current_user: The current user

    Returns:
        The deal if the user has access

    Raises:
        HTTPException: If the deal is not found or the user is not authorized to access it
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        logger.warning(f"Deal not found - ID: {deal_id}, requested by user: {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Validate organization ownership and visibility
    validate_org_ownership(current_user, deal)

    return deal

def filter_by_org(query, current_user: User, org_id_column):
    """
    Filter a query by the current user's organization ID

    Args:
        query: The SQLAlchemy query to filter
        current_user: The current user
        org_id_column: The column to filter by (e.g., Deal.org_id)

    Returns:
        The filtered query
    """
    # Admin users can see all records
    if current_user.role == "Admin":
        return query

    # Filter by organization ID
    if current_user.org_id:
        return query.filter(org_id_column == current_user.org_id)

    # If the user is not in an organization, return no results
    return query.filter(False)

def can_edit_deal(current_user: User, deal: Deal) -> bool:
    """
    Check if the current user can edit a deal

    Args:
        current_user: The current user
        deal: The deal to check

    Returns:
        True if the user can edit the deal, False otherwise
    """
    # Admin users can edit any deal
    if current_user.role == "Admin":
        return True

    # Deal owner can edit
    if deal.user_id == current_user.id:
        return True

    # Check organization role
    if current_user.org_id and deal.org_id and current_user.org_id == deal.org_id:
        # Owners and Managers can edit deals in their organization
        if current_user.org_role in ["Owner", "Manager"]:
            return True

    return False
