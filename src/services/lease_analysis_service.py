import os
import uuid
import json
import requests
import tempfile
import shutil
from typing import Dict, Any, List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ..models.upload import UploadedFile
from ..models.lease_analysis import LeaseAnalysis
from ..models.deal import Deal
from ..models.user import User
from ..schemas.lease_schema import UploadedFileCreate, LeaseAnalysisCreate, LeaseAnalysisBase
from ..notification_service import create_document_upload_notification
from ..activity_log_service import log_action
from ..utils.file_utils import validate_file_size, validate_file_type, get_safe_upload_path, save_file

# Import text extraction libraries
try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import docx
    PYTHON_DOCX_AVAILABLE = True
except ImportError:
    PYTHON_DOCX_AVAILABLE = False

# Upload directory is now managed by file_utils

async def save_uploaded_file(
    file: UploadFile,
    deal_id: str,
    user_id: str,
    db: Session
) -> Tuple[UploadedFile, str]:
    """
    Save an uploaded file to the filesystem and database

    Args:
        file: Uploaded file
        deal_id: Deal ID
        user_id: User ID
        db: Database session

    Returns:
        Tuple of (UploadedFile object, extracted text)
    """
    # Validate file size
    validate_file_size(file)

    # Validate file type and get extension
    file_extension = validate_file_type(file)

    # Get a safe path to save the file
    original_filename = file.filename or "document"
    file_path, relative_path = get_safe_upload_path(deal_id, original_filename, file_extension)

    # Save the file to the filesystem
    save_file(file, file_path)

    # Extract text from the file
    extracted_text = await extract_text_from_file(file_path, f".{file_extension}")

    # Create a database record for the uploaded file
    file_id = str(uuid.uuid4())
    db_file = UploadedFile(
        id=file_id,
        deal_id=deal_id,
        user_id=user_id,
        filename=original_filename,
        file_path=file_path,
        file_type=file_extension
    )

    # Add the file to the database
    db.add(db_file)
    db.commit()
    db.refresh(db_file)

    # Get the deal to check the organization ID
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if deal and deal.org_id:
        # Create notifications for managers and owners
        try:
            create_document_upload_notification(
                db=db,
                deal_id=deal_id,
                actor_id=user_id,
                document_type="lease"
            )
        except ValueError:
            # Ignore errors in notification creation
            pass

        # Log the action
        try:
            # Get the user's name
            user = db.query(User).filter(User.id == user_id).first()
            user_name = user.name if user else "Unknown"

            log_action(
                db=db,
                user_id=user_id,
                org_id=deal.org_id,
                action="uploaded_file",
                message=f"{user_name} uploaded a lease file for {deal.project_name}.",
                deal_id=deal_id
            )
        except ValueError:
            # Ignore errors in activity logging
            pass

    return db_file, extracted_text

async def extract_text_from_file(file_path: str, file_extension: str) -> str:
    """
    Extract text from a file

    Args:
        file_path: Path to the file
        file_extension: File extension

    Returns:
        Extracted text
    """
    if file_extension.lower() == ".pdf":
        return await extract_text_from_pdf(file_path)
    elif file_extension.lower() == ".docx":
        return await extract_text_from_docx(file_path)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type"
        )

async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file

    Args:
        file_path: Path to the PDF file

    Returns:
        Extracted text
    """
    if not PYMUPDF_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyMuPDF is not installed"
        )

    try:
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text from PDF: {str(e)}"
        )

async def extract_text_from_docx(file_path: str) -> str:
    """
    Extract text from a DOCX file

    Args:
        file_path: Path to the DOCX file

    Returns:
        Extracted text
    """
    if not PYTHON_DOCX_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="python-docx is not installed"
        )

    try:
        doc = docx.Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text from DOCX: {str(e)}"
        )

async def analyze_lease_text(
    text: str,
    file_id: str,
    deal_id: str,
    db: Session
) -> LeaseAnalysis:
    """
    Analyze lease text using DeepSeek model via Fireworks API

    Args:
        text: Lease text
        file_id: File ID
        deal_id: Deal ID
        db: Database session

    Returns:
        LeaseAnalysis object
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        if use_fallback:
            analysis_data = _get_fallback_analysis(text)
        else:
            # Get Fireworks API key
            fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
            if not fireworks_api_key:
                analysis_data = _get_fallback_analysis(text)
            else:
                # Create system message with prompt
                system_message = """You are a commercial real estate lease analysis expert. Analyze the lease text provided and extract key information."""

                user_message = f"""Analyze the following lease. Return:

Base rent
Lease term
Escalations (annual rent increases)
Tenant name
Renewal options
Break clauses
Red flags (e.g. taxes, early term, weak rent escalations)
Summary (a concise 1-2 sentence summary of the key lease terms)

Respond in valid JSON.

Here is the lease text:
{text[:10000]}  # Limit text to 10,000 characters to avoid token limits
"""

                # Format messages for the API
                messages = [
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ]

                # Send request to Fireworks API
                headers = {
                    "Authorization": f"Bearer {fireworks_api_key}",
                    "Content-Type": "application/json"
                }

                data = {
                    "model": "accounts/fireworks/models/deepseek-coder-6.7b",
                    "messages": messages,
                    "max_tokens": 1000,
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"}
                }

                response = requests.post(
                    "https://api.fireworks.ai/inference/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=60
                )

                # Check if the request was successful
                response.raise_for_status()

                # Extract the assistant's response
                response_json = response.json()
                reply = response_json["choices"][0]["message"]["content"]

                # Parse the JSON response
                analysis_data = json.loads(reply)

        # Create a database record for the lease analysis
        analysis_id = str(uuid.uuid4())
        db_analysis = LeaseAnalysis(
            id=analysis_id,
            file_id=file_id,
            deal_id=deal_id,
            base_rent=analysis_data.get("base_rent"),
            lease_term=analysis_data.get("lease_term"),
            escalations=analysis_data.get("escalations"),
            tenant_name=analysis_data.get("tenant_name"),
            renewals=json.dumps(analysis_data.get("renewals", [])),
            break_clauses=json.dumps(analysis_data.get("break_clauses", [])),
            red_flags=json.dumps(analysis_data.get("red_flags", [])),
            summary=analysis_data.get("summary"),
            raw_text=text
        )

        # Add the analysis to the database
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        # Log the action
        try:
            # Get the deal
            deal = db.query(Deal).filter(Deal.id == deal_id).first()
            if deal:
                # Get the user's name
                user = db.query(User).filter(User.id == deal.user_id).first()
                user_name = user.name if user else "Unknown"

                log_action(
                    db=db,
                    user_id=deal.user_id,
                    org_id=deal.org_id,
                    action="analyzed_lease",
                    message=f"{user_name} analyzed a lease for {deal.project_name}.",
                    deal_id=deal_id
                )
        except ValueError:
            # Ignore errors in activity logging
            pass

        return db_analysis

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing lease: {str(e)}"
        )

def _get_fallback_analysis(text: str) -> Dict[str, Any]:
    """
    Get a fallback analysis when the AI API is unavailable

    Args:
        text: Lease text

    Returns:
        Fallback analysis
    """
    # Simple keyword-based analysis
    base_rent = "Unknown"
    lease_term = "Unknown"
    escalations = "Unknown"
    tenant_name = "Unknown"
    renewals = []
    break_clauses = []
    red_flags = []
    summary = "This is a commercial lease agreement with limited details extracted."

    # Look for base rent
    if "base rent" in text.lower():
        # Find the sentence containing "base rent"
        sentences = text.split(".")
        for sentence in sentences:
            if "base rent" in sentence.lower():
                base_rent = sentence.strip()
                break

    # Look for lease term
    if "term" in text.lower():
        # Find the sentence containing "term"
        sentences = text.split(".")
        for sentence in sentences:
            if "term" in sentence.lower() and "year" in sentence.lower():
                lease_term = sentence.strip()
                break

    # Look for escalations
    if "escalation" in text.lower() or "increase" in text.lower():
        # Find the sentence containing "escalation" or "increase"
        sentences = text.split(".")
        for sentence in sentences:
            if "escalation" in sentence.lower() or "increase" in sentence.lower():
                escalations = sentence.strip()
                break

    # Look for tenant name
    if "tenant" in text.lower() or "lessee" in text.lower():
        # Find the sentence containing "tenant" or "lessee"
        sentences = text.split(".")
        for sentence in sentences:
            if ("tenant" in sentence.lower() or "lessee" in sentence.lower()) and "name" in sentence.lower():
                tenant_name = sentence.strip()
                break

    # Look for renewals
    if "renewal" in text.lower() or "option" in text.lower():
        # Find the sentence containing "renewal" or "option"
        sentences = text.split(".")
        for sentence in sentences:
            if "renewal" in sentence.lower() or "option" in sentence.lower():
                renewals.append(sentence.strip())

    # Look for break clauses
    if "termination" in text.lower() or "break" in text.lower():
        # Find the sentence containing "termination" or "break"
        sentences = text.split(".")
        for sentence in sentences:
            if "termination" in sentence.lower() or "break" in sentence.lower():
                break_clauses.append(sentence.strip())

    # Look for red flags
    red_flag_keywords = ["tax", "taxes", "termination", "early", "escalation"]
    sentences = text.split(".")
    for sentence in sentences:
        for keyword in red_flag_keywords:
            if keyword in sentence.lower():
                red_flags.append(sentence.strip())
                break

    # Generate a summary
    if base_rent != "Unknown" and lease_term != "Unknown":
        summary = f"Commercial lease with base rent of {base_rent} for a term of {lease_term}."

    return {
        "base_rent": base_rent,
        "lease_term": lease_term,
        "escalations": escalations,
        "tenant_name": tenant_name,
        "renewals": renewals,
        "break_clauses": break_clauses,
        "red_flags": red_flags,
        "summary": summary
    }

def get_lease_analysis(db: Session, deal_id: str) -> Optional[LeaseAnalysis]:
    """
    Get the lease analysis for a deal

    Args:
        db: Database session
        deal_id: Deal ID

    Returns:
        LeaseAnalysis object or None if not found
    """
    return db.query(LeaseAnalysis).filter(LeaseAnalysis.deal_id == deal_id).first()

def format_lease_analysis(analysis: LeaseAnalysis) -> LeaseAnalysisBase:
    """
    Format a lease analysis for the API response

    Args:
        analysis: LeaseAnalysis object

    Returns:
        Formatted lease analysis
    """
    return LeaseAnalysisBase(
        base_rent=analysis.base_rent,
        lease_term=analysis.lease_term,
        escalations=analysis.escalations,
        tenant_name=analysis.tenant_name,
        renewals=json.loads(analysis.renewals) if analysis.renewals else None,
        break_clauses=json.loads(analysis.break_clauses) if analysis.break_clauses else None,
        red_flags=json.loads(analysis.red_flags) if analysis.red_flags else None,
        summary=analysis.summary
    )
