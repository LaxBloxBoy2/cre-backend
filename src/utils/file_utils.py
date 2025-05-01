import os
import uuid
import shutil
import mimetypes
from typing import List, Tuple, Optional, Set
from fastapi import UploadFile, HTTPException, status
from werkzeug.utils import secure_filename
from pathlib import Path

# Load environment variables
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
ALLOWED_UPLOAD_TYPES = set(os.getenv("ALLOWED_UPLOAD_TYPES", "pdf,docx").lower().split(","))
UPLOAD_BASE_DIR = os.getenv("UPLOAD_DIR", "./uploads/")

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_BASE_DIR, exist_ok=True)

# Define allowed MIME types
ALLOWED_MIME_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

def validate_file_size(file: UploadFile) -> None:
    """
    Validate that the file size is within the allowed limit
    
    Args:
        file: The uploaded file
        
    Raises:
        HTTPException: If the file is too large
    """
    # Get the file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file position
    
    # Convert MB to bytes
    max_size_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB} MB."
        )

def validate_file_type(file: UploadFile) -> str:
    """
    Validate that the file type is allowed
    
    Args:
        file: The uploaded file
        
    Returns:
        The validated file extension (without dot)
        
    Raises:
        HTTPException: If the file type is not allowed
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required"
        )
    
    # Get the file extension
    file_extension = os.path.splitext(file.filename)[1].lower().lstrip(".")
    
    # Check if the extension is allowed
    if file_extension not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed types: {', '.join(ALLOWED_UPLOAD_TYPES)}"
        )
    
    # Verify the content type
    content_type = file.content_type
    expected_content_type = ALLOWED_MIME_TYPES.get(file_extension)
    
    if not content_type or not expected_content_type or content_type != expected_content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid content type. Expected {expected_content_type} for .{file_extension} files."
        )
    
    return file_extension

def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent directory traversal and other attacks
    
    Args:
        filename: The original filename
        
    Returns:
        A sanitized filename
    """
    # Use werkzeug's secure_filename to sanitize the filename
    sanitized = secure_filename(filename)
    
    # If the filename is empty after sanitization, use a default name
    if not sanitized:
        sanitized = "document"
    
    return sanitized

def get_safe_upload_path(deal_id: str, filename: str, file_extension: str) -> Tuple[str, str]:
    """
    Get a safe path to save an uploaded file
    
    Args:
        deal_id: The ID of the deal
        filename: The original filename
        file_extension: The file extension
        
    Returns:
        Tuple of (full file path, relative path)
    """
    # Sanitize the filename
    sanitized_filename = sanitize_filename(filename)
    
    # Generate a unique filename with UUID
    unique_id = str(uuid.uuid4())
    unique_filename = f"{unique_id}_{sanitized_filename}"
    
    # Ensure the file has the correct extension
    if not unique_filename.lower().endswith(f".{file_extension}"):
        unique_filename = f"{unique_filename}.{file_extension}"
    
    # Create the deal-specific directory
    deal_dir = os.path.join(UPLOAD_BASE_DIR, deal_id)
    os.makedirs(deal_dir, exist_ok=True)
    
    # Get the full file path
    file_path = os.path.join(deal_dir, unique_filename)
    
    # Get the relative path (for storage in the database)
    relative_path = os.path.join(deal_id, unique_filename)
    
    return file_path, relative_path

def save_file(file: UploadFile, file_path: str) -> None:
    """
    Save an uploaded file to the filesystem
    
    Args:
        file: The uploaded file
        file_path: The path to save the file to
        
    Raises:
        HTTPException: If there's an error saving the file
    """
    try:
        # Reset file position
        file.file.seek(0)
        
        # Save the file
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )
