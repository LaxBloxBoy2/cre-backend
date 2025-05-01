import uuid
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Tuple
from datetime import datetime, timezone
from fastapi import UploadFile
from ..models.deal import Deal
from ..models.user import User
from ..utils.file_parser import save_uploaded_file, parse_file
from ..activity_log_service import log_action

async def import_deals(
    db: Session,
    file: UploadFile,
    user_id: str,
    org_id: str
) -> Dict[str, Any]:
    """
    Import deals from a CSV or Excel file

    Args:
        db: Database session
        file: Uploaded file
        user_id: User ID
        org_id: Organization ID

    Returns:
        Dictionary with import results
    """
    # Save the uploaded file
    file_path = await save_uploaded_file(file)

    # Parse the file
    valid_rows, error_rows = parse_file(file_path)

    # Create deals for valid rows
    imported_deals = []
    for row in valid_rows:
        # Create a new deal
        deal = Deal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            org_id=org_id,
            project_name=row["project_name"],
            location=row["location"],
            property_type=row["property_type"],
            acquisition_price=row["acquisition_price"],
            construction_cost=row["construction_cost"],
            square_footage=row["square_footage"],
            projected_rent_per_sf=row["projected_rent_per_sf"],
            vacancy_rate=row["vacancy_rate"],
            operating_expenses_per_sf=row["operating_expenses_per_sf"],
            exit_cap_rate=row["exit_cap_rate"],
            status="Draft",
            created_at=datetime.now(timezone.utc)
        )
        imported_deals.append(deal)

    # Save all deals to the database
    if imported_deals:
        db.add_all(imported_deals)
        db.commit()

        # Log the action
        try:
            # Get the user's name
            user = db.query(User).filter(User.id == user_id).first()
            user_name = user.name if user else "Unknown"

            log_action(
                db=db,
                user_id=user_id,
                org_id=org_id,
                action="imported",
                message=f"{user_name} imported {len(imported_deals)} deals.",
                deal_id=None
            )
        except ValueError:
            # Ignore errors in activity logging
            pass

    # Return the results
    return {
        "imported": len(imported_deals),
        "skipped": len(error_rows),
        "errors": error_rows
    }

def check_user_can_import(db: Session, user_id: str) -> bool:
    """
    Check if a user can import deals

    Args:
        db: Database session
        user_id: User ID

    Returns:
        True if the user can import deals, False otherwise
    """
    # Get the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    # Check if the user is in an organization
    if not user.org_id:
        return False

    # Check if the user has the required role
    if user.org_role not in ["Owner", "Manager"]:
        return False

    return True
