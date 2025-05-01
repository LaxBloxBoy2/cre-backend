from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, func
from sqlalchemy.orm import relationship
from ..database import Base
import uuid
from datetime import datetime, timezone
import json

class DealScenario(Base):
    __tablename__ = "deal_scenarios"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    name = Column(String, nullable=False)
    var_changed = Column(String, nullable=False)
    delta = Column(Float, nullable=False)
    cashflow_json = Column(Text, nullable=True)  # Stored as JSON string
    irr = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationship
    deal = relationship("Deal", back_populates="scenarios")
    
    @property
    def cashflow_data(self):
        """Get cashflow as JSON object"""
        if self.cashflow_json:
            return json.loads(self.cashflow_json)
        return None
