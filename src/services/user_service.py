import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from passlib.context import CryptContext
from ..models.user import User
from ..schemas.user_schema import UserCreate, UserUpdate
from ..utils.avatar_utils import avatar_placeholder

# Create password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_user(db: Session, user_id: str):
    """
    Get a user by ID

    Args:
        db: Database session
        user_id: User ID

    Returns:
        User object with avatar placeholder
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # Add avatar placeholder
        user.avatar_placeholder = avatar_placeholder(user)
    return user

def get_user_by_email(db: Session, email: str):
    """
    Get a user by email

    Args:
        db: Database session
        email: User email

    Returns:
        User object with avatar placeholder
    """
    user = db.query(User).filter(User.email == email).first()
    if user:
        # Add avatar placeholder
        user.avatar_placeholder = avatar_placeholder(user)
    return user

def get_users(db: Session, skip: int = 0, limit: int = 100):
    """
    Get all users

    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return

    Returns:
        List of User objects with avatar placeholders
    """
    users = db.query(User).offset(skip).limit(limit).all()
    # Add avatar placeholders
    for user in users:
        user.avatar_placeholder = avatar_placeholder(user)
    return users

def create_user(db: Session, user: UserCreate):
    """
    Create a new user

    Args:
        db: Database session
        user: User data

    Returns:
        Created User object
    """
    # Check if user with this email already exists
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_password = pwd_context.hash(user.password)
    db_user = User(
        id=str(uuid.uuid4()),
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )

    # Add user to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user

def update_user(db: Session, user_id: str, user: UserUpdate):
    """
    Update a user

    Args:
        db: Database session
        user_id: User ID
        user: User data

    Returns:
        Updated User object
    """
    # Get user
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update user data
    user_data = user.dict(exclude_unset=True)

    # Hash password if provided
    if "password" in user_data:
        user_data["password_hash"] = pwd_context.hash(user_data.pop("password"))

    # Update user
    for key, value in user_data.items():
        setattr(db_user, key, value)

    # Commit changes
    db.commit()
    db.refresh(db_user)

    # Add avatar placeholder
    db_user.avatar_placeholder = avatar_placeholder(db_user)

    return db_user

def delete_user(db: Session, user_id: str):
    """
    Delete a user

    Args:
        db: Database session
        user_id: User ID

    Returns:
        None
    """
    # Get user
    db_user = get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Delete user
    db.delete(db_user)
    db.commit()

    return None

def verify_password(plain_password: str, hashed_password: str):
    """
    Verify a password against a hash

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password is correct, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, email: str, password: str):
    """
    Authenticate a user

    Args:
        db: Database session
        email: User email
        password: User password

    Returns:
        User object if authentication is successful, None otherwise
    """
    # Get user
    user = get_user_by_email(db, email)
    if not user:
        return None

    # Verify password
    if not verify_password(password, user.password_hash):
        return None

    # Add avatar placeholder
    user.avatar_placeholder = avatar_placeholder(user)

    return user
