from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.waterfall_schema import (
    PromoteStructure,
    PromoteStructureCreate,
    WaterfallCalculationInput,
    WaterfallCalculationResult
)
from ..services import waterfall_service
from ..schemas.user_schema import User
from ..services.auth_service_db import get_current_active_user

router = APIRouter()


@router.post("/deals/{deal_id}/waterfall", response_model=PromoteStructure, status_code=status.HTTP_201_CREATED)
def create_promote_structure(
    deal_id: str,
    structure: PromoteStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new promote structure with waterfall tiers"""
    try:
        return waterfall_service.create_promote_structure(db, deal_id, structure)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create promote structure: {str(e)}"
        )


@router.get("/deals/{deal_id}/waterfall", response_model=List[PromoteStructure])
def get_promote_structures(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all promote structures for a deal"""
    return waterfall_service.get_promote_structures(db, deal_id)


@router.get("/deals/{deal_id}/waterfall/{structure_id}", response_model=PromoteStructure)
def get_promote_structure(
    deal_id: str,
    structure_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific promote structure by ID"""
    structure = waterfall_service.get_promote_structure(db, structure_id)
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Promote structure with ID {structure_id} not found"
        )
    return structure


@router.delete("/deals/{deal_id}/waterfall/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_promote_structure(
    deal_id: str,
    structure_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a promote structure"""
    success = waterfall_service.delete_promote_structure(db, structure_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Promote structure with ID {structure_id} not found"
        )


@router.post("/deals/{deal_id}/waterfall/calc", response_model=WaterfallCalculationResult)
def calculate_waterfall(
    deal_id: str,
    input_data: WaterfallCalculationInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Calculate waterfall distributions based on the promote structure"""
    try:
        return waterfall_service.calculate_waterfall(db, input_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to calculate waterfall: {str(e)}"
        )
