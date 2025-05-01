import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from ..database import Base

class Invoice(Base):
    """Model for invoices"""
    __tablename__ = "invoices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    vendor_name = Column(String, nullable=True)
    invoice_number = Column(String, nullable=True)
    invoice_date = Column(Date, nullable=True)
    total_amount = Column(Float, nullable=True)
    status = Column(String, default="pending", nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    line_items = Column(JSONB, nullable=True)
    original_pdf_url = Column(String, nullable=True)
    
    # Relationships
    deal = relationship("Deal", back_populates="invoices")
