import os
import math
from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, desc
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..models.user import User
from ..models.deal import Deal
# Chat message model import
try:
    from ..models.chat_message import ChatMessage
except ImportError:
    # Define a placeholder if the model doesn't exist
    class ChatMessage:
        pass
from ..models.upload import UploadedFile
from ..models.activity_log import ActivityLog
from ..models.organization import Organization
from ..services.auth_service_db import get_current_user

router = APIRouter()

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Admin access check
def admin_or_owner_required(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Admin", "Owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin or Owner role required."
        )
    return current_user

@router.get("", response_class=HTMLResponse)
async def dashboard_home(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Dashboard home page
    """
    # Get system stats
    user_count = db.query(func.count(User.id)).scalar()
    deal_count = db.query(func.count(Deal.id)).scalar()
    upload_count = db.query(func.count(UploadedFile.id)).scalar()
    log_count = db.query(func.count(ActivityLog.id)).scalar()

    # Get recent deals
    recent_deals = db.query(Deal).order_by(desc(Deal.created_at)).limit(5).all()

    # Get recent activity logs
    recent_logs = db.query(ActivityLog).order_by(desc(ActivityLog.created_at)).limit(5).all()

    return templates.TemplateResponse(
        "dev_dashboard/home.html",
        {
            "request": request,
            "active_page": "home",
            "stats": {
                "users": user_count,
                "deals": deal_count,
                "uploads": upload_count,
                "logs": log_count
            },
            "recent_deals": recent_deals,
            "recent_logs": recent_logs
        }
    )

@router.get("/deals", response_class=HTMLResponse)
async def dashboard_deals(
    request: Request,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Dashboard deals page
    """
    # Build query
    query = db.query(Deal)

    # Apply filters
    if status:
        query = query.filter(Deal.status == status)

    # Get total count
    total_count = query.count()
    total_pages = math.ceil(total_count / page_size)

    # Get deals with pagination
    deals = query.order_by(desc(Deal.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return templates.TemplateResponse(
        "dev_dashboard/deals.html",
        {
            "request": request,
            "active_page": "deals",
            "deals": deals,
            "status": status,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_count": total_count
        }
    )

@router.get("/users", response_class=HTMLResponse)
async def dashboard_users(
    request: Request,
    role: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Dashboard users page
    """
    # Build query
    query = db.query(User)

    # Apply filters
    if role:
        query = query.filter(User.role == role)

    # Get total count
    total_count = query.count()
    total_pages = math.ceil(total_count / page_size)

    # Get users with pagination
    users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # Get deal count for each user
    for user in users:
        user.deal_count = db.query(func.count(Deal.id)).filter(Deal.user_id == user.id).scalar()

    return templates.TemplateResponse(
        "dev_dashboard/users.html",
        {
            "request": request,
            "active_page": "users",
            "users": users,
            "role": role,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_count": total_count
        }
    )

@router.get("/chat/{deal_id}", response_class=HTMLResponse)
async def dashboard_chat(
    request: Request,
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Dashboard chat page for a specific deal
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Get chat messages
    messages = db.query(ChatMessage).filter(ChatMessage.deal_id == deal_id).order_by(ChatMessage.created_at).all()

    return templates.TemplateResponse(
        "dev_dashboard/chat.html",
        {
            "request": request,
            "active_page": "deals",
            "deal": deal,
            "messages": messages
        }
    )

@router.get("/uploads", response_class=HTMLResponse)
async def dashboard_uploads(
    request: Request,
    file_type: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Dashboard uploads page
    """
    # Build query
    query = db.query(UploadedFile)

    # Apply filters
    if file_type:
        query = query.filter(UploadedFile.file_type == file_type)

    # Get total count
    total_count = query.count()
    total_pages = math.ceil(total_count / page_size)

    # Get uploads with pagination
    uploads = query.order_by(desc(UploadedFile.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return templates.TemplateResponse(
        "dev_dashboard/uploads.html",
        {
            "request": request,
            "active_page": "uploads",
            "uploads": uploads,
            "file_type": file_type,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_count": total_count
        }
    )

@router.get("/uploads/download/{upload_id}")
async def download_upload(
    upload_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Download an uploaded file
    """
    # Get the upload
    upload = db.query(UploadedFile).filter(UploadedFile.id == upload_id).first()
    if not upload or not upload.file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Check if the file exists
    if not os.path.exists(upload.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )

    # Return the file
    return FileResponse(
        path=upload.file_path,
        filename=upload.filename,
        media_type=f"application/{upload.file_type}"
    )

@router.get("/logs", response_class=HTMLResponse)
async def dashboard_logs(
    request: Request,
    action: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_or_owner_required)
):
    """
    Dashboard activity logs page
    """
    # Build query
    query = db.query(ActivityLog)

    # Apply filters
    if action:
        query = query.filter(ActivityLog.action == action)

    # Get total count
    total_count = query.count()
    total_pages = math.ceil(total_count / page_size)

    # Get logs with pagination
    logs = query.order_by(desc(ActivityLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    return templates.TemplateResponse(
        "dev_dashboard/logs.html",
        {
            "request": request,
            "active_page": "logs",
            "logs": logs,
            "action": action,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "total_count": total_count
        }
    )
