from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.organization_schema import InviteInfo, InviteAccept
from ..schemas.user_schema import User
from ..services.invite_service import get_invite_info, accept_invite
from ..services.auth_service_db import create_access_token

router = APIRouter()

@router.get("/{token}", response_model=InviteInfo, tags=["Invites"])
async def get_invite(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Get invite info by token
    
    Args:
        token: Invite token
        db: Database session
        
    Returns:
        Invite info
    """
    invite_info = get_invite_info(db, token)
    if not invite_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found or expired"
        )
    
    return invite_info

@router.post("/{token}/accept", response_model=dict, tags=["Invites"])
async def accept_invite_route(
    token: str,
    user_data: InviteAccept,
    db: Session = Depends(get_db)
):
    """
    Accept an invite and create a user
    
    Args:
        token: Invite token
        user_data: User data
        db: Database session
        
    Returns:
        Access token
    """
    user = accept_invite(db, token, user_data.name, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to accept invite"
        )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
