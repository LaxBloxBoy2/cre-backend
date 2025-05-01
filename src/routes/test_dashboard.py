import json
import httpx
import uuid
import os
import pandas as pd
import shutil
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status, Form, File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.templating import Jinja2Templates
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List, Tuple
from ..database import get_db
from ..models import User
from ..models.deal import Deal
from ..services.auth_service_db import get_current_user
from ..utils.logging_utils import get_logger
from ..utils.file_parser import save_uploaded_file, parse_file
from ..utils.jwt_handler import create_access_token, create_refresh_token

# Get logger
logger = get_logger(__name__)

router = APIRouter(tags=["test-dashboard"])

# Mock authentication endpoint for the test dashboard
@router.post("/mock-login")
async def mock_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Mock login endpoint for the test dashboard

    This endpoint always returns a valid token regardless of the credentials provided.
    It's only for testing purposes and should not be used in production.
    """
    # Log the login attempt
    logger.info(f"Mock login attempt: {form_data.username}")

    # Create a mock user data
    user_data = {
        "id": "mock-user-id",
        "email": form_data.username,
        "name": "Mock User",
        "role": "Admin",
        "org_role": "Owner",
        "org_id": "mock-org-id"
    }

    # Generate real JWT tokens
    token_data = {"sub": user_data["email"], "role": user_data["role"]}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # Return the token
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": 1800,  # 30 minutes
        "user": user_data
    }

# Mock import deals endpoint for the test dashboard
@router.post("/mock-import")
async def mock_import_deals(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Mock import deals endpoint for the test dashboard

    This endpoint imports deals from a CSV or Excel file without requiring authentication.
    It's only for testing purposes and should not be used in production.
    """
    # Log the import attempt
    logger.info(f"Mock import attempt: {file.filename}")

    # Create mock user and organization IDs
    user_id = "mock-user-id"
    org_id = "mock-org-id"

    try:
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

        # Return the results
        return {
            "imported": len(imported_deals),
            "skipped": len(error_rows),
            "errors": error_rows
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Mock lease upload endpoint for the test dashboard
@router.post("/mock-upload-lease")
async def mock_upload_lease(
    file: UploadFile = File(...),
    deal_id: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Mock lease upload endpoint for the test dashboard

    This endpoint uploads a lease file without requiring authentication.
    It's only for testing purposes and should not be used in production.
    """
    # Log the upload attempt
    logger.info(f"Mock lease upload attempt: {file.filename} for deal {deal_id}")

    try:
        # Save the uploaded file
        file_path = await save_uploaded_file(file)

        # Return a mock lease analysis
        return {
            "success": True,
            "message": "Lease uploaded and analyzed successfully",
            "lease_analysis": {
                "id": str(uuid.uuid4()),
                "deal_id": deal_id,
                "file_name": file.filename,
                "base_rent": "$50 per square foot",
                "lease_term": "5 years",
                "renewal_options": "2 options of 5 years each",
                "break_clauses": "None",
                "red_flags": "No significant red flags found",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Mock user info endpoint for the test dashboard
@router.get("/mock-me")
async def mock_me():
    """
    Mock user info endpoint for the test dashboard

    This endpoint always returns a valid user regardless of the token provided.
    It's only for testing purposes and should not be used in production.
    """
    # Return mock user info
    return {
        "id": "mock-user-id",
        "email": "test@example.com",
        "name": "Mock User",
        "role": "Admin",
        "org_role": "Owner",
        "org_id": "mock-org-id"
    }

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Admin or Owner access check
def admin_or_owner_required(current_user: User = Depends(get_current_user)):
    """
    Check if the current user is an admin or owner

    Args:
        current_user: Current user

    Returns:
        Current user if admin or owner

    Raises:
        HTTPException: If not admin or owner
    """
    if current_user.role not in ["Admin"] and current_user.org_role not in ["Owner"]:
        logger.warning(f"Access denied to test dashboard - User: {current_user.id}, Role: {current_user.role}, Org Role: {current_user.org_role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin or Owner role required."
        )
    return current_user

@router.get("", response_class=HTMLResponse)
async def test_dashboard_home(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Test dashboard home page
    """
    # Default user and organization for the template
    user = {
        "id": "",
        "name": "",
        "email": "",
        "role": "",
        "org_role": "",
        "org_id": ""
    }

    # Default organization
    org = None

    # Get real deals from the database
    deals = db.query(Deal).all()

    # Convert deals to a list of dictionaries for the template
    deals_list = []
    for deal in deals:
        deals_list.append({
            "id": deal.id,
            "project_name": deal.project_name
        })

    return templates.TemplateResponse(
        "test_dashboard.html",
        {
            "request": request,
            "user": user,
            "org": org,
            "deals": deals_list
        }
    )

@router.post("/api-call")
async def test_api_call(
    request: Request,
    endpoint: str = Form(...),
    method: str = Form(...),
    payload: str = Form(None),
    deal_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    token: Optional[str] = Form(None)
):
    """
    Handle API calls from the test dashboard

    This is a proxy endpoint that forwards requests to the actual API endpoints
    and returns the response as JSON.

    Args:
        request: FastAPI request object
        endpoint: API endpoint to call
        method: HTTP method (GET, POST, PUT, DELETE)
        payload: JSON payload for POST/PUT requests
        deal_id: Deal ID for endpoints that require it
        file: File for upload endpoints
        token: Authentication token

    Returns:
        Response from the API endpoint
    """
    try:
        # Get the base URL
        base_url = str(request.base_url)

        # Replace placeholders in the endpoint
        if "{deal_id}" in endpoint and deal_id:
            endpoint = endpoint.replace("{deal_id}", deal_id)

        # Build the full URL
        url = f"{base_url.rstrip('/')}{endpoint}"

        # Log the API call
        logger.info(f"Test dashboard API call: {method} {url} - User: test-user")

        # Prepare headers with authentication token if provided
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        # Parse the payload if provided
        data = {}
        if payload:
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid JSON payload"}
                )

        # Make the actual API call using httpx
        async with httpx.AsyncClient() as client:
            if file and method.upper() == "POST":
                # Handle file uploads
                files = {"file": (file.filename, await file.read(), file.content_type)}
                response = await client.post(url, files=files, headers=headers)
            elif method.upper() == "GET":
                response = await client.get(url, headers=headers)
            elif method.upper() == "POST":
                response = await client.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = await client.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Unsupported method: {method}"}
                )

        # Return the response
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
        else:
            return Response(
                content=response.content,
                status_code=response.status_code,
                media_type=content_type
            )
    except Exception as e:
        logger.error(f"Error in test API call: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": f"Internal server error: {str(e)}"}
        )
