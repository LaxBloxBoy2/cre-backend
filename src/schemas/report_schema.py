from pydantic import BaseModel, Field
from typing import Optional
from ..underwriting_schema import UnderwritingRequest


class ReportRequest(UnderwritingRequest):
    """Request model for property report generation, inherits from UnderwritingRequest"""
    # We can add additional fields specific to report generation here if needed
    company_name: Optional[str] = Field(None, description="The name of the company generating the report")
    analyst_name: Optional[str] = Field(None, description="The name of the analyst generating the report")
    report_title: Optional[str] = Field(None, description="Custom title for the report")


class ReportResponse(BaseModel):
    """Response model for report generation"""
    status: str = Field(..., description="Status of the report generation")
    message: str = Field(..., description="Message about the report generation")
    filename: Optional[str] = Field(None, description="Filename of the generated report")
    download_url: Optional[str] = Field(None, description="URL to download the generated report")
