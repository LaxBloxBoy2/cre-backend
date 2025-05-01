import uuid
from typing import List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.deal import Deal
from ..models.user import User
from ..models.lp_assignment import LPAssignment
from ..models.comment import DealComment
from ..schemas.lp_schema import LPAssignmentCreate, LPComment
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def assign_lp_to_deal(db: Session, assignment: LPAssignmentCreate, assigned_by: str) -> LPAssignment:
    """
    Assign an LP to a deal

    Args:
        db: Database session
        assignment: Assignment data
        assigned_by: ID of the user making the assignment

    Returns:
        Created assignment

    Raises:
        HTTPException: If the LP or deal is not found, or if the LP is already assigned to the deal
    """
    # Check if the LP exists and has the LP role
    lp = db.query(User).filter(User.id == assignment.lp_id).first()
    if not lp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LP not found"
        )

    if lp.role != "LP":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not an LP"
        )

    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == assignment.deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Check if the LP is already assigned to the deal
    existing_assignment = db.query(LPAssignment).filter(
        LPAssignment.lp_id == assignment.lp_id,
        LPAssignment.deal_id == assignment.deal_id
    ).first()

    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LP is already assigned to this deal"
        )

    # Create the assignment
    db_assignment = LPAssignment(
        id=str(uuid.uuid4()),
        lp_id=assignment.lp_id,
        deal_id=assignment.deal_id,
        assigned_by=assigned_by,
        assigned_at=datetime.now(timezone.utc)
    )

    # Add to database
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)

    return db_assignment

def get_lp_assignments(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    lp_id: Optional[str] = None,
    deal_id: Optional[str] = None
) -> Tuple[List[LPAssignment], int]:
    """
    Get LP assignments

    Args:
        db: Database session
        skip: Number of assignments to skip
        limit: Maximum number of assignments to return
        lp_id: Filter by LP ID
        deal_id: Filter by deal ID

    Returns:
        Tuple of (list of assignments, total count)
    """
    # Create query
    query = db.query(LPAssignment)

    # Apply filters
    if lp_id:
        query = query.filter(LPAssignment.lp_id == lp_id)

    if deal_id:
        query = query.filter(LPAssignment.deal_id == deal_id)

    # Get total count
    total = query.count()

    # Apply pagination
    assignments = query.order_by(LPAssignment.assigned_at.desc()).offset(skip).limit(limit).all()

    return assignments, total

def get_lp_deals(
    db: Session,
    lp_id: str,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Deal], int]:
    """
    Get deals assigned to an LP

    Args:
        db: Database session
        lp_id: LP ID
        skip: Number of deals to skip
        limit: Maximum number of deals to return

    Returns:
        Tuple of (list of deals, total count)
    """
    # Get deal IDs assigned to the LP
    assignments = db.query(LPAssignment).filter(LPAssignment.lp_id == lp_id).all()
    deal_ids = [assignment.deal_id for assignment in assignments]

    # If no deals are assigned, return empty list
    if not deal_ids:
        return [], 0

    # Get deals
    query = db.query(Deal).filter(Deal.id.in_(deal_ids))

    # Get total count
    total = query.count()

    # Apply pagination
    deals = query.order_by(Deal.created_at.desc()).offset(skip).limit(limit).all()

    return deals, total

def remove_lp_assignment(db: Session, lp_id: str, deal_id: str) -> bool:
    """
    Remove an LP assignment

    Args:
        db: Database session
        lp_id: LP ID
        deal_id: Deal ID

    Returns:
        True if the assignment was removed, False otherwise

    Raises:
        HTTPException: If the assignment is not found
    """
    # Get the assignment
    assignment = db.query(LPAssignment).filter(
        LPAssignment.lp_id == lp_id,
        LPAssignment.deal_id == deal_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )

    # Remove the assignment
    db.delete(assignment)
    db.commit()

    return True

def add_lp_comment(db: Session, deal_id: str, lp_id: str, comment: LPComment) -> DealComment:
    """
    Add an LP comment to a deal

    Args:
        db: Database session
        deal_id: Deal ID
        lp_id: LP ID
        comment: Comment data

    Returns:
        Created comment

    Raises:
        HTTPException: If the deal is not found or the LP is not assigned to the deal
    """
    # Check if the deal exists
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Check if the LP is assigned to the deal
    assignment = db.query(LPAssignment).filter(
        LPAssignment.lp_id == lp_id,
        LPAssignment.deal_id == deal_id
    ).first()

    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="LP is not assigned to this deal"
        )

    # Create the comment
    from ..comment_service import create_comment

    # Set comment type based on whether it's a question
    comment_type = "lp_question" if comment.is_question else "lp_comment"

    # Create the comment
    db_comment = create_comment(
        db=db,
        deal_id=deal_id,
        user_id=lp_id,
        message=comment.message,
        comment_type=comment_type
    )

    return db_comment

def get_lp_comments(
    db: Session,
    deal_id: str,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[DealComment], int]:
    """
    Get LP comments for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        skip: Number of comments to skip
        limit: Maximum number of comments to return

    Returns:
        Tuple of (list of comments, total count)
    """
    # Create query
    query = db.query(DealComment).filter(
        DealComment.deal_id == deal_id,
        DealComment.comment_type.in_(["lp_comment", "lp_question"])
    )

    # Get total count
    total = query.count()

    # Apply pagination
    comments = query.order_by(DealComment.created_at.desc()).offset(skip).limit(limit).all()

    return comments, total
