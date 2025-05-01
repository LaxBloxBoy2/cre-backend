from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
import datetime

class UploadedFile(Base):
    """Model for uploaded files"""
    __tablename__ = "uploaded_files"
    
    id = Column(String, primary_key=True)
    deal_id = Column(String, ForeignKey("deals.id", ondelete="CASCADE"))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    deal = relationship("Deal", back_populates="uploaded_files")
    user = relationship("User", back_populates="uploaded_files")
    lease_analysis = relationship("LeaseAnalysis", back_populates="uploaded_file", uselist=False)
