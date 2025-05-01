from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.scenario_schema import ScenarioCreate, ScenarioResponse, ScenarioList
from ..services.auth_service_db import get_current_active_user
from ..services.scenario_service import create_scenario
from ..services.security_service import validate_deal_access, can_edit_deal
from ..models.deal_scenario import DealScenario
from ..utils.limiter import limiter

router = APIRouter()

@router.post("/deals/{deal_id}/scenarios", response_model=ScenarioResponse, tags=["Scenarios"])
@limiter.limit("10/minute")
async def create_scenario_route(
    request: Request,
    deal_id: str,
    scenario: ScenarioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new scenario for a deal

    Args:
        deal_id: Deal ID
        scenario: Scenario data
        current_user: Current user
        db: Database session

    Returns:
        Created scenario
    """
    # Validate deal access and check if user can edit
    deal = validate_deal_access(db, deal_id, current_user)
    if not can_edit_deal(db, deal, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to create scenarios for this deal"
        )

    # Create scenario
    result = create_scenario(db, deal_id, scenario, current_user.id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create scenario"
        )

    return result

@router.get("/deals/{deal_id}/scenarios", response_model=ScenarioList, tags=["Scenarios"])
async def get_scenarios_route(
    deal_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all scenarios for a deal

    Args:
        deal_id: Deal ID
        current_user: Current user
        db: Database session

    Returns:
        List of scenarios
    """
    try:
        # Validate deal access
        deal = validate_deal_access(db, deal_id, current_user)

        # Get scenarios
        scenarios = db.query(DealScenario).filter(DealScenario.deal_id == deal_id).all()

        return {
            "scenarios": scenarios,
            "total": len(scenarios)
        }
    except Exception as e:
        # Log the error
        print(f"Error getting scenarios: {str(e)}")

        # Return empty list instead of raising an error
        return {
            "scenarios": [],
            "total": 0
        }

@router.delete("/deals/{deal_id}/scenarios/{scenario_id}", tags=["Scenarios"])
async def delete_scenario_route(
    deal_id: str,
    scenario_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a scenario

    Args:
        deal_id: Deal ID
        scenario_id: Scenario ID
        current_user: Current user
        db: Database session

    Returns:
        Success message
    """
    # Validate deal access and check if user can edit
    deal = validate_deal_access(db, deal_id, current_user)
    if not can_edit_deal(db, deal, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to delete scenarios for this deal"
        )

    # Get scenario
    scenario = db.query(DealScenario).filter(
        DealScenario.id == scenario_id,
        DealScenario.deal_id == deal_id
    ).first()

    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found"
        )

    # Delete scenario
    db.delete(scenario)
    db.commit()

    return {"message": "Scenario deleted successfully"}
