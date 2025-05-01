from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Path, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.document_schema import Document, DocumentList, DocumentSummaryResponse, RedFlagScanResponse
from ..services.auth_service_db import get_current_active_user
from ..services.document_service import (
    upload_document,
    get_documents,
    get_document,
    delete_document,
    enrich_document_with_user_info,
    scan_document_for_red_flags
)
from ..services.security_service import validate_deal_access, can_edit_deal
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

@router.post("/deals/{deal_id}/documents", response_model=Document, tags=["Documents"])
async def upload_document_route(
    deal_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    note: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document for a deal

    This endpoint allows users to upload documents related to a deal, such as LOIs, Pro Formas, Leases, etc.
    The document will be stored in the file system and a record will be created in the database.
    For PDF and DOCX files, an AI-powered summary will be generated.

    Args:
        deal_id: The ID of the deal
        file: The document file to upload
        doc_type: The type of document (LOI, Pro Forma, Lease, Offering Memorandum, Purchase Agreement, Other)
        note: Optional note about the document
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Document object with metadata

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)

    # Check if user can edit the deal
    if not can_edit_deal(current_user, deal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload documents for this deal"
        )

    # Upload the document
    document = await upload_document(
        db=db,
        deal_id=deal_id,
        user_id=current_user.id,
        file=file,
        doc_type=doc_type,
        note=note
    )

    # Enrich document with user information
    return enrich_document_with_user_info(db, document)

@router.get("/deals/{deal_id}/documents", response_model=DocumentList, tags=["Documents"])
async def get_documents_route(
    deal_id: str,
    skip: int = Query(0, description="Number of documents to skip"),
    limit: int = Query(100, description="Maximum number of documents to return"),
    doc_type: Optional[str] = Query(None, description="Filter by document type"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get documents for a deal

    This endpoint returns a list of documents for a deal, with optional filtering by document type.

    Args:
        deal_id: The ID of the deal
        skip: Number of documents to skip (for pagination)
        limit: Maximum number of documents to return (for pagination)
        doc_type: Filter by document type
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of documents

    Raises:
        HTTPException: If the deal is not found or the user is not authorized
    """
    # Validate deal access
    validate_deal_access(db, deal_id, current_user)

    # Get documents
    documents, total = get_documents(
        db=db,
        deal_id=deal_id,
        skip=skip,
        limit=limit,
        doc_type=doc_type
    )

    # Enrich documents with user information
    enriched_documents = [enrich_document_with_user_info(db, doc) for doc in documents]

    return DocumentList(documents=enriched_documents, total=total)

@router.get("/documents/{document_id}", tags=["Documents"])
async def download_document_route(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Download a document

    This endpoint returns the document file for download.

    Args:
        document_id: The ID of the document
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Document file

    Raises:
        HTTPException: If the document is not found or the user is not authorized
    """
    # Get the document
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Validate deal access
    validate_deal_access(db, document.deal_id, current_user)

    # Check if the file exists
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found"
        )

    # Return the file
    return FileResponse(
        path=document.file_path,
        filename=document.name,
        media_type=f"application/{document.file_type}"
    )

@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Documents"])
async def delete_document_route(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document

    This endpoint deletes a document from the database and the file system.

    Args:
        document_id: The ID of the document
        current_user: The current user (from the token)
        db: Database session

    Returns:
        None

    Raises:
        HTTPException: If the document is not found or the user is not authorized
    """
    # Get the document
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Validate deal access
    deal = validate_deal_access(db, document.deal_id, current_user)

    # Check if user can edit the deal
    if not can_edit_deal(current_user, deal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete documents for this deal"
        )

    # Delete the document
    delete_document(db, document_id, current_user.id)

    return None

@router.get("/documents/{document_id}/summary", response_model=DocumentSummaryResponse, tags=["Documents"])
async def get_document_summary_route(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the AI-generated summary of a document

    This endpoint returns the AI-generated summary of a document.

    Args:
        document_id: The ID of the document
        current_user: The current user (from the token)
        db: Database session

    Returns:
        Document summary

    Raises:
        HTTPException: If the document is not found or the user is not authorized
    """
    # Get the document
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Validate deal access
    validate_deal_access(db, document.deal_id, current_user)

    # Check if the document has a summary
    if not document.ai_summary:
        return DocumentSummaryResponse(
            id=document.id,
            summary=f"No AI summary available for this {document.doc_type} document.",
            status="not_available"
        )

    return DocumentSummaryResponse(
        id=document.id,
        summary=document.ai_summary,
        status="success"
    )

@router.post("/documents/{document_id}/redflag-scan", response_model=RedFlagScanResponse, tags=["Documents"])
async def scan_document_for_red_flags_route(
    document_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Scan a document for red flag clauses

    This endpoint scans a document for clauses that could shift financial risk,
    cash flow uncertainty, or create valuation downside for the property.

    Args:
        document_id: The ID of the document
        current_user: The current user (from the token)
        db: Database session

    Returns:
        List of red flags with text, risk summary, and severity

    Raises:
        HTTPException: If the document is not found or the user is not authorized
    """
    # Get the document
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Validate deal access
    validate_deal_access(db, document.deal_id, current_user)

    # Check if the document already has red flags
    if document.red_flags:
        try:
            # Parse the stored red flags
            red_flags = json.loads(document.red_flags)
            return RedFlagScanResponse(
                id=document.id,
                red_flags=red_flags,
                status="success"
            )
        except json.JSONDecodeError:
            # If there's an error parsing the stored red flags, continue with a new scan
            pass

    # Extract text from the file
    try:
        from ..services.lease_analysis_service import extract_text_from_file
        file_extension = document.file_type.lower()
        extracted_text = await extract_text_from_file(document.file_path, f".{file_extension}")

        # Scan the document for red flags
        red_flags = await scan_document_for_red_flags(extracted_text, document.doc_type)

        # Save the red flags to the document
        document.red_flags = json.dumps(red_flags)
        db.commit()

        return RedFlagScanResponse(
            id=document.id,
            red_flags=red_flags,
            status="success"
        )
    except Exception as e:
        logger.error(f"Error scanning document for red flags: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error scanning document for red flags: {str(e)}"
        )
