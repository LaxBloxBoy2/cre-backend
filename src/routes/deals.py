from fastapi import APIRouter
from ..schemas.deal_schema import DealRequest, ROIResponse
from ..services.deal_service import calculate_roi

router = APIRouter()


@router.post("/deals", response_model=ROIResponse)
def calculate_deal_roi(deal: DealRequest):
    """
    Calculate ROI for a real estate deal
    
    Args:
        deal: The deal request containing property price and rental income
        
    Returns:
        ROI response with calculated ROI percentage
    """
    return calculate_roi(deal)
