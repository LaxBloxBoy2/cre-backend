from fastapi import APIRouter
from ..schemas.ai_schema import TextAnalysisRequest, TextAnalysisResponse
from ..services.ai_service import analyze_text

router = APIRouter()


@router.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text_route(request: TextAnalysisRequest):
    """
    Analyze text using DeepSeek model via Fireworks API
    
    Args:
        request: The text analysis request containing the text to analyze
        
    Returns:
        Text analysis response with the analysis
    """
    return await analyze_text(request)
