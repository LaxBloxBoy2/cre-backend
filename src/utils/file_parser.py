import os
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from fastapi import UploadFile
import tempfile
import shutil

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Required columns for deal import
REQUIRED_COLUMNS = [
    "project_name",
    "location",
    "property_type",
    "acquisition_price",
    "construction_cost",
    "square_footage",
    "projected_rent_per_sf",
    "vacancy_rate",
    "operating_expenses_per_sf",
    "exit_cap_rate"
]

# Column types for validation
COLUMN_TYPES = {
    "project_name": str,
    "location": str,
    "property_type": str,
    "acquisition_price": float,
    "construction_cost": float,
    "square_footage": float,
    "projected_rent_per_sf": float,
    "vacancy_rate": float,
    "operating_expenses_per_sf": float,
    "exit_cap_rate": float
}

async def save_uploaded_file(file: UploadFile) -> str:
    """
    Save an uploaded file to the filesystem
    
    Args:
        file: Uploaded file
        
    Returns:
        Path to the saved file
    """
    # Check file extension
    filename = file.filename
    if not filename:
        raise ValueError("Filename is required")
    
    file_extension = os.path.splitext(filename)[1].lower()
    if file_extension not in [".csv", ".xlsx"]:
        raise ValueError("Only CSV and Excel files are allowed")
    
    # Create a unique filename with timestamp
    import datetime
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    unique_filename = f"import_{timestamp}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save the file to the filesystem
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    return file_path

def parse_file(file_path: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parse a CSV or Excel file
    
    Args:
        file_path: Path to the file
        
    Returns:
        Tuple of (valid_rows, error_rows)
    """
    # Determine file type
    file_extension = os.path.splitext(file_path)[1].lower()
    
    # Read the file
    try:
        if file_extension == ".csv":
            df = pd.read_csv(file_path)
        elif file_extension == ".xlsx":
            df = pd.read_excel(file_path, engine="openpyxl")
        else:
            raise ValueError("Unsupported file type")
    except Exception as e:
        raise ValueError(f"Error reading file: {str(e)}")
    
    # Check if required columns are present
    missing_columns = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns: {', '.join(missing_columns)}")
    
    # Process rows
    valid_rows = []
    error_rows = []
    
    for index, row in df.iterrows():
        row_data = {}
        row_errors = []
        
        # Check for missing values and convert types
        for col in REQUIRED_COLUMNS:
            if pd.isna(row[col]):
                row_errors.append(f"Missing {col}")
                continue
            
            try:
                # Convert to the expected type
                if COLUMN_TYPES[col] == float:
                    row_data[col] = float(row[col])
                else:
                    row_data[col] = str(row[col])
            except (ValueError, TypeError):
                row_errors.append(f"Invalid {col} format")
        
        # Add row to valid or error list
        if row_errors:
            error_rows.append({
                "row": index + 2,  # +2 because pandas is 0-indexed and we need to account for header row
                "reason": ", ".join(row_errors)
            })
        else:
            valid_rows.append(row_data)
    
    return valid_rows, error_rows
