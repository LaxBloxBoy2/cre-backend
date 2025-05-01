import uuid
import json
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class DealComment(Base):
    """Deal comment model for database"""
    __tablename__ = "deal_comments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    type = Column(String, nullable=False, default="comment")  # "comment" or "note"
    tagged_user_ids_json = Column(Text, nullable=True)  # JSON string of user IDs mentioned in the comment

    @property
    def tagged_user_ids(self):
        """Get the tagged user IDs as a list"""
        if self.tagged_user_ids_json:
            return json.loads(self.tagged_user_ids_json)
        return []

    @tagged_user_ids.setter
    def tagged_user_ids(self, value):
        """Set the tagged user IDs as a JSON string"""
        if value is not None:
            self.tagged_user_ids_json = json.dumps(value)
        else:
            self.tagged_user_ids_json = None

    # Relationships
    deal = relationship("Deal", back_populates="comments")
    user = relationship("User", foreign_keys=[user_id])
    organization = relationship("Organization", foreign_keys=[org_id])
