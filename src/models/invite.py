import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class Invite(Base):
    """Invite model for database"""
    __tablename__ = "invites"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    invited_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # "Owner", "Manager", "Analyst"
    token = Column(String, unique=True, nullable=False, index=True, default=lambda: str(uuid.uuid4()))
    status = Column(String, nullable=False, default="Pending")  # "Pending", "Accepted", "Expired"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    accepted_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="invites")
    invited_by = relationship("User", foreign_keys=[invited_by_user_id])
