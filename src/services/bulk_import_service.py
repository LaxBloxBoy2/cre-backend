import os
import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from fastapi import UploadFile, BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
import logging

from ..models.bulk_import import BulkImport
from ..models.deal import Deal
from ..schemas.bulk_import_schema import ImportRowError, ImportStatus, ImportType
from ..utils.file_utils import validate_file_size, save_file, get_safe_upload_path

# Configure logging
logger = logging.getLogger(__name__)

# Create uploads directory for imports if it doesn't exist
IMPORTS_DIR = os.path.join("uploads", "imports")
os.makedirs(IMPORTS_DIR, exist_ok=True)

# Maximum file size (20MB)
MAX_FILE_SIZE_MB = 20

# Required columns for deal import
REQUIRED_COLUMNS = [
    "project_name",
    "location",
    "property_type",
    "acquisition_price",
    "square_footage",
    "construction_cost",
    "exit_cap_rate",
    "vacancy_rate",
    "operating_expenses_per_sf"
]

# Optional columns for deal import
OPTIONAL_COLUMNS = [
    "projected_rent_per_sf",
    "projected_irr",
    "dscr",
    "tags"
]

# Column types for validation
COLUMN_TYPES = {
    "project_name": str,
    "location": str,
    "property_type": str,
    "acquisition_price": float,
    "square_footage": float,
    "construction_cost": float,
    "exit_cap_rate": float,
    "vacancy_rate": float,
    "operating_expenses_per_sf": float,
    "projected_rent_per_sf": float,
    "projected_irr": float,
    "dscr": float,
    "tags": str
}


async def create_bulk_import(
    db: Session,
    file: UploadFile,
    user_id: str,
    org_id: str,
    import_type: ImportType
) -> BulkImport:
    """
    Create a new bulk import record
    
    Args:
        db: Database session
        file: Uploaded file
        user_id: User ID
        org_id: Organization ID
        import_type: Import type (excel or csv)
        
    Returns:
        Bulk import record
    """
    # Validate file size
    file_size = await file.read()
    await file.seek(0)
    if len(file_size) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB."
        )
    
    # Get file extension
    filename = file.filename
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    file_extension = os.path.splitext(filename)[1].lower()
    if import_type == ImportType.EXCEL and file_extension != ".xlsx":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension for Excel import. Must be .xlsx"
        )
    elif import_type == ImportType.CSV and file_extension != ".csv":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file extension for CSV import. Must be .csv"
        )
    
    # Save the file
    file_path, relative_path = get_safe_upload_path(org_id, filename, file_extension.lstrip("."))
    await save_file(file, file_path)
    
    # Create a new bulk import record
    import_id = str(uuid.uuid4())
    bulk_import = BulkImport(
        id=import_id,
        user_id=user_id,
        org_id=org_id,
        filename=filename,
        import_type=import_type.value,
        status=ImportStatus.PROCESSING.value,
        total_rows=0,
        imported_count=0,
        error_count=0,
        errors=None,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(bulk_import)
    db.commit()
    db.refresh(bulk_import)
    
    return bulk_import


async def process_bulk_import(
    db: Session,
    import_id: str,
    file_path: str,
    import_type: ImportType,
    background_tasks: BackgroundTasks
) -> None:
    """
    Process a bulk import in the background
    
    Args:
        db: Database session
        import_id: Bulk import ID
        file_path: Path to the uploaded file
        import_type: Import type (excel or csv)
        background_tasks: Background tasks
    """
    # Add the task to background tasks
    background_tasks.add_task(
        _process_bulk_import_task,
        db,
        import_id,
        file_path,
        import_type
    )


async def _process_bulk_import_task(
    db: Session,
    import_id: str,
    file_path: str,
    import_type: ImportType
) -> None:
    """
    Process a bulk import task
    
    Args:
        db: Database session
        import_id: Bulk import ID
        file_path: Path to the uploaded file
        import_type: Import type (excel or csv)
    """
    # Get the bulk import record
    bulk_import = db.query(BulkImport).filter(BulkImport.id == import_id).first()
    if not bulk_import:
        logger.error(f"Bulk import not found: {import_id}")
        return
    
    try:
        # Read the file
        if import_type == ImportType.EXCEL:
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)
        
        # Replace NaN values with None
        df = df.replace({np.nan: None})
        
        # Convert column names to lowercase
        df.columns = [col.lower().strip() for col in df.columns]
        
        # Check required columns
        missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
        if missing_columns:
            bulk_import.status = ImportStatus.FAILED.value
            bulk_import.errors = json.dumps([{
                "row_number": 0,
                "error_message": f"Missing required columns: {', '.join(missing_columns)}",
                "row_data": {}
            }])
            bulk_import.completed_at = datetime.now(timezone.utc)
            db.commit()
            return
        
        # Update total rows
        total_rows = len(df)
        bulk_import.total_rows = total_rows
        db.commit()
        
        # Process each row
        imported_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            row_number = index + 2  # +2 because index starts at 0 and we skip the header row
            row_dict = row.to_dict()
            
            try:
                # Validate row data
                validation_errors = _validate_row(row_dict)
                if validation_errors:
                    error_count += 1
                    errors.append({
                        "row_number": row_number,
                        "error_message": "; ".join(validation_errors),
                        "row_data": row_dict
                    })
                    continue
                
                # Create the deal
                deal_id = str(uuid.uuid4())
                deal = Deal(
                    id=deal_id,
                    user_id=bulk_import.user_id,
                    org_id=bulk_import.org_id,
                    project_name=row_dict.get("project_name"),
                    location=row_dict.get("location"),
                    property_type=row_dict.get("property_type"),
                    acquisition_price=float(row_dict.get("acquisition_price")),
                    construction_cost=float(row_dict.get("construction_cost")),
                    square_footage=float(row_dict.get("square_footage")),
                    projected_rent_per_sf=float(row_dict.get("projected_rent_per_sf", 0)),
                    vacancy_rate=float(row_dict.get("vacancy_rate")),
                    operating_expenses_per_sf=float(row_dict.get("operating_expenses_per_sf")),
                    exit_cap_rate=float(row_dict.get("exit_cap_rate")),
                    status="draft",
                    created_at=datetime.now(timezone.utc)
                )
                
                # Add optional fields if present
                if "projected_irr" in row_dict and row_dict["projected_irr"] is not None:
                    deal.projected_irr = float(row_dict["projected_irr"])
                
                if "dscr" in row_dict and row_dict["dscr"] is not None:
                    deal.dscr = float(row_dict["dscr"])
                
                if "tags" in row_dict and row_dict["tags"] is not None:
                    deal.tags = row_dict["tags"]
                
                db.add(deal)
                imported_count += 1
                
                # Commit every 10 rows to avoid large transactions
                if imported_count % 10 == 0:
                    db.commit()
                    
                    # Update import status
                    bulk_import.imported_count = imported_count
                    bulk_import.error_count = error_count
                    db.commit()
            
            except Exception as e:
                logger.error(f"Error processing row {row_number}: {str(e)}")
                error_count += 1
                errors.append({
                    "row_number": row_number,
                    "error_message": str(e),
                    "row_data": row_dict
                })
        
        # Final commit
        db.commit()
        
        # Update import status
        bulk_import.status = ImportStatus.COMPLETED.value
        bulk_import.imported_count = imported_count
        bulk_import.error_count = error_count
        bulk_import.errors = json.dumps(errors) if errors else None
        bulk_import.completed_at = datetime.now(timezone.utc)
        db.commit()
        
        logger.info(f"Bulk import completed: {import_id}, imported: {imported_count}, errors: {error_count}")
    
    except Exception as e:
        logger.error(f"Error processing bulk import {import_id}: {str(e)}")
        
        # Update import status
        bulk_import.status = ImportStatus.FAILED.value
        bulk_import.errors = json.dumps([{
            "row_number": 0,
            "error_message": f"Error processing file: {str(e)}",
            "row_data": {}
        }])
        bulk_import.completed_at = datetime.now(timezone.utc)
        db.commit()


def _validate_row(row_dict: Dict[str, Any]) -> List[str]:
    """
    Validate a row of data
    
    Args:
        row_dict: Row data
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # Check required fields
    for column in REQUIRED_COLUMNS:
        if column not in row_dict or row_dict[column] is None or row_dict[column] == "":
            errors.append(f"Missing required field: {column}")
    
    # Check data types
    for column, value in row_dict.items():
        if column in COLUMN_TYPES and value is not None and value != "":
            expected_type = COLUMN_TYPES[column]
            try:
                if expected_type == float:
                    float(value)
                elif expected_type == int:
                    int(value)
                # String type doesn't need conversion
            except (ValueError, TypeError):
                errors.append(f"Invalid value for {column}: {value}. Expected {expected_type.__name__}")
    
    return errors


async def get_bulk_import_status(db: Session, import_id: str) -> Dict[str, Any]:
    """
    Get the status of a bulk import
    
    Args:
        db: Database session
        import_id: Bulk import ID
        
    Returns:
        Bulk import status
    """
    bulk_import = db.query(BulkImport).filter(BulkImport.id == import_id).first()
    if not bulk_import:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk import not found"
        )
    
    # Calculate progress percentage
    progress_percentage = 0
    if bulk_import.total_rows > 0:
        progress_percentage = round((bulk_import.imported_count + bulk_import.error_count) / bulk_import.total_rows * 100, 2)
    
    # Parse errors
    errors = []
    if bulk_import.errors:
        try:
            errors = json.loads(bulk_import.errors)
        except json.JSONDecodeError:
            errors = []
    
    return {
        "id": bulk_import.id,
        "status": bulk_import.status,
        "total_rows": bulk_import.total_rows,
        "imported_count": bulk_import.imported_count,
        "error_count": bulk_import.error_count,
        "progress_percentage": progress_percentage,
        "errors": errors,
        "created_at": bulk_import.created_at,
        "completed_at": bulk_import.completed_at
    }


async def get_bulk_import_error_report(db: Session, import_id: str) -> List[Dict[str, Any]]:
    """
    Get the error report for a bulk import
    
    Args:
        db: Database session
        import_id: Bulk import ID
        
    Returns:
        List of errors
    """
    bulk_import = db.query(BulkImport).filter(BulkImport.id == import_id).first()
    if not bulk_import:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bulk import not found"
        )
    
    if not bulk_import.errors:
        return []
    
    try:
        errors = json.loads(bulk_import.errors)
        return errors
    except json.JSONDecodeError:
        return []
