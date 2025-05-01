from fastapi import APIRouter, Request
from ..schemas.lease_schema import LeaseAnalysisRequest, LeaseAnalysisResponse
from ..services.lease_service import analyze_lease
from ..utils.limiter import limiter

router = APIRouter()


@router.post("/analyze-lease", response_model=LeaseAnalysisResponse)
@limiter.limit("5/minute")
async def analyze_lease_route(request: Request, lease_request: LeaseAnalysisRequest):
    """
    Analyze a commercial lease to extract key information

    Args:
        request: The lease analysis request containing the lease text

    Returns:
        Lease analysis response with extracted information
    """
    return await analyze_lease(lease_request)
