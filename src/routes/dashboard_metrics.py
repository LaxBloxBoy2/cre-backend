from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from routers.dashboard_router import (
    get_dashboard_metrics,
    get_dashboard_irr_trend,
    get_dashboard_deal_lifecycle,
    get_dashboard_risk_score,
    get_dashboard_deal_status_breakdown,
    get_dashboard_quick_actions
)

router = APIRouter(
    prefix="/api",
    tags=["dashboard metrics"],
    responses={404: {"description": "Not found"}},
)

@router.get("/dashboard-summary")
async def dashboard_summary(db: Session = Depends(get_db)):
    return get_dashboard_metrics(db=db)

@router.get("/dashboard/irr-trend")
async def dashboard_irr_trend(
    period: str = Query("6m", description="Period (3m, 6m, 1y)"),
    db: Session = Depends(get_db)
):
    return get_dashboard_irr_trend(period=period, db=db)

@router.get("/dashboard/deal-lifecycle")
async def dashboard_deal_lifecycle(db: Session = Depends(get_db)):
    return get_dashboard_deal_lifecycle(db=db)

@router.get("/dashboard/risk-score")
async def dashboard_risk_score(db: Session = Depends(get_db)):
    return get_dashboard_risk_score(db=db)

@router.get("/dashboard/deal-status-breakdown")
async def dashboard_deal_status_breakdown(db: Session = Depends(get_db)):
    return get_dashboard_deal_status_breakdown(db=db)

@router.get("/dashboard/quick-actions")
async def dashboard_quick_actions(db: Session = Depends(get_db)):
    return get_dashboard_quick_actions(db=db)
