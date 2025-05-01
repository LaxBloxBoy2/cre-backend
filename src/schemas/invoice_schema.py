from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

class LineItem(BaseModel):
    """Model for invoice line item"""
    description: str = Field(..., description="Description of the item")
    quantity: float = Field(..., description="Quantity of the item")
    unit_price: float = Field(..., description="Unit price of the item")
    total: float = Field(..., description="Total price of the item")

class InvoiceBase(BaseModel):
    """Base model for invoice data"""
    vendor_name: str = Field(..., description="Name of the vendor")
    invoice_number: str = Field(..., description="Invoice number")
    invoice_date: date = Field(..., description="Invoice date")
    total_amount: float = Field(..., description="Total amount of the invoice")

class InvoiceCreate(InvoiceBase):
    """Model for creating a new invoice"""
    deal_id: str = Field(..., description="ID of the deal this invoice belongs to")
    line_items: List[LineItem] = Field(..., description="Line items in the invoice")
    original_pdf_url: str = Field(..., description="URL to the original PDF file")

class InvoiceInDB(InvoiceBase):
    """Model for an invoice in the database"""
    id: str = Field(..., description="Unique identifier for the invoice")
    deal_id: str = Field(..., description="ID of the deal this invoice belongs to")
    status: str = Field(default="pending", description="Status of the invoice (pending, approved, rejected)")
    uploaded_at: datetime = Field(..., description="When the invoice was uploaded")
    line_items: List[LineItem] = Field(..., description="Line items in the invoice")
    original_pdf_url: str = Field(..., description="URL to the original PDF file")

    class Config:
        from_attributes = True

class Invoice(InvoiceInDB):
    """Model for an invoice with all fields"""
    pass

class InvoiceList(BaseModel):
    """Model for a list of invoices"""
    invoices: List[Invoice] = Field(..., description="List of invoices")
    total: int = Field(..., description="Total number of invoices")
