import uuid
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from ..database import Base

class DealStage(Base):
    """Model for deal stages"""
    __tablename__ = "deal_stages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    order = Column(Integer, nullable=False)
    target_days = Column(Integer, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    deal = relationship("Deal", back_populates="stages")
    
    def __repr__(self):
        return f"<DealStage {self.name} for deal {self.deal_id}>"
