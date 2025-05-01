from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging

from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.bulk_import_schema import BulkImport, BulkImportStatus, ImportType
from ..services.auth_service_db import get_current_active_user
from ..services.bulk_import_service import (
    create_bulk_import,
    process_bulk_import,
    get_bulk_import_status,
    get_bulk_import_error_report
)
from ..utils.limiter import limiter

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/import", response_model=Dict[str, Any], tags=["Import"])
@limiter.limit("5/minute")
async def import_deals(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    import_type: ImportType = Query(ImportType.EXCEL, description="Import file type"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Import deals from an Excel or CSV file
    
    Args:
        background_tasks: Background tasks
        file: Uploaded file
        import_type: Import file type (excel or csv)
        current_user: Current user
        db: Database session
        
    Returns:
        Import ID and status
    """
    # Check if user is in an organization
    if not current_user.org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not in an organization"
        )
    
    try:
        # Create bulk import record
        bulk_import = await create_bulk_import(
            db=db,
            file=file,
            user_id=current_user.id,
            org_id=current_user.org_id,
            import_type=import_type
        )
        
        # Process the import in the background
        await process_bulk_import(
            db=db,
            import_id=bulk_import.id,
            file_path=bulk_import.file_path,
            import_type=import_type,
            background_tasks=background_tasks
        )
        
        return {
            "import_id": bulk_import.id,
            "status": bulk_import.status,
            "message": "Import started successfully"
        }
    
    except Exception as e:
        logger.error(f"Error starting import: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error starting import: {str(e)}"
        )


@router.get("/import/{import_id}/status", response_model=BulkImportStatus, tags=["Import"])
@limiter.limit("20/minute")
async def get_import_status(
    import_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the status of an import
    
    Args:
        import_id: Import ID
        current_user: Current user
        db: Database session
        
    Returns:
        Import status
    """
    try:
        # Get import status
        status_data = await get_bulk_import_status(db=db, import_id=import_id)
        return status_data
    
    except HTTPException as e:
        raise e
    
    except Exception as e:
        logger.error(f"Error getting import status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting import status: {str(e)}"
        )


@router.get("/import/{import_id}/errors", response_model=List[Dict[str, Any]], tags=["Import"])
@limiter.limit("10/minute")
async def get_import_errors(
    import_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the errors for an import
    
    Args:
        import_id: Import ID
        current_user: Current user
        db: Database session
        
    Returns:
        List of errors
    """
    try:
        # Get import errors
        errors = await get_bulk_import_error_report(db=db, import_id=import_id)
        return errors
    
    except HTTPException as e:
        raise e
    
    except Exception as e:
        logger.error(f"Error getting import errors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting import errors: {str(e)}"
        )
