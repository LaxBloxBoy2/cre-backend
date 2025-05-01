import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from ..database import Base

class MarketComp(Base):
    """Market Comp model for database"""
    __tablename__ = "market_comps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_type = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    city = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False, index=True)
    zipcode = Column(String, nullable=False, index=True)
    price = Column(Integer, nullable=True)
    rent = Column(Integer, nullable=True)
    beds = Column(Integer, nullable=True)
    baths = Column(Integer, nullable=True)
    sqft = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    source = Column(String, nullable=False, default="LoopNet")

    def __repr__(self):
        return f"<MarketComp(id={self.id}, property_type={self.property_type}, city={self.city}, state={self.state})>"
