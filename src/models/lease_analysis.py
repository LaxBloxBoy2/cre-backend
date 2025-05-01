from sqlalchemy import Column, String, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.orm import relationship
from ..database import Base
import datetime

class LeaseAnalysis(Base):
    """Model for lease analysis"""
    __tablename__ = "lease_analyses"

    id = Column(String, primary_key=True)
    file_id = Column(String, ForeignKey("uploaded_files.id", ondelete="CASCADE"), unique=True)
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"))
    base_rent = Column(String)
    lease_term = Column(String)
    escalations = Column(String)  # New field for rent escalations
    tenant_name = Column(String)  # New field for tenant name
    renewals = Column(Text)  # Stored as JSON string
    break_clauses = Column(Text)  # Stored as JSON string
    red_flags = Column(Text)  # Stored as JSON string
    summary = Column(Text)  # New field for lease summary
    raw_text = Column(Text)  # Extracted text from the document
    analysis_timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    uploaded_file = relationship("UploadedFile", back_populates="lease_analysis")
    deal = relationship("Deal", back_populates="lease_analyses")
