from sqlalchemy import Column, String, ForeignKey, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class WaterfallTier(Base):
    __tablename__ = "waterfall_tiers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    structure_id = Column(UUID(as_uuid=True), ForeignKey("promote_structures.id", ondelete="CASCADE"), nullable=False)
    tier_order = Column(Integer, nullable=False)  # Order of the tier in the waterfall
    hurdle = Column(Float, nullable=False)  # IRR hurdle as a percentage (e.g., 8.0 for 8%)
    gp_split = Column(Float, nullable=False)  # GP percentage (e.g., 30.0 for 30%)
    lp_split = Column(Float, nullable=False)  # LP percentage (e.g., 70.0 for 70%)
    
    # Relationships
    promote_structure = relationship("PromoteStructure", back_populates="waterfall_tiers")
