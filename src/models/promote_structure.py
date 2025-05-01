from sqlalchemy import Column, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class PromoteStructure(Base):
    __tablename__ = "promote_structures"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deal_id = Column(UUID(as_uuid=True), ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="promote_structures")
    waterfall_tiers = relationship("WaterfallTier", back_populates="promote_structure", cascade="all, delete-orphan")
