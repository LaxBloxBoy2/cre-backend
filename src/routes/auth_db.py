from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import UserCreate, User
from ..schemas.auth_schema import Token, RefreshRequest
from ..services.auth_service_db import (
    authenticate_user, get_current_active_user, generate_tokens,
    store_refresh_token, validate_refresh_token
)
from ..services.user_service import create_user, get_users

router = APIRouter()

@router.post("/register", response_model=User)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user

    Args:
        user: The user data to register
        db: Database session

    Returns:
        The registered user
    """
    return create_user(db, user)

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login to get access and refresh tokens

    Args:
        form_data: The form data containing username (email) and password
        db: Database session

    Returns:
        The access and refresh tokens

    Raises:
        HTTPException: If authentication fails
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate tokens
    access_token, refresh_token, refresh_token_expiry = generate_tokens(user)

    # Store refresh token in the database
    store_refresh_token(db, user.id, refresh_token, refresh_token_expiry)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """
    Get the current user

    Args:
        current_user: The current user (from the token)

    Returns:
        The current user
    """
    return current_user

@router.get("/users", response_model=List[User])
async def read_users(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """
    Get all users (admin only)

    Args:
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of all users

    Raises:
        HTTPException: If the user is not an admin
    """
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return get_users(db)


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_request: RefreshRequest, db: Session = Depends(get_db)):
    """
    Refresh an access token using a refresh token

    Args:
        refresh_request: The refresh token request
        db: Database session

    Returns:
        New access and refresh tokens

    Raises:
        HTTPException: If the refresh token is invalid
    """
    # Validate the refresh token
    user = validate_refresh_token(db, refresh_request.refresh_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate new tokens
    access_token, refresh_token, refresh_token_expiry = generate_tokens(user)

    # Store the new refresh token in the database
    store_refresh_token(db, user.id, refresh_token, refresh_token_expiry)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }
