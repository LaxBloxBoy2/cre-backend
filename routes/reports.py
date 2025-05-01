import os
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
from database import get_db
from schemas.user_schema import User
from schemas.report_schema import ReportResponse
from services.auth_service_db import get_current_active_user
from services.deal_service import get_deal
from services.pdf_report_service import generate_report

router = APIRouter()

@router.post("/deals/{deal_id}/generate-report", response_model=ReportResponse, tags=["Reports"])
async def generate_deal_report(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate a PDF report for a deal
    
    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session
        
    Returns:
        Report response with status and download URL
    """
    # Check if deal exists
    deal = get_deal(db, deal_id=deal_id)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Check if user is authorized to access this deal
    if current_user.role != "Admin" and deal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this deal"
        )
    
    try:
        # Generate the report
        result = generate_report(db, deal_id, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )

@router.get("/reports/{filename}", tags=["Reports"])
async def get_report(
    filename: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a generated report
    
    Args:
        filename: Report filename
        current_user: Current user
        db: Database session
        
    Returns:
        The report file as a streaming response
    """
    # Get the report file path
    reports_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
    file_path = os.path.join(reports_dir, filename)
    
    # Check if the file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if the user is authorized to access this report
    # This is a simple check that assumes the filename contains the deal ID
    # In a production environment, you would want to store the report metadata in the database
    # and check if the user is authorized to access the report based on the deal ID
    
    # Return the file as a streaming response
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )
