from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    """Base model for user data"""
    name: str = Field(..., description="The name of the user")
    email: EmailStr = Field(..., description="The email of the user (unique)")
    role: Literal["Analyst", "Manager", "Admin"] = Field(default="Analyst", description="The role of the user")


class UserCreate(UserBase):
    """Model for creating a new user"""
    password: str = Field(..., description="The password of the user", min_length=8)


class UserUpdate(BaseModel):
    """Model for updating an existing user"""
    name: Optional[str] = Field(None, description="The name of the user")
    email: Optional[EmailStr] = Field(None, description="The email of the user (unique)")
    role: Optional[Literal["Analyst", "Manager", "Admin"]] = Field(None, description="The role of the user")
    password: Optional[str] = Field(None, description="The password of the user", min_length=8)


class User(UserBase):
    """Model for a user with all fields"""
    id: UUID = Field(..., description="The unique identifier for the user")
    created_at: datetime = Field(..., description="The date and time when the user was created")
    updated_at: datetime = Field(..., description="The date and time when the user was last updated")

    class Config:
        """Pydantic configuration"""
        from_attributes = True  # For SQLAlchemy compatibility


class UserInDB(User):
    """Model for a user in the database"""
    password_hash: str = Field(..., description="The hashed password of the user")


class Token(BaseModel):
    """Model for an authentication token"""
    access_token: str = Field(..., description="The JWT access token")
    refresh_token: str = Field(..., description="The JWT refresh token")
    token_type: str = Field(default="bearer", description="The type of token")


class TokenData(BaseModel):
    """Model for token data"""
    email: Optional[str] = Field(None, description="The email of the user")
    role: Optional[str] = Field(None, description="The role of the user")
    token_type: Optional[str] = Field(None, description="The type of token (access or refresh)")


class RefreshRequest(BaseModel):
    """Model for refresh token request"""
    refresh_token: str = Field(..., description="The JWT refresh token")
