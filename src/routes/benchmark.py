from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.benchmark_schema import BenchmarkRequest, BenchmarkResponse
from ..services.auth_service_db import get_current_active_user
from ..services.benchmark_service import generate_benchmark_report
from ..services.security_service import validate_deal_access
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

@router.post("/benchmark-report", response_model=BenchmarkResponse, tags=["Benchmarking"])
async def generate_benchmark_report_route(
    request: BenchmarkRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate a benchmark report for a list of deals
    
    This endpoint generates a benchmark report that compares key metrics across multiple deals
    and provides a summary of the portfolio's performance.
    
    Args:
        request: Benchmark request with list of deal IDs
        current_user: The current user (from the token)
        db: Database session
        
    Returns:
        Benchmark report with metrics and summary
        
    Raises:
        HTTPException: If any of the deals are not found or the user is not authorized
    """
    # Check if user has appropriate role (Analyst, Manager, or Admin)
    if current_user.role not in ["Admin", "Manager", "Analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Analysts, Managers, and Admins can generate benchmark reports"
        )
    
    # Validate access to all deals
    for deal_id in request.deal_ids:
        validate_deal_access(db, deal_id, current_user)
    
    # Generate benchmark report
    report = await generate_benchmark_report(
        db=db,
        deal_ids=request.deal_ids,
        market_comparison=request.market_comparison
    )
    
    return report
