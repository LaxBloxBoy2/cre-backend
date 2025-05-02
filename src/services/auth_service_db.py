import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User as UserModel
from ..schemas.user_schema import User, UserCreate, UserUpdate
from ..schemas.auth_schema import TokenData
from ..user_service import get_user_by_email, create_user as create_user_service, verify_password
from ..utils.jwt_handler import (
    create_access_token, create_refresh_token,
    decode_access_token, decode_refresh_token,
    get_token_expiry, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def generate_tokens(user: UserModel) -> Tuple[str, str, datetime]:
    """
    Generate access and refresh tokens for a user

    Args:
        user: The user to generate tokens for

    Returns:
        Tuple of (access_token, refresh_token, refresh_token_expiry)
    """
    # Create access token
    access_token_data = {"sub": user.email, "role": user.role}
    access_token = create_access_token(data=access_token_data)

    # Create refresh token
    refresh_token_data = {"sub": user.email, "role": user.role}
    refresh_token = create_refresh_token(data=refresh_token_data)

    # Get refresh token expiry
    refresh_token_expiry = get_token_expiry("refresh")

    return access_token, refresh_token, refresh_token_expiry

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    Get the current user from the token

    Args:
        token: The JWT token
        db: Database session

    Returns:
        The current user

    Raises:
        HTTPException: If the token is invalid or the user is not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the access token
        payload = decode_access_token(token)
        email: str = payload.get("sub")
        role: str = payload.get("role")
        token_type: str = payload.get("token_type")

        # Validate token data
        if email is None or token_type != "access":
            raise credentials_exception

        token_data = TokenData(email=email, role=role, token_type=token_type)
    except JWTError:
        raise credentials_exception

    # Get the user from the database
    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception

    return User.from_orm(user)

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current active user

    Args:
        current_user: The current user

    Returns:
        The current active user

    Raises:
        HTTPException: If the user is inactive
    """
    # In a real application, you might check if the user is active
    return current_user

def authenticate_user(db: Session, email: str, password: str) -> Optional[UserModel]:
    """
    Authenticate a user

    Args:
        db: Database session
        email: The email of the user
        password: The plain text password

    Returns:
        The user if authentication is successful, None otherwise
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def store_refresh_token(db: Session, user_id: str, refresh_token: str, expires_at: datetime) -> None:
    """
    Store a refresh token in the database

    Args:
        db: Database session
        user_id: The ID of the user
        refresh_token: The refresh token
        expires_at: The expiry time of the refresh token
    """
    # Get the user
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        return

    # Update the user's refresh token
    user.refresh_token = refresh_token
    user.refresh_token_expires_at = expires_at
    db.commit()


def validate_refresh_token(db: Session, refresh_token: str) -> Optional[UserModel]:
    """
    Validate a refresh token

    Args:
        db: Database session
        refresh_token: The refresh token

    Returns:
        The user if the refresh token is valid, None otherwise
    """
    try:
        # Decode the refresh token
        payload = decode_refresh_token(refresh_token)
        email: str = payload.get("sub")
        token_type: str = payload.get("token_type")

        # Validate token data
        if email is None or token_type != "refresh":
            return None

        # Get the user from the database
        user = get_user_by_email(db, email=email)
        if not user:
            return None

        # Check if the refresh token matches
        if user.refresh_token != refresh_token:
            return None

        # Check if the refresh token has expired
        if user.refresh_token_expires_at and user.refresh_token_expires_at < datetime.now(timezone.utc):
            return None

        return user
    except JWTError:
        return None

def create_user(db: Session, user: UserCreate) -> User:
    """
    Create a new user

    Args:
        db: Database session
        user: The user data to create

    Returns:
        The created user
    """
    db_user = create_user_service(db, user)
    return User.from_orm(db_user)
