from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.comment_schema import CommentCreate, Comment, CommentList
from ..services.auth_service_db import get_current_active_user
from ..services.org_service import check_user_in_organization
from ..services.comment_service import create_comment, get_comments, get_comment, delete_comment
from ..services.security_service import validate_deal_access

router = APIRouter()

@router.post("/deals/{deal_id}/comments", response_model=Comment, tags=["Comments"])
async def create_deal_comment(
    deal_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new comment for a deal

    Args:
        deal_id: Deal ID
        comment_data: Comment data
        current_user: Current user
        db: Database session

    Returns:
        Created comment
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
        comment = create_comment(
            db,
            deal_id=deal_id,
            user_id=current_user.id,
            org_id=current_user.org_id,
            comment_data=comment_data
        )

        # Format the response
        return {
            "id": comment.id,
            "deal_id": comment.deal_id,
            "user": {
                "id": comment.user.id,
                "name": comment.user.name
            },
            "content": comment.content,
            "type": comment.type,
            "created_at": comment.created_at,
            "tagged_user_ids": comment.tagged_user_ids
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/deals/{deal_id}/comments", response_model=CommentList, tags=["Comments"])
async def get_deal_comments(
    deal_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all comments for a deal

    Args:
        deal_id: Deal ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current user
        db: Database session

    Returns:
        List of comments
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
        result = get_comments(
            db,
            deal_id=deal_id,
            org_id=current_user.org_id,
            skip=skip,
            limit=limit
        )

        # Format the response
        comments = []
        for comment in result["comments"]:
            comments.append({
                "id": comment.id,
                "deal_id": comment.deal_id,
                "user": {
                    "id": comment.user.id,
                    "name": comment.user.name
                },
                "content": comment.content,
                "type": comment.type,
                "created_at": comment.created_at,
                "tagged_user_ids": comment.tagged_user_ids
            })

        return {
            "comments": comments,
            "total": result["total"]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Comments"])
async def delete_deal_comment(
    comment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a comment

    Args:
        comment_id: Comment ID
        current_user: Current user
        db: Database session

    Returns:
        No content
    """
    # Get the comment
    comment = get_comment(db, comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check if the user is in the same organization as the comment
    if not current_user.org_id or current_user.org_id != comment.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )

    # Check if the user is authorized to delete the comment
    is_admin = current_user.role == "Admin" or current_user.org_role in ["Owner", "Manager"]
    result = delete_comment(db, comment_id, current_user.id, is_admin)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
