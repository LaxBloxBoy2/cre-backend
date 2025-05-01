from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

from ..schemas.auth_schema import UserCreate, User, Token
from ..services.auth_service import (
    create_user, get_users, authenticate_user, create_access_token,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()


@router.post("/register", response_model=User)
async def register_user(user: UserCreate):
    """
    Register a new user
    
    Args:
        user: The user data to register
        
    Returns:
        The registered user
    """
    return create_user(user)


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Login to get an access token
    
    Args:
        form_data: The form data containing username (email) and password
        
    Returns:
        The access token
        
    Raises:
        HTTPException: If authentication fails
    """
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


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
async def read_users(current_user: User = Depends(get_current_active_user)):
    """
    Get all users (admin only)
    
    Args:
        current_user: The current user (from the token)
        
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
    return get_users()
