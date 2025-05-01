import os
import io
import datetime
import uuid
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from ..schemas.report_schema import ReportRequest
from ..models.deal import Deal
from ..models.user import User
from .underwriting_service import _perform_underwriting_calculations, _generate_ai_summary, _get_fallback_summary
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)


async def generate_property_report(request: ReportRequest) -> StreamingResponse:
    """
    Generate a PDF report for a property based on underwriting calculations

    Args:
        request: The report request containing property details

    Returns:
        StreamingResponse with the PDF file

    Raises:
        HTTPException: If there's an error generating the report
    """
    try:
        print(f"Generating report for project: {request.project_name}")

        # Perform underwriting calculations
        calculations = _perform_underwriting_calculations(request)
        print(f"Calculations completed: {calculations}")

        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
        print(f"Using fallback: {use_fallback}")

        # Generate underwriting summary
        if use_fallback:
            print("Getting fallback summary")
            underwriting_summary = _get_fallback_summary(request, calculations)
        else:
            try:
                print("Generating AI summary")
                underwriting_summary = await _generate_ai_summary(request, calculations)
            except Exception as e:
                print(f"Error calling Fireworks API: {str(e)}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                underwriting_summary = _get_fallback_summary(request, calculations)

        print("Generating PDF content")
        # Generate PDF content
        pdf_content = _generate_pdf(request, calculations, underwriting_summary)
        print(f"PDF content generated, size: {len(pdf_content)} bytes")

        # Save a copy of the PDF to the reports folder
        print("Saving PDF copy")
        _save_pdf_copy(request, pdf_content)
        print("PDF copy saved")

        # Return the PDF as a StreamingResponse
        print("Returning StreamingResponse")
        return StreamingResponse(
            iter([pdf_content]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{request.project_name.replace(' ', '_')}_investment_report.pdf\""
            }
        )
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")


def _generate_pdf(request: ReportRequest, calculations: dict, underwriting_summary: str) -> bytes:
    """
    Generate a PDF report using ReportLab

    Args:
        request: The report request containing property details
        calculations: Dictionary with calculated values
        underwriting_summary: AI-generated underwriting summary

    Returns:
        PDF content as bytes
    """
    # Create a buffer to receive the PDF data
    buffer = io.BytesIO()

    # Format the date
    current_date = datetime.datetime.now().strftime("%B %d, %Y")

    # Get company name or use default
    company_name = request.company_name or "CRE Platform"

    # Get report title or use default
    report_title = request.report_title or f"Investment Report: {request.project_name}"

    # Create the document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Get styles
    styles = getSampleStyleSheet()

    # Create custom styles
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=1,  # Center alignment
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=1,  # Center alignment
        textColor=colors.gray,
        spaceAfter=24
    )

    heading2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=20
    )

    normal_style = styles['Normal']

    highlight_style = ParagraphStyle(
        'Highlight',
        parent=styles['Normal'],
        fontSize=12,
        backColor=colors.lightblue,
        borderPadding=8,
        spaceAfter=12
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        alignment=1  # Center alignment
    )

    # Create the content elements
    elements = []

    # Add title and subtitle
    elements.append(Paragraph(report_title, title_style))
    elements.append(Paragraph(f"Generated by {company_name} on {current_date}", subtitle_style))

    # Project Overview section
    elements.append(Paragraph("Project Overview", heading2_style))

    # Project overview table
    project_data = [
        ["Project Name", request.project_name],
        ["Location", request.location],
        ["Property Type", request.property_type],
        ["Square Footage", f"{request.square_footage:,.0f} SF"]
    ]

    project_table = Table(project_data, colWidths=[2*inch, 4*inch])
    project_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    elements.append(project_table)
    elements.append(Spacer(1, 0.2*inch))

    # Financial Inputs section
    elements.append(Paragraph("Financial Inputs", heading2_style))

    # Financial inputs table
    financial_data = [
        ["Acquisition Price", f"${request.acquisition_price:,.2f}"],
        ["Construction Cost", f"${request.construction_cost:,.2f}"],
        ["Projected Rent per SF", f"${request.projected_rent_per_sf:.2f}"],
        ["Vacancy Rate", f"{request.vacancy_rate}%"],
        ["Operating Expenses per SF", f"${request.operating_expenses_per_sf:.2f}"],
        ["Exit Cap Rate", f"{request.exit_cap_rate}%"]
    ]

    financial_table = Table(financial_data, colWidths=[2*inch, 4*inch])
    financial_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.black),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    elements.append(financial_table)
    elements.append(Spacer(1, 0.2*inch))

    # Financial Analysis section
    elements.append(Paragraph("Financial Analysis", heading2_style))

    # Development margin highlight
    elements.append(Paragraph(f"Development Margin: {calculations['development_margin']:.2f}%", highlight_style))

    # Financial analysis table
    analysis_data = [
        ["Metric", "Value"],
        ["Gross Potential Income (GPI)", f"${calculations['gross_potential_income']:,.2f}"],
        ["Effective Gross Income (EGI)", f"${calculations['effective_gross_income']:,.2f}"],
        ["Operating Expenses", f"${calculations['operating_expenses']:,.2f}"],
        ["Net Operating Income (NOI)", f"${calculations['net_operating_income']:,.2f}"],
        ["Total Project Cost", f"${calculations['project_cost']:,.2f}"],
        ["Estimated Exit Value", f"${calculations['estimated_exit_value']:,.2f}"]
    ]

    analysis_table = Table(analysis_data, colWidths=[3*inch, 3*inch])
    analysis_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))

    elements.append(analysis_table)
    elements.append(Spacer(1, 0.2*inch))

    # Investment Analysis section
    elements.append(Paragraph("Investment Analysis", heading2_style))

    # Process the underwriting summary to handle markdown-like formatting
    # Split by lines and process each line
    lines = underwriting_summary.split('\n')
    for line in lines:
        if line.strip() == "":
            elements.append(Spacer(1, 0.1*inch))
        elif line.startswith("# "):
            elements.append(Paragraph(line[2:], styles['Heading1']))
        elif line.startswith("## "):
            elements.append(Paragraph(line[3:], styles['Heading2']))
        elif line.startswith("### "):
            elements.append(Paragraph(line[4:], styles['Heading3']))
        elif line.startswith("- "):
            elements.append(Paragraph("• " + line[2:], normal_style))
        else:
            elements.append(Paragraph(line, normal_style))

    # Add a page break before the footer
    elements.append(PageBreak())

    # Add footer
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"This report was generated by {company_name}. The information contained in this report is for informational purposes only and should not be considered as investment advice.", footer_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph(f"© {datetime.datetime.now().year} {company_name}. All rights reserved.", footer_style))

    # Build the PDF
    doc.build(elements)

    # Get the value from the buffer
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content


def _save_pdf_copy(request: ReportRequest, pdf_content: bytes) -> None:
    """
    Save a copy of the PDF to the reports folder

    Args:
        request: The report request containing property details
        pdf_content: PDF content as bytes
    """
    try:
        # Create reports directory if it doesn't exist
        reports_dir = Path("reports")
        print(f"Reports directory path: {reports_dir.absolute()}")
        reports_dir.mkdir(exist_ok=True)
        print(f"Reports directory exists: {reports_dir.exists()}")

        # Generate a filename based on the project name and current timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{request.project_name.replace(' ', '_')}_{timestamp}.pdf"
        print(f"Generated filename: {filename}")

        # Get the full path to the file
        file_path = reports_dir / filename
        print(f"Full file path: {file_path.absolute()}")

        # Save the PDF
        print(f"Writing {len(pdf_content)} bytes to file")
        with open(file_path, 'wb') as f:
            f.write(pdf_content)
        print(f"File written successfully: {file_path.exists()}")
    except Exception as e:
        # Log the error but don't fail the request
        print(f"Error saving PDF copy: {str(e)}")
        import traceback
        traceback.print_exc()


async def generate_report(db: Session, deal_id: str, user_id: str) -> Dict[str, Any]:
    """
    Generate a report for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        user_id: User ID

    Returns:
        Dictionary with report details
    """
    try:
        # Get the deal
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")

        # Get the user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Create a ReportRequest from the deal
        request = ReportRequest(
            project_name=deal.project_name,
            location=deal.location,
            property_type=deal.property_type,
            acquisition_price=deal.acquisition_price,
            construction_cost=deal.construction_cost,
            square_footage=deal.square_footage,
            projected_rent_per_sf=deal.projected_rent_per_sf,
            vacancy_rate=deal.vacancy_rate,
            operating_expenses_per_sf=deal.operating_expenses_per_sf,
            exit_cap_rate=deal.exit_cap_rate,
            company_name=user.org_name if hasattr(user, 'org_name') else None
        )

        # Generate the report
        pdf_response = await generate_property_report(request)

        # Generate a unique filename
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"report_{deal.project_name.replace(' ', '_')}_{timestamp}.pdf"

        # In a real implementation, we would save the PDF and return its URL
        # For now, we'll just return a mock URL
        report_url = f"/reports/{deal_id}/{filename}"

        # Update the deal with the report file
        deal.report_file = report_url
        db.commit()

        return {
            "report_url": report_url,
            "filename": filename,
            "generated_at": datetime.datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating report: {str(e)}"
        )
