from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime

class OrganizationBase(BaseModel):
    """Base model for organization"""
    name: str = Field(..., description="Name of the organization")
    industry: Optional[str] = Field(None, description="Industry of the organization")
    headquarters: Optional[str] = Field(None, description="Headquarters location of the organization")
    team_size: Optional[int] = Field(None, description="Number of employees in the organization", ge=1, le=5000)
    website: Optional[str] = Field(None, description="Website URL of the organization")
    preferred_property_type: Optional[str] = Field(None, description="Preferred property type for investments")
    notes: Optional[str] = Field(None, description="Additional notes about the organization")

    @field_validator('industry')
    def validate_industry(cls, v):
        if v is not None:
            valid_industries = ["Private Equity", "Brokerage", "Developer", "REIT", "Family Office", "Investment Bank", "Insurance", "Pension Fund", "Other"]
            if v not in valid_industries:
                raise ValueError(f"Industry must be one of: {', '.join(valid_industries)}")
        return v

    @field_validator('preferred_property_type')
    def validate_property_type(cls, v):
        if v is not None:
            valid_types = ["Multifamily", "Office", "Retail", "Industrial", "Hotel", "Mixed-Use", "Land", "Other"]
            if v not in valid_types:
                raise ValueError(f"Property type must be one of: {', '.join(valid_types)}")
        return v

    @field_validator('website')
    def validate_website(cls, v):
        if v is not None:
            # Simple URL validation
            if not v.startswith('http://') and not v.startswith('https://'):
                v = 'https://' + v
        return v

class OrganizationCreate(OrganizationBase):
    """Create model for organization"""
    pass

class OrganizationUpdate(BaseModel):
    """Update model for organization"""
    name: Optional[str] = Field(None, description="Name of the organization")
    industry: Optional[str] = Field(None, description="Industry of the organization")
    headquarters: Optional[str] = Field(None, description="Headquarters location of the organization")
    team_size: Optional[int] = Field(None, description="Number of employees in the organization", ge=1, le=5000)
    website: Optional[str] = Field(None, description="Website URL of the organization")
    preferred_property_type: Optional[str] = Field(None, description="Preferred property type for investments")
    notes: Optional[str] = Field(None, description="Additional notes about the organization")

    @field_validator('industry')
    def validate_industry(cls, v):
        if v is not None:
            valid_industries = ["Private Equity", "Brokerage", "Developer", "REIT", "Family Office", "Investment Bank", "Insurance", "Pension Fund", "Other"]
            if v not in valid_industries:
                raise ValueError(f"Industry must be one of: {', '.join(valid_industries)}")
        return v

    @field_validator('preferred_property_type')
    def validate_property_type(cls, v):
        if v is not None:
            valid_types = ["Multifamily", "Office", "Retail", "Industrial", "Hotel", "Mixed-Use", "Land", "Other"]
            if v not in valid_types:
                raise ValueError(f"Property type must be one of: {', '.join(valid_types)}")
        return v

    @field_validator('website')
    def validate_website(cls, v):
        if v is not None:
            # Simple URL validation
            if not v.startswith('http://') and not v.startswith('https://'):
                v = 'https://' + v
        return v

class OrganizationInDB(OrganizationBase):
    """Database model for organization"""
    id: str
    created_at: datetime
    last_active_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Organization(OrganizationInDB):
    """Response model for organization"""
    pass

class OrganizationWithMembers(Organization):
    """Response model for organization with members"""
    members: List["UserInOrg"]

class UserInOrg(BaseModel):
    """Response model for user in organization"""
    id: str
    name: str
    email: str
    org_role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Update forward references
OrganizationWithMembers.model_rebuild()

class InviteBase(BaseModel):
    """Base model for invite"""
    email: EmailStr = Field(..., description="Email of the invitee")
    role: str = Field(..., description="Role of the invitee in the organization")

class InviteCreate(InviteBase):
    """Create model for invite"""
    pass

class InviteInDB(InviteBase):
    """Database model for invite"""
    id: str
    org_id: str
    invited_by_user_id: str
    token: str
    status: str
    created_at: datetime
    accepted_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Invite(InviteInDB):
    """Response model for invite"""
    organization: Organization
    invited_by: UserInOrg

class InviteInfo(BaseModel):
    """Response model for invite info"""
    organization: Organization
    role: str
    email: EmailStr

class InviteAccept(BaseModel):
    """Request model for accepting an invite"""
    name: str = Field(..., description="Name of the user")
    password: str = Field(..., description="Password of the user")
