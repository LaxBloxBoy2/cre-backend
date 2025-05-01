from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from ..schemas.report_schema import ReportRequest
from ..services.report_service import generate_property_report
from ..utils.limiter import limiter

router = APIRouter()


@router.post("/generate-report", response_class=StreamingResponse)
@limiter.limit("5/minute")
async def generate_report_route(request: Request, report_request: ReportRequest):
    """
    Generate a PDF report for a property based on underwriting calculations

    Args:
        request: The report request containing property details

    Returns:
        StreamingResponse with the PDF file
    """
    return await generate_property_report(report_request)
