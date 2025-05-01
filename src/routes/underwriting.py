from fastapi import APIRouter, Request
from ..schemas.underwriting_schema import UnderwritingRequest, UnderwritingResponse
from ..services.underwriting_service import underwrite_property
from ..utils.limiter import limiter

router = APIRouter()


@router.post("/underwrite", response_model=UnderwritingResponse)
@limiter.limit("5/minute")
async def underwrite_property_route(request: Request, underwriting_request: UnderwritingRequest):
    """
    Perform property underwriting calculations and generate an underwriting summary

    Args:
        request: The underwriting request containing property details

    Returns:
        Underwriting response with calculated values and AI-generated summary
    """
    return await underwrite_property(underwriting_request)
