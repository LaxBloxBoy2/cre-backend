from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class ImportStatus(str, Enum):
    """Status of a bulk import"""
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ImportType(str, Enum):
    """Type of import file"""
    EXCEL = "excel"
    CSV = "csv"


class BulkImportCreate(BaseModel):
    """Model for creating a bulk import"""
    user_id: str
    org_id: str
    filename: str
    import_type: ImportType
    total_rows: int = 0


class ImportRowError(BaseModel):
    """Model for an error in an import row"""
    row_number: int
    error_message: str
    row_data: Dict[str, Any]


class BulkImport(BaseModel):
    """Model for a bulk import"""
    id: str
    user_id: str
    org_id: str
    filename: str
    import_type: ImportType
    status: ImportStatus
    total_rows: int
    imported_count: int = 0
    error_count: int = 0
    errors: Optional[List[ImportRowError]] = []
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BulkImportStatus(BaseModel):
    """Model for bulk import status"""
    id: str
    status: ImportStatus
    total_rows: int
    imported_count: int
    error_count: int
    progress_percentage: float
    errors: Optional[List[ImportRowError]] = []
    created_at: datetime
    completed_at: Optional[datetime] = None
