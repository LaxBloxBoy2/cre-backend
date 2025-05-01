import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from enum import Enum as PyEnum

from ..database import Base


class FieldType(str, PyEnum):
    """Enum for custom field types"""
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    BOOLEAN = "boolean"
    SELECT = "select"


class CustomField(Base):
    """Model for custom fields for tenants"""
    __tablename__ = "custom_fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    value = Column(Text, nullable=True)
    field_type = Column(Enum(FieldType), nullable=False, default=FieldType.TEXT)
    options = Column(JSON, nullable=True)  # For select type fields

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant = relationship("Tenant", back_populates="custom_fields")

    def __repr__(self):
        return f"<CustomField {self.name}>"
