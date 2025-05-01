from fastapi import APIRouter, Request
from ..schemas.risk_schema import RiskRequest, RiskResponse
from ..services.risk_service import calculate_risk_score
from ..utils.limiter import limiter

router = APIRouter()


@router.post("/risk-score", response_model=RiskResponse)
@limiter.limit("5/minute")
async def calculate_risk_score_route(request: Request, risk_request: RiskRequest):
    """
    Calculate risk score for a property based on underwriting calculations

    Args:
        request: The risk request containing property details

    Returns:
        Risk response with calculated values and AI-generated risk assessment
    """
    return await calculate_risk_score(risk_request)
