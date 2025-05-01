from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Path, Query
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import json
import pandas as pd
from io import BytesIO
from ..database import get_db
from ..schemas.user_schema import User
from ..schemas.invoice_schema import Invoice, InvoiceList
from ..services.auth_service_db import get_current_active_user
from ..services.invoice_service import (
    upload_and_parse_invoice,
    get_invoices,
    get_invoice,
    update_invoice_status
)
from ..services.security_service import validate_deal_access, can_edit_deal
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

router = APIRouter()

@router.post("/invoices/upload", response_model=Invoice, tags=["Invoices"])
async def upload_invoice(
    deal_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse an invoice PDF
    
    This endpoint allows users to upload invoice PDFs, which will be automatically parsed
    using OCR to extract vendor information, invoice number, date, and line items.
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Check if user can edit the deal
    if not can_edit_deal(db, deal_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload invoices for this deal"
        )
    
    # Upload and parse invoice
    invoice = await upload_and_parse_invoice(db, deal_id, current_user.id, file)
    
    return invoice

@router.get("/invoices/{invoice_id}", response_model=Invoice, tags=["Invoices"])
async def get_invoice_route(
    invoice_id: str = Path(..., description="The ID of the invoice to get"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get an invoice by ID
    """
    invoice = await get_invoice(db, invoice_id)
    
    # Validate deal access
    deal = validate_deal_access(db, invoice.deal_id, current_user)
    
    return invoice

@router.get("/deals/{deal_id}/invoices", response_model=List[Invoice], tags=["Invoices"])
async def get_invoices_route(
    deal_id: str = Path(..., description="The ID of the deal"),
    skip: int = Query(0, description="Number of invoices to skip"),
    limit: int = Query(100, description="Maximum number of invoices to return"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get invoices for a deal
    """
    # Validate deal access
    deal = validate_deal_access(db, deal_id, current_user)
    
    # Get invoices
    invoices, total = await get_invoices(db, deal_id, skip, limit)
    
    return invoices

@router.post("/invoices/{invoice_id}/approve", response_model=Invoice, tags=["Invoices"])
async def approve_invoice(
    invoice_id: str = Path(..., description="The ID of the invoice to approve"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Approve an invoice
    """
    invoice = await get_invoice(db, invoice_id)
    
    # Validate deal access
    deal = validate_deal_access(db, invoice.deal_id, current_user)
    
    # Check if user can edit the deal
    if not can_edit_deal(db, invoice.deal_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to approve invoices for this deal"
        )
    
    # Update status to approved
    updated_invoice = await update_invoice_status(db, invoice_id, "approved")
    
    return updated_invoice

@router.post("/invoices/{invoice_id}/reject", response_model=Invoice, tags=["Invoices"])
async def reject_invoice(
    invoice_id: str = Path(..., description="The ID of the invoice to reject"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reject an invoice
    """
    invoice = await get_invoice(db, invoice_id)
    
    # Validate deal access
    deal = validate_deal_access(db, invoice.deal_id, current_user)
    
    # Check if user can edit the deal
    if not can_edit_deal(db, invoice.deal_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to reject invoices for this deal"
        )
    
    # Update status to rejected
    updated_invoice = await update_invoice_status(db, invoice_id, "rejected")
    
    return updated_invoice

@router.get("/invoices/{invoice_id}/download", tags=["Invoices"])
async def download_invoice(
    invoice_id: str = Path(..., description="The ID of the invoice to download"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Download the original invoice PDF
    """
    invoice = await get_invoice(db, invoice_id)
    
    # Validate deal access
    deal = validate_deal_access(db, invoice.deal_id, current_user)
    
    # Check if file exists
    if not os.path.exists(invoice.original_pdf_url):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice file not found"
        )
    
    return FileResponse(
        path=invoice.original_pdf_url,
        filename=os.path.basename(invoice.original_pdf_url),
        media_type="application/pdf"
    )

@router.get("/invoices/{invoice_id}/excel", tags=["Invoices"])
async def download_invoice_excel(
    invoice_id: str = Path(..., description="The ID of the invoice to download as Excel"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Download the invoice data as Excel
    """
    invoice = await get_invoice(db, invoice_id)
    
    # Validate deal access
    deal = validate_deal_access(db, invoice.deal_id, current_user)
    
    # Create Excel file
    line_items = json.loads(invoice.line_items) if isinstance(invoice.line_items, str) else invoice.line_items
    
    # Create a DataFrame from line items
    df = pd.DataFrame(line_items)
    
    # Add invoice header information
    header_df = pd.DataFrame([{
        "Vendor": invoice.vendor_name,
        "Invoice Number": invoice.invoice_number,
        "Invoice Date": invoice.invoice_date.isoformat() if hasattr(invoice.invoice_date, 'isoformat') else invoice.invoice_date,
        "Total Amount": invoice.total_amount,
        "Status": invoice.status
    }])
    
    # Create Excel writer
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        header_df.to_excel(writer, sheet_name='Invoice', index=False, startrow=0)
        df.to_excel(writer, sheet_name='Invoice', index=False, startrow=3)
        
        # Get workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Invoice']
        
        # Add formats
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#D9EAD3',
            'border': 1
        })
        
        # Apply formats
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(3, col_num, value, header_format)
    
    # Reset pointer and return Excel file
    output.seek(0)
    
    headers = {
        'Content-Disposition': f'attachment; filename="invoice_{invoice_id}.xlsx"'
    }
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )
