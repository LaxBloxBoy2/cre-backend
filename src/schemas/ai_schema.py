from pydantic import BaseModel


class TextAnalysisRequest(BaseModel):
    """Request model for text analysis"""
    text: str


class TextAnalysisResponse(BaseModel):
    """Response model for text analysis"""
    analysis: str
