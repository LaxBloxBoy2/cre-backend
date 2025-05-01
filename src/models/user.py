import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class User(Base):
    """User model for database"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Analyst, Manager, Admin (system roles)
    org_role = Column(String, nullable=True)  # Owner, Manager, Analyst (organization roles)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    refresh_token = Column(Text, nullable=True)
    refresh_token_expires_at = Column(DateTime, nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="users")
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user")
    documents = relationship("Document", back_populates="user")
    # Note: Deal relationship is defined in the Deal model
    # Note: Task assignee relationship is defined in the Task model via the task_assignees association table
    created_tasks = relationship("Task", foreign_keys="Task.created_by", back_populates="creator")
