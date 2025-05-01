import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum, Index
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class DealAlert(Base):
    """Model for deal alerts"""
    __tablename__ = "deal_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String, nullable=False)  # "Lease Expiry", "DSCR Warning", "Cap Rate Warning", etc.
    severity = Column(Enum("low", "medium", "high", name="alert_severity"), nullable=False, default="medium")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)

    # Relationships
    deal = relationship("Deal", back_populates="alerts")
    resolver = relationship("User", foreign_keys=[resolved_by])

    def __repr__(self):
        return f"<DealAlert {self.id} for deal {self.deal_id}>"

# Create an alias for backward compatibility
Alert = DealAlert
