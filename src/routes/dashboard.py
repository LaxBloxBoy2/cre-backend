from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.dashboard_schema import DashboardSummary
from ..services.auth_service_db import get_current_active_user
from ..services.dashboard_service import calculate_dashboard_summary
from typing import Dict, List, Any
import random
from datetime import datetime, timedelta

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard-summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard summary for the authenticated user

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Dashboard summary
    """
    # If user is an admin, they can see all deals
    user_id = None if current_user.role == "Admin" else current_user.id

    # Calculate dashboard summary
    dashboard_summary = calculate_dashboard_summary(db, user_id=user_id)

    return dashboard_summary

@router.get("/comparison")
async def get_comparison_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get IRR market comparison data

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Comparison data with deals and market average
    """
    # Mock data for now
    return {
        "deals": [
            {"name": "Office Building A", "irr": 12.5},
            {"name": "Retail Center B", "irr": 15.2},
            {"name": "Industrial Park C", "irr": 10.8},
            {"name": "Multifamily D", "irr": 14.3},
            {"name": "Mixed Use E", "irr": 11.7}
        ],
        "market_average": 11.7
    }

@router.get("/deal-status-breakdown")
async def get_deal_status_breakdown(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get deal status breakdown

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Deal status counts
    """
    # Mock data for now
    return {
        "statuses": {
            "draft": 3,
            "in_review": 4,
            "approved": 3,
            "rejected": 1,
            "archived": 1
        }
    }

@router.get("/risk-score")
async def get_risk_score_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get risk score data

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Risk score data
    """
    # Mock data for now
    return {
        "average_score": 65,
        "high_risk_count": 2,
        "medium_risk_count": 5,
        "low_risk_count": 4,
        "deals": [
            {"id": "1", "name": "Office Building A", "risk_score": 75, "risk_level": "high"},
            {"id": "2", "name": "Retail Center B", "risk_score": 45, "risk_level": "medium"},
            {"id": "3", "name": "Industrial Park C", "risk_score": 30, "risk_level": "low"}
        ]
    }

@router.get("/deal-lifecycle")
async def get_deal_lifecycle_data(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get deal lifecycle data

    Args:
        current_user: Current user
        db: Database session

    Returns:
        Deal lifecycle data
    """
    # Mock data for now
    return {
        "stages": [
            {"name": "Acquisition", "deals_count": 3},
            {"name": "Due Diligence", "deals_count": 2},
            {"name": "Financing", "deals_count": 4},
            {"name": "Closing", "deals_count": 1},
            {"name": "Asset Management", "deals_count": 2}
        ]
    }
