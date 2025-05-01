import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class Organization(Base):
    """Organization model for database"""
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # New metadata fields
    industry = Column(String, nullable=True)
    headquarters = Column(String, nullable=True)
    team_size = Column(Integer, nullable=True)
    website = Column(String, nullable=True)
    preferred_property_type = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    last_active_at = Column(DateTime, nullable=True)

    # Relationships
    users = relationship("User", back_populates="organization")
    deals = relationship("Deal", back_populates="organization")
    invites = relationship("Invite", back_populates="organization")
