import uuid
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from passlib.context import CryptContext
from ..models.invite import Invite
from ..models.organization import Organization
from ..models.user import User
from ..schemas.organization_schema import InviteCreate, InviteInfo

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_invite(db: Session, invite_data: InviteCreate, org_id: str, user_id: str) -> Invite:
    """
    Create a new invite
    
    Args:
        db: Database session
        invite_data: Invite data
        org_id: Organization ID
        user_id: User ID of the inviter
        
    Returns:
        Created invite
    """
    # Check if the organization exists
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise ValueError("Organization not found")
    
    # Check if the user is in the organization
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.org_id != org_id:
        raise ValueError("User is not in the organization")
    
    # Check if the user is an owner or manager
    if user.org_role not in ["Owner", "Manager"]:
        raise ValueError("User is not authorized to invite members")
    
    # Check if the role is valid
    if invite_data.role not in ["Owner", "Manager", "Analyst"]:
        raise ValueError("Invalid role")
    
    # Check if an invite already exists for this email in this organization
    existing_invite = db.query(Invite).filter(
        Invite.email == invite_data.email,
        Invite.org_id == org_id,
        Invite.status == "Pending"
    ).first()
    
    if existing_invite:
        # Return the existing invite
        return existing_invite
    
    # Create the invite
    invite = Invite(
        email=invite_data.email,
        org_id=org_id,
        invited_by_user_id=user_id,
        role=invite_data.role,
        token=str(uuid.uuid4()),
        status="Pending",
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    return invite

def get_invite_by_token(db: Session, token: str) -> Optional[Invite]:
    """
    Get an invite by token
    
    Args:
        db: Database session
        token: Invite token
        
    Returns:
        Invite or None if not found
    """
    return db.query(Invite).filter(Invite.token == token).first()

def get_invite_info(db: Session, token: str) -> Optional[InviteInfo]:
    """
    Get invite info by token
    
    Args:
        db: Database session
        token: Invite token
        
    Returns:
        Invite info or None if not found
    """
    invite = get_invite_by_token(db, token)
    if not invite:
        return None
    
    # Check if the invite is pending
    if invite.status != "Pending":
        return None
    
    # Get the organization
    org = db.query(Organization).filter(Organization.id == invite.org_id).first()
    if not org:
        return None
    
    return InviteInfo(
        organization={
            "id": org.id,
            "name": org.name,
            "created_at": org.created_at
        },
        role=invite.role,
        email=invite.email
    )

def accept_invite(db: Session, token: str, name: str, password: str) -> Optional[User]:
    """
    Accept an invite and create a user
    
    Args:
        db: Database session
        token: Invite token
        name: User name
        password: User password
        
    Returns:
        Created user or None if the invite is not found or already accepted
    """
    invite = get_invite_by_token(db, token)
    if not invite:
        return None
    
    # Check if the invite is pending
    if invite.status != "Pending":
        return None
    
    # Check if a user with this email already exists
    existing_user = db.query(User).filter(User.email == invite.email).first()
    if existing_user:
        # Update the existing user
        existing_user.org_id = invite.org_id
        existing_user.org_role = invite.role
        
        # Update the invite
        invite.status = "Accepted"
        invite.accepted_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(existing_user)
        
        return existing_user
    
    # Create a new user
    user = User(
        name=name,
        email=invite.email,
        password_hash=pwd_context.hash(password),
        role="Analyst",  # Default system role
        org_role=invite.role,
        org_id=invite.org_id,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(user)
    
    # Update the invite
    invite.status = "Accepted"
    invite.accepted_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(user)
    
    return user

def get_pending_invites_by_organization(db: Session, org_id: str) -> List[Invite]:
    """
    Get all pending invites for an organization
    
    Args:
        db: Database session
        org_id: Organization ID
        
    Returns:
        List of pending invites
    """
    return db.query(Invite).filter(
        Invite.org_id == org_id,
        Invite.status == "Pending"
    ).all()

def cancel_invite(db: Session, invite_id: str, user_id: str) -> bool:
    """
    Cancel an invite
    
    Args:
        db: Database session
        invite_id: Invite ID
        user_id: User ID of the canceller
        
    Returns:
        True if cancelled, False otherwise
    """
    invite = db.query(Invite).filter(Invite.id == invite_id).first()
    if not invite:
        return False
    
    # Check if the user is in the organization
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.org_id != invite.org_id:
        return False
    
    # Check if the user is an owner or manager
    if user.org_role not in ["Owner", "Manager"]:
        return False
    
    # Check if the invite is pending
    if invite.status != "Pending":
        return False
    
    # Update the invite
    invite.status = "Expired"
    
    db.commit()
    
    return True
