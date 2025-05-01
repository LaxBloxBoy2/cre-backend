import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class LPAssignment(Base):
    """Model for LP assignments to deals"""
    __tablename__ = "lp_assignments"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lp_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    lp = relationship("User", foreign_keys=[lp_id])
    deal = relationship("Deal")
    assigner = relationship("User", foreign_keys=[assigned_by])
    
    # Ensure each LP is assigned to a deal only once
    __table_args__ = (
        UniqueConstraint('lp_id', 'deal_id', name='uix_lp_deal'),
    )
