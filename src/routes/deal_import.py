from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict, Any
from ..database import get_db
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user
from ..services.import_service import import_deals, check_user_can_import

router = APIRouter()

@router.post("/deals/import", response_model=Dict[str, Any], tags=["Import"])
async def import_deals_route(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Import deals from a CSV or Excel file
    
    Args:
        file: Uploaded file
        current_user: Current user
        db: Database session
        
    Returns:
        Import results
    """
    # Check if the user can import deals
    if not check_user_can_import(db, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to import deals"
        )
    
    # Check if the user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    # Check file extension
    file_extension = file.filename.split(".")[-1].lower() if file.filename else ""
    if file_extension not in ["csv", "xlsx"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV and Excel files are allowed"
        )
    
    try:
        # Import deals
        result = await import_deals(
            db=db,
            file=file,
            user_id=current_user.id,
            org_id=current_user.org_id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
