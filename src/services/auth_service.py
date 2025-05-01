import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..schemas.auth_schema import UserCreate, UserUpdate, User, UserInDB, TokenData

# In-memory database for users
users_db: Dict[str, UserInDB] = {}
email_to_id: Dict[str, str] = {}

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password
        
    Returns:
        True if the password matches the hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password
    
    Args:
        password: The plain text password
        
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)


def get_user_by_email(email: str) -> Optional[UserInDB]:
    """
    Get a user by email
    
    Args:
        email: The email of the user
        
    Returns:
        The user if found, None otherwise
    """
    if email in email_to_id:
        user_id = email_to_id[email]
        return users_db.get(user_id)
    return None


def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """
    Authenticate a user
    
    Args:
        email: The email of the user
        password: The plain text password
        
    Returns:
        The user if authentication is successful, None otherwise
    """
    user = get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: The data to encode in the token
        expires_delta: The expiration time delta
        
    Returns:
        The encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Get the current user from the token
    
    Args:
        token: The JWT token
        
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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(token_data.email)
    if user is None:
        raise credentials_exception
    return User(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=user.created_at,
        updated_at=user.updated_at
    )


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


def create_user(user: UserCreate) -> User:
    """
    Create a new user
    
    Args:
        user: The user data to create
        
    Returns:
        The created user
        
    Raises:
        HTTPException: If the email is already registered
    """
    # Check if the email is already registered
    if get_user_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate a unique ID
    user_id = uuid.uuid4()
    
    # Get current timestamp
    now = datetime.now()
    
    # Hash the password
    password_hash = get_password_hash(user.password)
    
    # Create a new UserInDB object
    new_user = UserInDB(
        id=user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        password_hash=password_hash,
        created_at=now,
        updated_at=now
    )
    
    # Save to the in-memory database
    users_db[str(user_id)] = new_user
    email_to_id[user.email] = str(user_id)
    
    # Return the user without the password hash
    return User(
        id=user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        created_at=now,
        updated_at=now
    )


def get_users() -> List[User]:
    """
    Get all users
    
    Returns:
        List of all users (without password hashes)
    """
    return [
        User(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        for user in users_db.values()
    ]


def update_user(user_id: str, user_update: UserUpdate) -> User:
    """
    Update a user
    
    Args:
        user_id: The ID of the user to update
        user_update: The user data to update
        
    Returns:
        The updated user
        
    Raises:
        HTTPException: If the user is not found or the email is already registered
    """
    # Check if the user exists
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Get the existing user
    existing_user = users_db[user_id]
    
    # Check if the email is being updated and is already registered
    if user_update.email and user_update.email != existing_user.email and get_user_by_email(user_update.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create a dictionary from the existing user
    existing_user_dict = {
        "id": existing_user.id,
        "name": existing_user.name,
        "email": existing_user.email,
        "role": existing_user.role,
        "password_hash": existing_user.password_hash,
        "created_at": existing_user.created_at,
        "updated_at": existing_user.updated_at
    }
    
    # Create a dictionary from the update data, excluding None values
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    # If the password is being updated, hash it
    if "password" in update_data:
        update_data["password_hash"] = get_password_hash(update_data.pop("password"))
    
    # Update the existing user data
    existing_user_dict.update(update_data)
    
    # Update the updated_at timestamp
    existing_user_dict["updated_at"] = datetime.now()
    
    # Create a new UserInDB object with the updated data
    updated_user = UserInDB(**existing_user_dict)
    
    # Save to the in-memory database
    users_db[user_id] = updated_user
    
    # Update the email_to_id mapping if the email was changed
    if user_update.email and user_update.email != existing_user.email:
        email_to_id.pop(existing_user.email)
        email_to_id[user_update.email] = user_id
    
    # Return the user without the password hash
    return User(
        id=updated_user.id,
        name=updated_user.name,
        email=updated_user.email,
        role=updated_user.role,
        created_at=updated_user.created_at,
        updated_at=updated_user.updated_at
    )


def delete_user(user_id: str) -> Dict[str, str]:
    """
    Delete a user
    
    Args:
        user_id: The ID of the user to delete
        
    Returns:
        A message indicating the user was deleted
        
    Raises:
        HTTPException: If the user is not found
    """
    # Check if the user exists
    if user_id not in users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    # Get the user's email
    user_email = users_db[user_id].email
    
    # Delete the user
    del users_db[user_id]
    del email_to_id[user_email]
    
    return {"message": f"User with ID {user_id} deleted"}
