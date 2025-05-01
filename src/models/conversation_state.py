import uuid
import json
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class ConversationState(Base):
    """ConversationState model for database"""
    __tablename__ = "conversation_states"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    current_task = Column(String, nullable=True)
    step = Column(String, nullable=True)
    inputs = Column(Text, nullable=True)  # JSON string of collected inputs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    deal = relationship("Deal", back_populates="conversation_states")
    user = relationship("User", backref="conversation_states")
    
    def get_inputs(self):
        """Get the inputs as a dictionary"""
        if self.inputs:
            try:
                return json.loads(self.inputs)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_inputs(self, inputs_dict):
        """Set the inputs from a dictionary"""
        self.inputs = json.dumps(inputs_dict)
