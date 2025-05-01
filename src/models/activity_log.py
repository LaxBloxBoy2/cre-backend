import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class ActivityLog(Base):
    """Activity log model for database"""
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=True)
    action = Column(String, nullable=False)  # e.g. "created", "updated", "approved", "commented", "uploaded_file", "imported"
    message = Column(Text, nullable=False)  # human-readable summary
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization", foreign_keys=[org_id])
    deal = relationship("Deal", foreign_keys=[deal_id])
