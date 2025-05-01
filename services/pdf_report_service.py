import os
import uuid
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS
from models.deal import Deal
from models.lease_analysis import LeaseAnalysis
from models.chat import ChatMessage

# Create reports directory if it doesn't exist
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# Set up Jinja2 environment
template_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "utils")
env = Environment(loader=FileSystemLoader(template_dir))

# Add custom filters
def format_currency(value):
    """Format a value as currency"""
    if value is None:
        return "0.00"
    return f"{float(value):,.2f}"

def format_number(value):
    """Format a value as a number with commas"""
    if value is None:
        return "0"
    return f"{float(value):,.0f}"

def format_percent(value):
    """Format a value as a percentage"""
    if value is None:
        return "0.0"
    return f"{float(value):.1f}"

def format_date(value):
    """Format a date"""
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    return value.strftime("%B %d, %Y")

# Add filters to Jinja2 environment
env.filters["format_currency"] = format_currency
env.filters["format_number"] = format_number
env.filters["format_percent"] = format_percent
env.filters["format_date"] = format_date

def generate_report(db: Session, deal_id: str, user_id: str) -> Dict[str, str]:
    """
    Generate a PDF report for a deal
    
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
    
    # Prepare template data
    template_data = {
        "deal": deal,
        "project_cost": project_cost,
        "noi": noi,
        "exit_value": exit_value,
        "development_margin": development_margin,
        "risk_flags": risk_flags,
        "chat_qa": chat_qa,
        "timestamp": datetime.now().strftime("%B %d, %Y %I:%M %p")
    }
    
    # Render the template
    template = env.get_template("pdf_template.html")
    html_content = template.render(**template_data)
    
    # Generate a unique filename
    filename = f"{deal.project_name.replace(' ', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filename = filename.replace("/", "-").replace("\\", "-")  # Remove slashes for safety
    file_path = os.path.join(REPORTS_DIR, filename)
    
    # Generate the PDF
    HTML(string=html_content).write_pdf(file_path)
    
    # Update the deal with the report file path
    deal.report_file = file_path
    db.commit()
    
    # Return the result
    return {
        "status": "Report generated successfully",
        "download_url": f"/reports/{filename}"
    }
