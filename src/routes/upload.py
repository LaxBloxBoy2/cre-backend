from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import Optional
import logging
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.lease_schema import LeaseUploadResponse, LeaseAnalysisBase
from ..services.auth_service_db import get_current_active_user
from ..services.deal_service import get_deal
from ..services.lease_analysis_service import (
    save_uploaded_file,
    analyze_lease_text,
    get_lease_analysis,
    format_lease_analysis
)
from ..utils.limiter import limiter
from ..services.security_service import validate_deal_access

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/deals/{deal_id}/upload-lease", response_model=LeaseUploadResponse, tags=["Uploads"])
@limiter.limit("10/minute")
async def upload_lease(
    request: Request,
    deal_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a lease file (PDF or DOCX) for a deal and analyze it

    Args:
        deal_id: Deal ID
        file: Uploaded file
        current_user: Current user
        db: Database session

    Returns:
        Upload response with file metadata and lease analysis
    """
    # Get deal and validate access
    deal = validate_deal_access(db, deal_id, current_user)

    try:
        # Save the uploaded file
        db_file, extracted_text = await save_uploaded_file(file, deal_id, current_user.id, db)

        # Analyze the lease text
        db_analysis = await analyze_lease_text(extracted_text, db_file.id, deal_id, db)
    except HTTPException as e:
        # Log the error
        logger.warning(
            f"File upload rejected: user_id={current_user.id}, deal_id={deal_id}, "
            f"filename={file.filename}, content_type={file.content_type}, "
            f"error={e.detail}"
        )
        raise

    # Format the analysis for the response
    analysis = format_lease_analysis(db_analysis)

    # Create the response
    response = LeaseUploadResponse(
        status="Uploaded and analyzed successfully",
        file=db_file,
        analysis=analysis
    )

    return response

@router.get("/deals/{deal_id}/lease-analysis", response_model=Optional[LeaseAnalysisBase], tags=["Uploads"])
async def get_lease_analysis_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the lease analysis for a deal

    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session

    Returns:
        Lease analysis or None if not found
    """
    # Get deal and validate access
    deal = validate_deal_access(db, deal_id, current_user)

    # Get the lease analysis
    analysis = get_lease_analysis(db, deal_id=deal_id)
    if not analysis:
        return None

    # Format the analysis for the response
    return format_lease_analysis(analysis)
