import os
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
from ..models.deal import Deal
from ..models.lease_analysis import LeaseAnalysis
from ..models.chat import ChatMessage

# Create reports directory if it doesn't exist
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def format_currency(value):
    """Format a value as currency"""
    if value is None:
        return "$0.00"
    return f"${float(value):,.2f}"

def format_number(value):
    """Format a value as a number with commas"""
    if value is None:
        return "0"
    return f"{float(value):,.0f}"

def format_percent(value):
    """Format a value as a percentage"""
    if value is None:
        return "0.0%"
    return f"{float(value):.1f}%"

def generate_report(db: Session, deal_id: str, user_id: str) -> Dict[str, str]:
    """
    Generate a PDF report for a deal using ReportLab
    
    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID
        
    Returns:
        Dictionary with status and download URL
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise ValueError("Deal not found")
    
    # Check if user is authorized to access this deal
    if deal.user_id != user_id:
        raise ValueError("Not authorized to access this deal")
    
    # Calculate financial metrics
    project_cost = deal.acquisition_price + deal.construction_cost
    
    # Calculate NOI
    gpi = deal.square_footage * deal.projected_rent_per_sf
    egi = gpi * (1 - deal.vacancy_rate / 100)
    op_ex = deal.square_footage * deal.operating_expenses_per_sf
    noi = egi - op_ex
    
    # Calculate exit value
    exit_value = noi / (deal.exit_cap_rate / 100) if deal.exit_cap_rate else 0
    
    # Calculate development margin
    development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0
    
    # Get lease analysis
    lease_analysis = db.query(LeaseAnalysis).filter(LeaseAnalysis.deal_id == deal_id).first()
    
    # Get risk flags
    risk_flags = []
    if lease_analysis and lease_analysis.red_flags:
        try:
            risk_flags.extend(json.loads(lease_analysis.red_flags))
        except json.JSONDecodeError:
            pass
    
    # Get chat history
    chat_messages = db.query(ChatMessage).filter(ChatMessage.deal_id == deal_id).order_by(ChatMessage.timestamp).all()
    
    # Extract key Q&A from chat history
    chat_qa = []
    if chat_messages:
        # Group messages into Q&A pairs
        i = 0
        while i < len(chat_messages) - 1:
            if chat_messages[i].role == "user" and chat_messages[i+1].role == "assistant":
                chat_qa.append({
                    "question": chat_messages[i].content,
                    "answer": chat_messages[i+1].content
                })
            i += 1
        
        # Limit to 3 most recent Q&A pairs
        chat_qa = chat_qa[-3:] if len(chat_qa) > 3 else chat_qa
    
    # Generate a unique filename
    filename = f"{deal.project_name.replace(' ', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filename = filename.replace("/", "-").replace("\\", "-")  # Remove slashes for safety
    file_path = os.path.join(REPORTS_DIR, filename)
    
    # Create the PDF document
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create custom styles
    styles.add(ParagraphStyle(
        name='Title',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1,  # Center
        spaceAfter=12
    ))
    
    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=1,  # Center
        spaceAfter=12
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        name='Memo',
        parent=styles['Normal'],
        fontSize=10,
        leftIndent=20,
        rightIndent=20,
        spaceAfter=12,
        backColor=colors.lightgrey
    ))
    
    styles.add(ParagraphStyle(
        name='Risk',
        parent=styles['Normal'],
        fontSize=10,
        leftIndent=20,
        rightIndent=20,
        spaceAfter=12,
        textColor=colors.red
    ))
    
    styles.add(ParagraphStyle(
        name='Question',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica-Bold',
        spaceAfter=2
    ))
    
    styles.add(ParagraphStyle(
        name='Answer',
        parent=styles['Normal'],
        fontSize=10,
        leftIndent=20,
        spaceAfter=12
    ))
    
    # Build the document content
    content = []
    
    # Add title
    content.append(Paragraph(deal.project_name, styles['Title']))
    content.append(Paragraph("Commercial Real Estate Investment Report", styles['Subtitle']))
    content.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y %I:%M %p')}", styles['Subtitle']))
    content.append(Spacer(1, 0.25*inch))
    
    # Project Overview section
    content.append(Paragraph("Project Overview", styles['SectionTitle']))
    
    overview_data = [
        ["Property Name", deal.project_name, "Location", deal.location],
        ["Property Type", deal.property_type, "Status", deal.status],
        ["Square Footage", f"{format_number(deal.square_footage)} SF", "Created", deal.created_at.strftime("%B %d, %Y")]
    ]
    
    overview_table = Table(overview_data, colWidths=[1.25*inch, 1.75*inch, 1.25*inch, 1.75*inch])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6)
    ]))
    
    content.append(overview_table)
    content.append(Spacer(1, 0.25*inch))
    
    # Financial Summary section
    content.append(Paragraph("Financial Summary", styles['SectionTitle']))
    
    financial_data = [
        ["Acquisition Cost", format_currency(deal.acquisition_price)],
        ["Construction Cost", format_currency(deal.construction_cost)],
        ["Total Project Cost", format_currency(project_cost)],
        ["Projected Rent per SF", f"{format_currency(deal.projected_rent_per_sf)}/SF"],
        ["Operating Expenses per SF", f"{format_currency(deal.operating_expenses_per_sf)}/SF"],
        ["Net Operating Income", format_currency(noi)],
        ["Exit Cap Rate", f"{deal.exit_cap_rate}%"],
        ["Development Margin", format_percent(development_margin)]
    ]
    
    financial_table = Table(financial_data, colWidths=[2.5*inch, 3.5*inch])
    financial_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6)
    ]))
    
    content.append(financial_table)
    content.append(Spacer(1, 0.25*inch))
    
    # Underwriting Memo section
    if deal.ai_memo:
        content.append(Paragraph("Underwriting Memo", styles['SectionTitle']))
        content.append(Paragraph(deal.ai_memo, styles['Memo']))
        content.append(Spacer(1, 0.25*inch))
    
    # Risk Assessment section
    if risk_flags:
        content.append(Paragraph("Risk Assessment", styles['SectionTitle']))
        for risk in risk_flags:
            content.append(Paragraph(f"• {risk}", styles['Risk']))
        content.append(Spacer(1, 0.25*inch))
    
    # Key Questions & Answers section
    if chat_qa:
        content.append(Paragraph("Key Questions & Answers", styles['SectionTitle']))
        for qa in chat_qa:
            content.append(Paragraph(f"Q: {qa['question']}", styles['Question']))
            content.append(Paragraph(f"A: {qa['answer']}", styles['Answer']))
        content.append(Spacer(1, 0.25*inch))
    
    # Footer
    content.append(Paragraph("CRE Platform | Confidential Investment Report", styles['Normal']))
    content.append(Paragraph("This report is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any securities.", styles['Normal']))
    
    # Build the PDF
    doc.build(content)
    
    # Update the deal with the report file path
    deal.report_file = file_path
    db.commit()
    
    # Return the result
    return {
        "status": "Report generated successfully",
        "download_url": f"/reports/{filename}"
    }
