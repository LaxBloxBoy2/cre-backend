import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "7f58dcc89d7943f8a1bd8b9a4d699f13c3e46f5d2c4b4aa9b8f7e8d6c5b4a3")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: The data to encode in the token
        expires_delta: The expiration time delta

    Returns:
        The encoded JWT token
    """
    to_encode = data.copy()
    # Add token type to payload
    to_encode.update({"token_type": "access"})

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token

    Args:
        data: The data to encode in the token
        expires_delta: The expiration time delta

    Returns:
        The encoded JWT token
    """
    to_encode = data.copy()
    # Add token type to payload
    to_encode.update({"token_type": "refresh"})

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT access token

    Args:
        token: The JWT token

    Returns:
        The decoded token payload
    """
    return jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])

def decode_refresh_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT refresh token

    Args:
        token: The JWT token

    Returns:
        The decoded token payload
    """
    return jwt.decode(token, JWT_REFRESH_SECRET, algorithms=[ALGORITHM])

def get_token_expiry(token_type: str = "access") -> datetime:
    """
    Get the expiry time for a token

    Args:
        token_type: The type of token (access or refresh)

    Returns:
        The expiry time
    """
    if token_type == "refresh":
        return datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    else:
        return datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
