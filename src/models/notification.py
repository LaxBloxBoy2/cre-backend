import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class Notification(Base):
    """Notification model for database"""
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)  # recipient
    actor_id = Column(String, ForeignKey("users.id"), nullable=True)  # who triggered it (nullable for system)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=True)
    type = Column(String, nullable=False)  # "mention" | "status_change" | "document_upload" | "comment"
    message = Column(Text, nullable=False)  # human-readable summary
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", foreign_keys=[org_id])
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])
    deal = relationship("Deal", foreign_keys=[deal_id])
