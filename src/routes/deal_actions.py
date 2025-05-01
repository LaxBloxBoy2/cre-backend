from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from routers.deal_action_router import (
    log_call,
    log_email,
    create_proposal,
    schedule_meeting
)

router = APIRouter(
    prefix="/api",
    tags=["deal actions"],
    responses={404: {"description": "Not found"}},
)
