from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.deal_schema import Deal
from ..schemas.lp_schema import (
    LPAssignmentCreate,
    LPAssignment,
    LPAssignmentList,
    LPDealList,
    LPDealSummary,
    LPComment
)
from ..schemas.comment_schema import Comment, CommentList
from ..services.auth_service_db import get_current_active_user
from ..services.lp_service import (
    assign_lp_to_deal,
    get_lp_assignments,
    get_lp_deals,
    remove_lp_assignment,
    add_lp_comment,
    get_lp_comments
)
from ..services.security_service import validate_deal_access
from ..services.deal_service import get_deal
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

# LP Management Routes (for Admins/Managers)

@router.post("/deals/{deal_id}/assign-lp", response_model=LPAssignment, tags=["LP Management"])
async def assign_lp_route(
    deal_id: str,
    assignment: LPAssignmentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Assign an LP to a deal

    This endpoint assigns an LP (Limited Partner) to a deal, giving them read-only access
    to the deal information.

    Args:
        deal_id: The ID of the deal
        assignment: Assignment data
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The created assignment

    Raises:
        HTTPException: If the deal is not found, the user is not authorized, or the LP is already assigned to the deal
    """
    # Validate deal access
    validate_deal_access(db, deal_id, current_user)

    # Check if user has appropriate role (Manager or Admin)
    if current_user.role not in ["Admin", "Manager"] and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers and Admins can assign LPs to deals"
        )

    # Override the deal_id in the assignment
    assignment.deal_id = deal_id

    # Assign the LP
    assignment = assign_lp_to_deal(db, assignment, current_user.id)

    return assignment

@router.get("/deals/{deal_id}/lp-assignments", response_model=LPAssignmentList, tags=["LP Management"])
async def get_deal_lp_assignments(
    deal_id: str,
    skip: int = Query(0, description="Number of assignments to skip"),
    limit: int = Query(100, description="Maximum number of assignments to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get LP assignments for a deal

    This endpoint returns a list of LP assignments for a deal.

    Args:
        deal_id: The ID of the deal
        skip: Number of assignments to skip (for pagination)
        limit: Maximum number of assignments to return (for pagination)
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of LP assignments

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    validate_deal_access(db, deal_id, current_user)

    # Check if user has appropriate role (Manager or Admin)
    if current_user.role not in ["Admin", "Manager"] and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers and Admins can view LP assignments"
        )

    # Get assignments
    assignments, total = get_lp_assignments(
        db=db,
        skip=skip,
        limit=limit,
        deal_id=deal_id
    )

    return LPAssignmentList(assignments=assignments, total=total)

@router.delete("/deals/{deal_id}/lp-assignments/{lp_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["LP Management"])
async def remove_lp_assignment_route(
    deal_id: str,
    lp_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove an LP assignment

    This endpoint removes an LP assignment from a deal.

    Args:
        deal_id: The ID of the deal
        lp_id: The ID of the LP
        current_user: The current user (from the token)
        db: Database session

    Returns:
        None

    Raises:
        HTTPException: If the deal is not found, the user is not authorized, or the assignment is not found
    """
    # Validate deal access
    validate_deal_access(db, deal_id, current_user)

    # Check if user has appropriate role (Manager or Admin)
    if current_user.role not in ["Admin", "Manager"] and current_user.org_role not in ["Owner", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Managers and Admins can remove LP assignments"
        )

    # Remove the assignment
    remove_lp_assignment(db, lp_id, deal_id)

    return None

# LP Portal Routes (for LPs)

@router.get("/lp/deals", response_model=LPDealList, tags=["LP Portal"])
async def get_lp_deals_route(
    skip: int = Query(0, description="Number of deals to skip"),
    limit: int = Query(100, description="Maximum number of deals to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get deals assigned to the current LP

    This endpoint returns a list of deals assigned to the current LP.

    Args:
        skip: Number of deals to skip (for pagination)
        limit: Maximum number of deals to return (for pagination)
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of deals

    Raises:
        HTTPException: If the user is not an LP
    """
    # Check if user is an LP
    if current_user.role != "LP":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only LPs can access the LP portal"
        )

    # Get deals
    deals, total = get_lp_deals(
        db=db,
        lp_id=current_user.id,
        skip=skip,
        limit=limit
    )

    # Convert to LP deal summaries
    deal_summaries = []
    for deal in deals:
        # Calculate equity multiple if not already set
        equity_multiple = None
        if deal.projected_irr is not None:
            # Simple approximation: equity multiple = (1 + IRR/100)^5 for a 5-year hold
            equity_multiple = (1 + deal.projected_irr / 100) ** 5

        deal_summaries.append(LPDealSummary(
            id=deal.id,
            project_name=deal.project_name,
            location=deal.location,
            property_type=deal.property_type,
            acquisition_price=deal.acquisition_price,
            projected_irr=deal.projected_irr,
            equity_multiple=equity_multiple
        ))

    return LPDealList(deals=deal_summaries, total=total)

@router.get("/lp/deals/{deal_id}", response_model=Deal, tags=["LP Portal"])
async def get_lp_deal_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a deal assigned to the current LP

    This endpoint returns a deal assigned to the current LP.

    Args:
        deal_id: The ID of the deal
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The deal

    Raises:
        HTTPException: If the user is not an LP or the deal is not assigned to the LP
    """
    # Check if user is an LP
    if current_user.role != "LP":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only LPs can access the LP portal"
        )

    # Check if the LP is assigned to the deal
    assignments, _ = get_lp_assignments(
        db=db,
        lp_id=current_user.id,
        deal_id=deal_id
    )

    if not assignments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Deal not assigned to this LP"
        )

    # Get the deal
    deal = get_deal(db, deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    return deal

@router.get("/lp/deals/{deal_id}/memo", tags=["LP Portal"])
async def get_lp_deal_memo_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the memo for a deal assigned to the current LP

    This endpoint returns the memo for a deal assigned to the current LP.

    Args:
        deal_id: The ID of the deal
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The memo

    Raises:
        HTTPException: If the user is not an LP or the deal is not assigned to the LP
    """
    # Check if user is an LP
    if current_user.role != "LP":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only LPs can access the LP portal"
        )

    # Check if the LP is assigned to the deal
    assignments, _ = get_lp_assignments(
        db=db,
        lp_id=current_user.id,
        deal_id=deal_id
    )

    if not assignments:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Deal not assigned to this LP"
        )

    # Get the deal
    deal = get_deal(db, deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Get the memo
    from ..services.report_service import generate_deal_memo
    memo = await generate_deal_memo(db, deal_id)

    return memo

@router.post("/lp/deals/{deal_id}/comments", response_model=Comment, tags=["LP Portal"])
async def add_lp_comment_route(
    deal_id: str,
    comment: LPComment,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add a comment to a deal as an LP

    This endpoint adds a comment to a deal as an LP.

    Args:
        deal_id: The ID of the deal
        comment: Comment data
        current_user: The current user (from the token)
        db: Database session

    Returns:
        The created comment

    Raises:
        HTTPException: If the user is not an LP or the deal is not assigned to the LP
    """
    # Check if user is an LP
    if current_user.role != "LP":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only LPs can access the LP portal"
        )

    # Add the comment
    db_comment = add_lp_comment(db, deal_id, current_user.id, comment)

    return db_comment

@router.get("/lp/deals/{deal_id}/comments", response_model=CommentList, tags=["LP Portal"])
async def get_lp_comments_route(
    deal_id: str,
    skip: int = Query(0, description="Number of comments to skip"),
    limit: int = Query(100, description="Maximum number of comments to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get LP comments for a deal

    This endpoint returns a list of LP comments for a deal.

    Args:
        deal_id: The ID of the deal
        skip: Number of comments to skip (for pagination)
        limit: Maximum number of comments to return (for pagination)
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of comments

    Raises:
        HTTPException: If the user is not an LP or the deal is not assigned to the LP
    """
    # Check if user is an LP or has appropriate role (Manager or Admin)
    is_lp = current_user.role == "LP"
    is_manager = current_user.role in ["Admin", "Manager"] or current_user.org_role in ["Owner", "Manager"]

    if not (is_lp or is_manager):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only LPs, Managers, and Admins can view LP comments"
        )

    # If user is an LP, check if they are assigned to the deal
    if is_lp:
        assignments, _ = get_lp_assignments(
            db=db,
            lp_id=current_user.id,
            deal_id=deal_id
        )

        if not assignments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Deal not assigned to this LP"
            )
    else:
        # If user is a Manager or Admin, validate deal access
        validate_deal_access(db, deal_id, current_user)

    # Get comments
    comments, total = get_lp_comments(
        db=db,
        deal_id=deal_id,
        skip=skip,
        limit=limit
    )

    return CommentList(comments=comments, total=total)
