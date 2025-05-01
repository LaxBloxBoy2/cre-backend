import os
import uuid
import json
import requests
import shutil
from typing import List, Optional, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ..models.document import Document
from ..models.deal import Deal
from ..models.user import User
from ..schemas.document_schema import DocumentCreate, Document as DocumentSchema
from ..activity_log_service import log_action
from ..utils.file_utils import validate_file_size, validate_file_type, get_safe_upload_path, save_file
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Define allowed document types
DOCUMENT_TYPES = ["LOI", "Pro Forma", "Lease", "Offering Memorandum", "Purchase Agreement", "Other"]

# Create uploads directory for documents if it doesn't exist
DOCUMENTS_DIR = os.path.join("uploads", "documents")
os.makedirs(DOCUMENTS_DIR, exist_ok=True)

async def upload_document(
    db: Session,
    deal_id: str,
    user_id: str,
    file: UploadFile,
    doc_type: str,
    note: Optional[str] = None
) -> Document:
    """
    Upload a document for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        file: Uploaded file
        doc_type: Document type
        note: Optional note

    Returns:
        Document object

    Raises:
        HTTPException: If there's an error uploading the document
    """
    try:
        # Validate document type
        if doc_type not in DOCUMENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid document type. Allowed types: {', '.join(DOCUMENT_TYPES)}"
            )

        # Validate file size
        validate_file_size(file)

        # Validate file type and get extension
        file_extension = validate_file_type(file)

        # Get a safe path to save the file
        original_filename = file.filename or "document"
        file_path, relative_path = get_safe_upload_path(deal_id, original_filename, file_extension)

        # Save the file to the filesystem
        save_file(file, file_path)

        # Create a database record for the document
        document_id = str(uuid.uuid4())
        document = Document(
            id=document_id,
            deal_id=deal_id,
            user_id=user_id,
            name=original_filename,
            doc_type=doc_type,
            note=note,
            file_path=file_path,
            file_type=file_extension
        )

        # Add document to database
        db.add(document)
        db.commit()
        db.refresh(document)

        # Generate AI summary for PDF/DOCX files
        if file_extension.lower() in ["pdf", "docx"]:
            try:
                # Extract text from the file
                from ..lease_analysis_service import extract_text_from_file
                extracted_text = await extract_text_from_file(file_path, f".{file_extension}")

                # Generate AI summary
                summary = await generate_document_summary(extracted_text, doc_type)

                # Update document with AI summary
                document.ai_summary = summary
                db.commit()
                db.refresh(document)
            except Exception as e:
                logger.warning(f"Error generating AI summary for document {document_id}: {str(e)}")
                # Continue without AI summary

        # Log the action
        try:
            log_action(
                db=db,
                user_id=user_id,
                org_id=get_deal_org_id(db, deal_id),
                action="upload_document",
                message=f"Document uploaded: {original_filename} ({doc_type})",
                deal_id=deal_id
            )
        except ValueError:
            # Ignore errors in activity logging
            pass

        return document

    except HTTPException:
        # Re-raise HTTP exceptions
        raise

    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )

def get_documents(
    db: Session,
    deal_id: str,
    skip: int = 0,
    limit: int = 100,
    doc_type: Optional[str] = None
) -> Tuple[List[Document], int]:
    """
    Get documents for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        skip: Number of documents to skip
        limit: Maximum number of documents to return
        doc_type: Filter by document type

    Returns:
        Tuple of (list of documents, total count)
    """
    # Create query
    query = db.query(Document).filter(Document.deal_id == deal_id)

    # Filter by document type if provided
    if doc_type:
        query = query.filter(Document.doc_type == doc_type)

    # Get total count
    total = query.count()

    # Apply pagination
    documents = query.order_by(Document.upload_timestamp.desc()).offset(skip).limit(limit).all()

    return documents, total

def get_document(db: Session, document_id: str) -> Optional[Document]:
    """
    Get a document by ID

    Args:
        db: Database session
        document_id: Document ID

    Returns:
        Document object or None if not found
    """
    return db.query(Document).filter(Document.id == document_id).first()

def delete_document(db: Session, document_id: str, user_id: str) -> bool:
    """
    Delete a document

    Args:
        db: Database session
        document_id: Document ID
        user_id: User ID

    Returns:
        True if the document was deleted, False otherwise

    Raises:
        HTTPException: If there's an error deleting the document
    """
    # Get the document
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )

    # Get the deal
    deal = db.query(Deal).filter(Deal.id == document.deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Delete the file from the filesystem
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except Exception as e:
        logger.warning(f"Error deleting document file: {str(e)}")

    # Delete the document from the database
    db.delete(document)
    db.commit()

    # Log the action
    try:
        log_action(
            db=db,
            user_id=user_id,
            org_id=deal.org_id,
            action="delete_document",
            message=f"Document deleted: {document.name} ({document.doc_type})",
            deal_id=document.deal_id
        )
    except ValueError:
        # Ignore errors in activity logging
        pass

    return True

def get_deal_org_id(db: Session, deal_id: str) -> Optional[str]:
    """
    Get the organization ID for a deal

    Args:
        db: Database session
        deal_id: Deal ID

    Returns:
        Organization ID or None if not found
    """
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    return deal.org_id if deal else None

def enrich_document_with_user_info(db: Session, document: Document) -> DocumentSchema:
    """
    Enrich a document with user information

    Args:
        db: Database session
        document: Document object

    Returns:
        Document schema with user information
    """
    # Get the user
    user = db.query(User).filter(User.id == document.user_id).first()

    # Create document schema
    document_schema = DocumentSchema.model_validate(document)

    # Add user information
    document_schema.uploaded_by_name = user.name if user else None

    return document_schema

async def generate_document_summary(text: str, doc_type: str) -> str:
    """
    Generate a summary of a document using Fireworks API

    Args:
        text: Document text
        doc_type: Document type

    Returns:
        Document summary
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        if use_fallback:
            return f"AI summary not available. This is a {doc_type} document."

        # Call the Fireworks API
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            return f"AI summary not available. This is a {doc_type} document."

        # Create system message
        system_message = f"""You are a commercial real estate document analyzer.
        Your task is to provide a concise summary of a {doc_type} document."""

        # Create user message
        user_message = f"""Analyze the following {doc_type} document and provide a concise summary (max 200 words):

{text[:5000]}  # Limit text to 5000 characters to avoid token limits

Focus on key information such as:
- Main parties involved
- Key terms and conditions
- Financial details
- Important dates
- Any unusual or noteworthy clauses

Provide a professional, factual summary that highlights the most important aspects of the document."""

        # Call the Fireworks API
        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "accounts/fireworks/models/llama-v3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 300,
            "temperature": 0.3
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
        summary = response_json["choices"][0]["message"]["content"]

        return summary

    except Exception as e:
        logger.error(f"Error generating document summary: {str(e)}")
        return f"AI summary not available. This is a {doc_type} document."

async def scan_document_for_red_flags(text: str, doc_type: str) -> List[Dict]:
    """
    Scan a document for red flag clauses using Fireworks API

    Args:
        text: Document text
        doc_type: Document type

    Returns:
        List of red flags with text, risk summary, and severity
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

        if use_fallback:
            # Return a sample red flag for testing
            return [
                {
                    "text": "Tenant may terminate this lease with 30 days notice without penalty.",
                    "risk_summary": "Early termination clause could reduce cash flow predictability.",
                    "severity": "red"
                },
                {
                    "text": "Landlord is responsible for all maintenance and repairs, including those caused by tenant.",
                    "risk_summary": "Excessive landlord obligations could increase operating costs.",
                    "severity": "yellow"
                }
            ]

        # Call the Fireworks API
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            logger.error("Fireworks API key not found")
            return []

        # Create system message
        system_message = """You are a commercial real estate document analyzer specializing in risk assessment.
        Your task is to identify clauses that could shift financial risk, create cash flow uncertainty, or negatively impact valuation.

        For each identified clause, you will provide:
        1. The exact text of the clause
        2. A brief explanation of the risk (1-2 sentences)
        3. A severity rating (red = critical risk, yellow = moderate risk)

        Format your response as a JSON array of objects with the following structure:
        [
          {
            "text": "Clause text here...",
            "risk_summary": "Explanation of why this is a risk.",
            "severity": "red" or "yellow"
          },
          ...
        ]

        Focus on issues like:
        - Onerous termination rights
        - Yield-maintenance penalties
        - Broad carve-outs
        - Excessive landlord obligations
        - Hidden escalation clauses
        - Unusual tenant rights
        - Restrictive covenants
        - Unusual force majeure provisions
        - Unfavorable renewal terms
        - Unusual assignment/subletting restrictions
        """

        # Create user message
        user_message = f"""Analyze this {doc_type} document and list clauses that could shift financial risk, cash flow uncertainty, or create valuation downside for the property:

{text[:10000]}  # Limit text to 10000 characters to avoid token limits

        Return your analysis as a JSON array of objects with the structure described in the system message.
        """

        # Call the Fireworks API
        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": "accounts/fireworks/models/llama-v3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 1500,
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

        # Extract the red flags from the response
        response_json = response.json()
        response_text = response_json["choices"][0]["message"]["content"].strip()

        # Parse the JSON response
        try:
            # The response might be wrapped in a JSON object with a key
            parsed_response = json.loads(response_text)

            # Check if the response is a dictionary with a key or a direct list
            if isinstance(parsed_response, dict):
                # Try to find a key that contains a list
                for key, value in parsed_response.items():
                    if isinstance(value, list) and len(value) > 0:
                        red_flags = value
                        break
                else:
                    # If no list found, use an empty list
                    red_flags = []
            elif isinstance(parsed_response, list):
                # If the response is already a list, use it directly
                red_flags = parsed_response
            else:
                # If the response is neither a dict nor a list, use an empty list
                red_flags = []

            # Validate each red flag
            validated_red_flags = []
            for flag in red_flags:
                if isinstance(flag, dict) and "text" in flag and "risk_summary" in flag and "severity" in flag:
                    # Ensure severity is either "red" or "yellow"
                    if flag["severity"] not in ["red", "yellow"]:
                        flag["severity"] = "yellow"  # Default to yellow if invalid
                    validated_red_flags.append(flag)

            return validated_red_flags
        except json.JSONDecodeError:
            logger.error(f"Error parsing JSON response: {response_text}")
            return []

    except Exception as e:
        logger.error(f"Error scanning document for red flags: {str(e)}")
        return []
