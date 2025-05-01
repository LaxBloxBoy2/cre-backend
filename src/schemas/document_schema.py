from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict
from datetime import datetime

class DocumentBase(BaseModel):
    """Base model for document data"""
    name: str = Field(..., description="The name of the document")
    doc_type: Literal["LOI", "Pro Forma", "Lease", "Offering Memorandum", "Purchase Agreement", "Other"] = Field(
        ...,
        description="The type of document"
    )
    note: Optional[str] = Field(None, description="Optional note about the document")

class DocumentCreate(DocumentBase):
    """Model for creating a new document"""
    deal_id: str = Field(..., description="The ID of the deal this document belongs to")

class RedFlag(BaseModel):
    """Model for a red flag in a document"""
    text: str = Field(..., description="The text of the flagged clause")
    risk_summary: str = Field(..., description="Explanation of why this is a risk")
    severity: Literal["red", "yellow"] = Field(..., description="Severity of the risk (red = critical, yellow = moderate)")

class DocumentInDB(DocumentBase):
    """Model for a document in the database"""
    id: str = Field(..., description="The unique identifier for the document")
    deal_id: str = Field(..., description="The ID of the deal this document belongs to")
    user_id: str = Field(..., description="The ID of the user who uploaded the document")
    file_path: str = Field(..., description="The path to the document file")
    file_type: str = Field(..., description="The type of the document file (e.g., pdf, docx)")
    upload_timestamp: datetime = Field(..., description="The date and time when the document was uploaded")
    ai_summary: Optional[str] = Field(None, description="AI-generated summary of the document")
    red_flags: Optional[List[RedFlag]] = Field(None, description="List of red flags identified in the document")

    class Config:
        from_attributes = True

class Document(DocumentInDB):
    """Model for a document with all fields"""
    uploaded_by_name: Optional[str] = Field(None, description="The name of the user who uploaded the document")

class DocumentList(BaseModel):
    """Model for a list of documents"""
    documents: List[Document] = Field(..., description="List of documents")
    total: int = Field(..., description="Total number of documents")

class DocumentSummaryResponse(BaseModel):
    """Response model for document summary"""
    id: str = Field(..., description="The ID of the document")
    summary: str = Field(..., description="AI-generated summary of the document")
    status: str = Field("success", description="Status of the summary generation")

class RedFlagScanRequest(BaseModel):
    """Request model for red flag scan"""
    document_id: str = Field(..., description="The ID of the document to scan")

class RedFlagScanResponse(BaseModel):
    """Response model for red flag scan"""
    id: str = Field(..., description="The ID of the document")
    red_flags: List[RedFlag] = Field(..., description="List of red flags identified in the document")
    status: str = Field("success", description="Status of the scan")
