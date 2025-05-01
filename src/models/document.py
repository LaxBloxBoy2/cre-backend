import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class Document(Base):
    """Model for documents"""
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    upload_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ai_summary = Column(Text, nullable=True)
    red_flags = Column(Text, nullable=True)  # Stored as JSON string

    # Relationships
    deal = relationship("Deal", back_populates="documents")
    user = relationship("User", back_populates="documents")
