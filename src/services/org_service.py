from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from ..models.organization import Organization
from ..models.user import User
from ..models.deal import Deal
from ..schemas.organization_schema import OrganizationCreate, OrganizationUpdate, UserInOrg

def create_organization(db: Session, org_data: OrganizationCreate, user_id: str) -> Organization:
    """
    Create a new organization and set the user as the owner

    Args:
        db: Database session
        org_data: Organization data
        user_id: User ID

    Returns:
        Created organization
    """
    # Create the organization
    now = datetime.now(timezone.utc)
    org = Organization(
        name=org_data.name,
        industry=org_data.industry,
        headquarters=org_data.headquarters,
        team_size=org_data.team_size,
        website=org_data.website,
        preferred_property_type=org_data.preferred_property_type,
        notes=org_data.notes,
        created_at=now,
        last_active_at=now
    )
    db.add(org)
    db.flush()  # Flush to get the org ID

    # Update the user to be the owner of the organization
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.rollback()
        raise ValueError("User not found")

    user.org_id = org.id
    user.org_role = "Owner"

    # Commit the changes
    db.commit()
    db.refresh(org)

    return org

def get_organization(db: Session, org_id: str) -> Optional[Organization]:
    """
    Get an organization by ID

    Args:
        db: Database session
        org_id: Organization ID

    Returns:
        Organization or None if not found
    """
    return db.query(Organization).filter(Organization.id == org_id).first()

def get_organization_by_user(db: Session, user_id: str) -> Optional[Organization]:
    """
    Get an organization by user ID

    Args:
        db: Database session
        user_id: User ID

    Returns:
        Organization or None if not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.org_id:
        return None

    return db.query(Organization).filter(Organization.id == user.org_id).first()

def get_organization_members(db: Session, org_id: str) -> List[User]:
    """
    Get all members of an organization

    Args:
        db: Database session
        org_id: Organization ID

    Returns:
        List of users in the organization
    """
    return db.query(User).filter(User.org_id == org_id).all()

def get_organization_with_members(db: Session, org_id: str) -> Dict[str, Any]:
    """
    Get an organization with its members

    Args:
        db: Database session
        org_id: Organization ID

    Returns:
        Organization with members
    """
    org = get_organization(db, org_id)
    if not org:
        return None

    members = get_organization_members(db, org_id)

    # Convert members to UserInOrg schema
    member_schemas = []
    for member in members:
        member_schemas.append(
            UserInOrg(
                id=member.id,
                name=member.name,
                email=member.email,
                org_role=member.org_role,
                created_at=member.created_at
            )
        )

    return {
        "id": org.id,
        "name": org.name,
        "industry": org.industry,
        "headquarters": org.headquarters,
        "team_size": org.team_size,
        "website": org.website,
        "preferred_property_type": org.preferred_property_type,
        "notes": org.notes,
        "created_at": org.created_at,
        "last_active_at": org.last_active_at,
        "members": member_schemas
    }

def update_organization(db: Session, org_id: str, org_data: OrganizationUpdate) -> Organization:
    """
    Update an organization

    Args:
        db: Database session
        org_id: Organization ID
        org_data: Organization data

    Returns:
        Updated organization
    """
    org = get_organization(db, org_id)
    if not org:
        return None

    # Update the organization with non-None values
    if org_data.name is not None:
        org.name = org_data.name
    if org_data.industry is not None:
        org.industry = org_data.industry
    if org_data.headquarters is not None:
        org.headquarters = org_data.headquarters
    if org_data.team_size is not None:
        org.team_size = org_data.team_size
    if org_data.website is not None:
        org.website = org_data.website
    if org_data.preferred_property_type is not None:
        org.preferred_property_type = org_data.preferred_property_type
    if org_data.notes is not None:
        org.notes = org_data.notes

    # Update last_active_at
    org.last_active_at = datetime.now(timezone.utc)

    # Commit the changes
    db.commit()
    db.refresh(org)

    return org

def delete_organization(db: Session, org_id: str) -> bool:
    """
    Delete an organization

    Args:
        db: Database session
        org_id: Organization ID

    Returns:
        True if deleted, False otherwise
    """
    org = get_organization(db, org_id)
    if not org:
        return False

    # Remove org_id from all users in the organization
    users = get_organization_members(db, org_id)
    for user in users:
        user.org_id = None
        user.org_role = None

    # Delete the organization
    db.delete(org)
    db.commit()

    return True

def check_user_in_organization(db: Session, user_id: str, org_id: str) -> bool:
    """
    Check if a user is in an organization

    Args:
        db: Database session
        user_id: User ID
        org_id: Organization ID

    Returns:
        True if the user is in the organization, False otherwise
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    return user.org_id == org_id

def check_user_is_owner_or_manager(db: Session, user_id: str, org_id: str) -> bool:
    """
    Check if a user is an owner or manager of an organization

    Args:
        db: Database session
        user_id: User ID
        org_id: Organization ID

    Returns:
        True if the user is an owner or manager of the organization, False otherwise
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    return user.org_id == org_id and user.org_role in ["Owner", "Manager"]


def update_organization_last_active(db: Session, org_id: str) -> None:
    """
    Update the last_active_at field of an organization

    Args:
        db: Database session
        org_id: Organization ID
    """
    org = get_organization(db, org_id)
    if org:
        org.last_active_at = datetime.now(timezone.utc)
        db.commit()
