from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any, Dict
from datetime import datetime
import uuid

class UserBase(BaseModel):
    """Base model for user data"""
    name: str
    email: EmailStr
    role: str

    @validator('role')
    def validate_role(cls, v):
        """Validate that role is one of the allowed values"""
        allowed_roles = ["Analyst", "Manager", "Admin", "LP"]
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of {allowed_roles}")
        return v

class UserCreate(UserBase):
    """Model for creating a new user"""
    password: str

class UserUpdate(BaseModel):
    """Model for updating an existing user"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None

    @validator('role')
    def validate_role(cls, v):
        """Validate that role is one of the allowed values"""
        if v is not None:
            allowed_roles = ["Analyst", "Manager", "Admin", "LP"]
            if v not in allowed_roles:
                raise ValueError(f"Role must be one of {allowed_roles}")
        return v

class UserInDB(UserBase):
    """Model for a user in the database"""
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class User(UserInDB):
    """Model for a user with all fields except password"""
    avatar_placeholder: Optional[Dict[str, str]] = None

class UserWithDeals(User):
    """Model for a user with their deals"""
    deals: List[Any] = []

    class Config:
        from_attributes = True