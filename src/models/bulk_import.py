import uuid
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base


class BulkImport(Base):
    """Model for bulk imports"""
    __tablename__ = "bulk_imports"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    filename = Column(String, nullable=False)
    import_type = Column(Enum("excel", "csv", name="import_type"), nullable=False)
    status = Column(Enum("processing", "completed", "failed", name="import_status"), nullable=False, default="processing")
    total_rows = Column(Integer, nullable=False, default=0)
    imported_count = Column(Integer, nullable=False, default=0)
    error_count = Column(Integer, nullable=False, default=0)
    errors = Column(Text, nullable=True)  # JSON string of errors
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", backref="bulk_imports")
    organization = relationship("Organization", backref="bulk_imports")
