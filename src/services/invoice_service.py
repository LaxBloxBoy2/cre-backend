import os
import uuid
import re
import json
import tempfile
from typing import List, Dict, Any, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from ..models.invoice import Invoice
from ..schemas.invoice_schema import InvoiceCreate, LineItem
from ..utils.file_utils import validate_file_size, validate_file_type, get_safe_upload_path, save_file
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Create uploads directory for invoices if it doesn't exist
INVOICES_DIR = os.path.join("uploads", "invoices")
os.makedirs(INVOICES_DIR, exist_ok=True)

async def upload_and_parse_invoice(
    db: Session,
    deal_id: str,
    user_id: str,
    file: UploadFile
) -> Invoice:
    """
    Upload an invoice PDF and parse it using OCR
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        file: Uploaded PDF file
        
    Returns:
        Invoice object with parsed data
    """
    try:
        # Validate file size and type
        validate_file_size(file, max_size=10 * 1024 * 1024)  # 10MB limit
        file_extension = validate_file_type(file, allowed_types=["pdf"])
        
        # Save the file
        original_filename = file.filename or "invoice.pdf"
        file_path, relative_path = get_safe_upload_path(INVOICES_DIR, original_filename, file_extension)
        save_file(file, file_path)
        
        # Extract text using OCR
        extracted_text = await extract_text_from_pdf(file_path)
        
        # Parse invoice data
        invoice_data = parse_invoice_data(extracted_text)
        
        # Create invoice record
        invoice_id = str(uuid.uuid4())
        
        # Convert line items to JSON
        line_items_json = json.dumps([item.dict() for item in invoice_data["line_items"]])
        
        invoice = Invoice(
            id=invoice_id,
            deal_id=deal_id,
            vendor_name=invoice_data["vendor_name"],
            invoice_number=invoice_data["invoice_number"],
            invoice_date=invoice_data["invoice_date"],
            total_amount=invoice_data["total_amount"],
            status="pending",
            line_items=line_items_json,
            original_pdf_url=file_path
        )
        
        # Add to database
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        return invoice
    except Exception as e:
        logger.error(f"Error uploading and parsing invoice: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading and parsing invoice: {str(e)}"
        )

async def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from PDF using OCR
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        Extracted text
    """
    try:
        # We'll use a try/except block to attempt different OCR methods
        # This makes the code more resilient if one method fails
        
        # Method 1: Try using pdf2image + EasyOCR
        try:
            # Import libraries here to avoid dependency issues
            from pdf2image import convert_from_path
            import easyocr
            
            # Initialize EasyOCR reader
            reader = easyocr.Reader(['en'])
            
            # Convert PDF to images
            images = convert_from_path(file_path)
            
            # Extract text from each image
            full_text = ""
            for img in images:
                # Save image temporarily
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                    temp_img_path = temp_file.name
                    img.save(temp_img_path)
                
                # Use EasyOCR to extract text
                result = reader.readtext(temp_img_path)
                page_text = " ".join([text[1] for text in result])
                full_text += page_text + "\n\n"
                
                # Remove temp image
                os.remove(temp_img_path)
            
            if full_text.strip():
                return full_text
            
            # If we got no text, fall through to the next method
        except Exception as e:
            logger.warning(f"EasyOCR method failed: {str(e)}")
        
        # Method 2: Try using pytesseract
        try:
            from pdf2image import convert_from_path
            import pytesseract
            
            # Convert PDF to images
            images = convert_from_path(file_path)
            
            # Extract text from each image
            full_text = ""
            for img in images:
                # Use pytesseract to extract text
                page_text = pytesseract.image_to_string(img)
                full_text += page_text + "\n\n"
            
            if full_text.strip():
                return full_text
            
            # If we got no text, fall through to the next method
        except Exception as e:
            logger.warning(f"Pytesseract method failed: {str(e)}")
        
        # Method 3: Try using OCR.space API
        try:
            import requests
            
            # Convert first page of PDF to image
            from pdf2image import convert_from_path
            images = convert_from_path(file_path, first_page=1, last_page=1)
            
            # Save image temporarily
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                temp_img_path = temp_file.name
                images[0].save(temp_img_path)
            
            # Call OCR.space API
            api_url = 'https://api.ocr.space/parse/image'
            payload = {
                'apikey': 'helloworld',  # Free API key for testing
                'language': 'eng',
                'isOverlayRequired': False
            }
            
            with open(temp_img_path, 'rb') as f:
                files = {'file': f}
                response = requests.post(api_url, files=files, data=payload)
            
            # Remove temp image
            os.remove(temp_img_path)
            
            # Parse response
            result = response.json()
            if result.get('ParsedResults'):
                return result['ParsedResults'][0]['ParsedText']
        except Exception as e:
            logger.warning(f"OCR.space API method failed: {str(e)}")
        
        # If all methods failed, return a placeholder message
        return "OCR EXTRACTION FAILED - PLEASE ENTER INVOICE DETAILS MANUALLY"
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting text from PDF: {str(e)}"
        )

def parse_invoice_data(text: str) -> Dict[str, Any]:
    """
    Parse invoice data from extracted text
    
    Args:
        text: Extracted text from invoice
        
    Returns:
        Dictionary with parsed invoice data
    """
    # Initialize result with default values
    result = {
        "vendor_name": "Unknown Vendor",
        "invoice_number": "Unknown",
        "invoice_date": None,
        "total_amount": 0.0,
        "line_items": []
    }
    
    # Extract vendor name (usually at the top)
    lines = text.split('\n')
    if lines and len(lines) > 0:
        # Use the first non-empty line as vendor name
        for line in lines:
            if line.strip():
                result["vendor_name"] = line.strip()
                break
    
    # Extract invoice number using regex
    invoice_number_match = re.search(r'(?i)(?:invoice|inv)[.\s#:]*([A-Z0-9\-]+)', text)
    if invoice_number_match:
        result["invoice_number"] = invoice_number_match.group(1).strip()
    
    # Extract date using regex
    date_match = re.search(r'(?i)(?:date|invoice date)[.\s:]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})', text)
    if date_match:
        date_str = date_match.group(1)
        # Convert to standard format (YYYY-MM-DD)
        try:
            # Try different date formats
            from datetime import datetime
            
            # Try MM/DD/YYYY
            try:
                date_obj = datetime.strptime(date_str, '%m/%d/%Y')
                result["invoice_date"] = date_obj.date()
            except ValueError:
                pass
            
            # Try DD/MM/YYYY
            if result["invoice_date"] is None:
                try:
                    date_obj = datetime.strptime(date_str, '%d/%m/%Y')
                    result["invoice_date"] = date_obj.date()
                except ValueError:
                    pass
            
            # Try MM-DD-YYYY
            if result["invoice_date"] is None:
                try:
                    date_obj = datetime.strptime(date_str, '%m-%d-%Y')
                    result["invoice_date"] = date_obj.date()
                except ValueError:
                    pass
            
            # Try MM/DD/YY
            if result["invoice_date"] is None:
                try:
                    date_obj = datetime.strptime(date_str, '%m/%d/%y')
                    result["invoice_date"] = date_obj.date()
                except ValueError:
                    pass
            
            # If all formats fail, use today's date
            if result["invoice_date"] is None:
                from datetime import date
                result["invoice_date"] = date.today()
        except Exception:
            # If date parsing fails, use today's date
            from datetime import date
            result["invoice_date"] = date.today()
    else:
        # If no date found, use today's date
        from datetime import date
        result["invoice_date"] = date.today()
    
    # Extract total amount
    total_match = re.search(r'(?i)(?:total|amount due|balance due|grand total)[.\s:]*[$]?[\s]*([\d,]+\.?\d*)', text)
    if total_match:
        total_str = total_match.group(1).replace(',', '')
        try:
            result["total_amount"] = float(total_str)
        except ValueError:
            # If conversion fails, try to find another number
            amount_matches = re.findall(r'[$]?([\d,]+\.?\d*)', text)
            for amount in amount_matches:
                try:
                    amount = amount.replace(',', '')
                    value = float(amount)
                    # Use the largest value as the total
                    if value > result["total_amount"]:
                        result["total_amount"] = value
                except ValueError:
                    continue
    
    # Extract line items
    line_items = []
    
    # Look for table-like structures in the text
    table_section = extract_table_section(text)
    if table_section:
        lines = table_section.split('\n')
        for line in lines:
            # Skip empty lines
            if not line.strip():
                continue
                
            # Try to parse line item
            item = parse_line_item(line)
            if item:
                line_items.append(LineItem(**item))
    
    # If no line items found, create a single line item with the total amount
    if not line_items and result["total_amount"] > 0:
        line_items.append(LineItem(
            description="Invoice Total",
            quantity=1.0,
            unit_price=result["total_amount"],
            total=result["total_amount"]
        ))
    
    result["line_items"] = line_items
    
    return result

def extract_table_section(text: str) -> str:
    """
    Extract the section of text that likely contains the line items table
    
    Args:
        text: Full extracted text
        
    Returns:
        Text section containing the table
    """
    # Look for common table headers
    table_start_patterns = [
        r'(?i)item|description|qty|quantity|price|amount',
        r'(?i)product|service|hours|rate'
    ]
    
    lines = text.split('\n')
    start_idx = -1
    end_idx = -1
    
    # Find start of table
    for i, line in enumerate(lines):
        for pattern in table_start_patterns:
            if re.search(pattern, line):
                start_idx = i
                break
        if start_idx >= 0:
            break
    
    # If we found a table start, look for the end
    if start_idx >= 0:
        # Look for total or subtotal as end marker
        for i in range(start_idx + 1, len(lines)):
            if re.search(r'(?i)total|subtotal', lines[i]):
                end_idx = i
                break
        
        # If no end marker found, use a reasonable number of lines
        if end_idx < 0:
            end_idx = min(start_idx + 20, len(lines))
        
        return '\n'.join(lines[start_idx:end_idx])
    
    # If no table found, return a portion of the text that might contain line items
    middle_idx = len(lines) // 2
    return '\n'.join(lines[middle_idx - 10:middle_idx + 10])

def parse_line_item(line: str) -> Optional[Dict[str, Any]]:
    """
    Parse a single line item from text
    
    Args:
        line: Text line that might contain a line item
        
    Returns:
        Dictionary with line item data or None if not parseable
    """
    # This is a simplified approach - in reality, you'd need more sophisticated parsing
    # based on the specific invoice format
    
    # Try to extract numeric values that might be quantity, price, and total
    numbers = re.findall(r'\d+\.?\d*', line)
    
    # Need at least 1 number for a valid line item
    if not numbers:
        return None
    
    # Extract description (non-numeric part)
    description = re.sub(r'\d+\.?\d*', '', line).strip()
    description = re.sub(r'^\W+|\W+$', '', description)  # Remove leading/trailing non-word chars
    
    # If description is empty, use a placeholder
    if not description:
        description = "Item"
    
    # If we have 3 or more numbers, assume qty, price, total
    if len(numbers) >= 3:
        return {
            "description": description,
            "quantity": float(numbers[0]),
            "unit_price": float(numbers[1]),
            "total": float(numbers[2])
        }
    # If we have 2 numbers, assume price and total
    elif len(numbers) == 2:
        return {
            "description": description,
            "quantity": 1.0,
            "unit_price": float(numbers[0]),
            "total": float(numbers[1])
        }
    # If we have 1 number, assume it's the total
    else:
        total = float(numbers[0])
        return {
            "description": description,
            "quantity": 1.0,
            "unit_price": total,
            "total": total
        }

async def get_invoices(
    db: Session,
    deal_id: str,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Invoice], int]:
    """
    Get invoices for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        skip: Number of invoices to skip
        limit: Maximum number of invoices to return
        
    Returns:
        Tuple of (list of invoices, total count)
    """
    # Create query
    query = db.query(Invoice).filter(Invoice.deal_id == deal_id)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    invoices = query.order_by(Invoice.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return invoices, total

async def get_invoice(
    db: Session,
    invoice_id: str
) -> Invoice:
    """
    Get an invoice by ID
    
    Args:
        db: Database session
        invoice_id: Invoice ID
        
    Returns:
        Invoice object
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {invoice_id} not found"
        )
    return invoice

async def update_invoice_status(
    db: Session,
    invoice_id: str,
    status: str
) -> Invoice:
    """
    Update invoice status
    
    Args:
        db: Database session
        invoice_id: Invoice ID
        status: New status ('pending', 'approved', 'rejected')
        
    Returns:
        Updated invoice object
    """
    invoice = await get_invoice(db, invoice_id)
    
    # Validate status
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {status}. Must be 'pending', 'approved', or 'rejected'."
        )
    
    # Update status
    invoice.status = status
    db.commit()
    db.refresh(invoice)
    
    return invoice
