import os
import uuid
import json
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML, CSS

print("Current directory:", os.getcwd())
print("Files in current directory:", os.listdir("."))

# Create reports directory if it doesn't exist
REPORTS_DIR = os.path.join(os.getcwd(), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)
print(f"Created reports directory: {REPORTS_DIR}")

# Set up Jinja2 environment
template_dir = os.path.join(os.getcwd(), "utils")
print(f"Template directory: {template_dir}")
print(f"Template directory exists: {os.path.exists(template_dir)}")
print(f"Files in template directory: {os.listdir(template_dir) if os.path.exists(template_dir) else 'Directory not found'}")

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

# Create a mock deal
deal = {
    "project_name": "Test Project",
    "location": "Test Location",
    "property_type": "Office",
    "acquisition_price": 1000000,
    "construction_cost": 500000,
    "square_footage": 10000,
    "projected_rent_per_sf": 30,
    "vacancy_rate": 5,
    "operating_expenses_per_sf": 10,
    "exit_cap_rate": 6,
    "status": "Draft",
    "created_at": datetime.now(),
    "ai_memo": "This is a test memo for the project. The property is located in a prime area with good potential for growth."
}

# Calculate financial metrics
project_cost = deal["acquisition_price"] + deal["construction_cost"]

# Calculate NOI
gpi = deal["square_footage"] * deal["projected_rent_per_sf"]
egi = gpi * (1 - deal["vacancy_rate"] / 100)
op_ex = deal["square_footage"] * deal["operating_expenses_per_sf"]
noi = egi - op_ex

# Calculate exit value
exit_value = noi / (deal["exit_cap_rate"] / 100)

# Calculate development margin
development_margin = ((exit_value - project_cost) / project_cost) * 100

# Create mock risk flags
risk_flags = [
    "Tenant pays taxes",
    "Only 2% annual rent escalation",
    "Early termination clause"
]

# Create mock chat Q&A
chat_qa = [
    {
        "question": "What's the projected IRR on this deal?",
        "answer": "Based on the information provided, I estimate the IRR to be approximately 15.2%."
    },
    {
        "question": "How does the cap rate compare to market?",
        "answer": "The exit cap rate of 6% is slightly below the market average of 6.5% for similar properties in this area."
    }
]

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

try:
    # Render the template
    template = env.get_template("pdf_template.html")
    html_content = template.render(**template_data)

    # Generate a unique filename
    filename = f"{deal['project_name'].replace(' ', '-')}-{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    filename = filename.replace("/", "-").replace("\\", "-")  # Remove slashes for safety
    file_path = os.path.join(REPORTS_DIR, filename)

    # Generate the PDF
    HTML(string=html_content).write_pdf(file_path)

    print(f"Report generated successfully: {file_path}")
except Exception as e:
    print(f"Error generating report: {str(e)}")
