from pydantic import BaseModel, Field

class ReportResponse(BaseModel):
    """Response model for report generation"""
    status: str = Field(..., description="Status of the report generation")
    download_url: str = Field(..., description="URL to download the generated report")
