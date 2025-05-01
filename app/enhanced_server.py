from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Literal
import math
import json
import os
from datetime import datetime

app = FastAPI(title="CRE Platform API", description="Commercial Real Estate Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- SCHEMAS -----------------

class RoiRequest(BaseModel):
    """Request model for ROI calculation"""
    property_price: float = Field(..., description="The price of the property")
    annual_rental_income: float = Field(..., description="The annual rental income")

class RoiResponse(BaseModel):
    """Response model for ROI calculation"""
    property_price: float
    annual_rental_income: float
    roi_percentage: float

class TextAnalysisRequest(BaseModel):
    """Request model for text analysis"""
    text: str = Field(..., description="The text to analyze")

class TextAnalysisResponse(BaseModel):
    """Response model for text analysis"""
    text: str
    summary: str
    key_points: List[str]
    sentiment: str

class InvestmentMemoRequest(BaseModel):
    """Request model for investment memo generation"""
    property_name: str = Field(..., description="The name of the property")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property")
    asking_price: float = Field(..., description="The asking price of the property")
    square_footage: float = Field(..., description="The total square footage of the property")
    cap_rate: float = Field(..., description="The capitalization rate as a percentage")
    occupancy_rate: float = Field(..., description="The occupancy rate as a percentage")

class InvestmentMemoResponse(BaseModel):
    """Response model for investment memo generation"""
    property_name: str
    location: str
    property_type: str
    asking_price: float
    square_footage: float
    cap_rate: float
    occupancy_rate: float
    price_per_sf: float
    memo: str

class UnderwritingRequest(BaseModel):
    """Request model for property underwriting"""
    project_name: str = Field(..., description="The name of the project")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property")
    acquisition_price: float = Field(..., description="The acquisition price of the property")
    construction_cost: float = Field(..., description="The construction cost of the property")
    square_footage: float = Field(..., description="The total square footage of the property")
    projected_rent_per_sf: float = Field(..., description="The projected rent per square foot")
    vacancy_rate: float = Field(..., description="The vacancy rate as a percentage")
    operating_expenses_per_sf: float = Field(..., description="The operating expenses per square foot")
    exit_cap_rate: float = Field(..., description="The exit capitalization rate as a percentage")

class UnderwritingResponse(BaseModel):
    """Response model for property underwriting"""
    project_name: str
    location: str
    property_type: str
    acquisition_price: float
    construction_cost: float
    square_footage: float
    projected_rent_per_sf: float
    vacancy_rate: float
    operating_expenses_per_sf: float
    exit_cap_rate: float
    gross_potential_income: float
    effective_gross_income: float
    operating_expenses: float
    net_operating_income: float
    project_cost: float
    estimated_exit_value: float
    development_margin: float
    underwriting_summary: str

class ReportRequest(UnderwritingRequest):
    """Request model for report generation"""
    company_name: Optional[str] = Field(None, description="The name of the company generating the report")
    analyst_name: Optional[str] = Field(None, description="The name of the analyst generating the report")
    report_title: Optional[str] = Field(None, description="Custom title for the report")

class RiskRequest(UnderwritingRequest):
    """Request model for risk score calculation"""
    pass

class RiskResponse(BaseModel):
    """Response model for risk score calculation"""
    project_name: str
    location: str
    property_type: str
    acquisition_price: float
    construction_cost: float
    square_footage: float
    projected_rent_per_sf: float
    vacancy_rate: float
    operating_expenses_per_sf: float
    exit_cap_rate: float
    net_operating_income: float
    project_cost: float
    estimated_exit_value: float
    development_margin: float
    risk_score: str
    flags: List[str]

class LeaseAnalysisRequest(BaseModel):
    """Request model for lease analysis"""
    lease_text: str = Field(..., description="The lease text to analyze")

class LeaseAnalysisResponse(BaseModel):
    """Response model for lease analysis"""
    base_rent: str = Field(..., description="The base rent extracted from the lease")
    lease_term: str = Field(..., description="The lease term extracted from the lease")
    renewals: List[str] = Field(default_factory=list, description="Renewal options extracted from the lease")
    break_clauses: List[str] = Field(default_factory=list, description="Break clauses extracted from the lease")
    red_flags: List[str] = Field(default_factory=list, description="Red flag clauses extracted from the lease")

class PortfolioSummaryResponse(BaseModel):
    """Response model for portfolio summary"""
    total_deals: int = Field(..., description="Total number of deals in the portfolio")
    average_cap_rate: float = Field(..., description="Average cap rate across all deals")
    average_development_margin: float = Field(..., description="Average development margin across all deals")
    total_gross_exit_value: float = Field(..., description="Total gross exit value across all deals")
    average_project_cost: float = Field(..., description="Average project cost across all deals")
    user_id: Optional[str] = Field(None, description="User ID if filtered by user")

class AIChatRequest(BaseModel):
    """Request model for AI chat"""
    message: str = Field(..., description="The user's question about a deal")
    context: Dict[str, Any] = Field(..., description="The deal context with property details")

class AIChatResponse(BaseModel):
    """Response model for AI chat"""
    reply: str = Field(..., description="The AI's response to the user's question")

class ChatMessage(BaseModel):
    """Model for a chat message"""
    role: Literal["user", "assistant", "system"] = Field(..., description="The role of the message sender")
    content: str = Field(..., description="The content of the message")

class ConversationalAIChatRequest(BaseModel):
    """Request model for conversational AI chat"""
    messages: List[ChatMessage] = Field(..., description="The conversation history")
    context: Dict[str, Any] = Field(..., description="The deal context with property details")

class ConversationalAIChatResponse(BaseModel):
    """Response model for conversational AI chat"""
    reply: str = Field(..., description="The AI's response to the conversation")

class DealBase(BaseModel):
    """Base model for deal data"""
    project_name: str = Field(..., description="The name of the project")
    location: str = Field(..., description="The location of the property")
    property_type: str = Field(..., description="The type of property")
    acquisition_price: float = Field(..., description="The acquisition price of the property")
    construction_cost: float = Field(..., description="The construction cost of the property")
    square_footage: float = Field(..., description="The total square footage of the property")
    projected_rent_per_sf: float = Field(..., description="The projected rent per square foot")
    vacancy_rate: float = Field(..., description="The vacancy rate as a percentage")
    operating_expenses_per_sf: float = Field(..., description="The operating expenses per square foot")
    exit_cap_rate: float = Field(..., description="The exit capitalization rate as a percentage")
    status: str = Field(default="Draft", description="The status of the deal")

class DealCreate(DealBase):
    """Model for creating a new deal"""
    underwriting_result: Optional[Dict] = Field(None, description="The underwriting result data")
    ai_memo: Optional[str] = Field(None, description="AI-generated investment memo")

class DealUpdate(BaseModel):
    """Model for updating an existing deal"""
    project_name: Optional[str] = Field(None, description="The name of the project")
    location: Optional[str] = Field(None, description="The location of the property")
    property_type: Optional[str] = Field(None, description="The type of property")
    acquisition_price: Optional[float] = Field(None, description="The acquisition price of the property")
    construction_cost: Optional[float] = Field(None, description="The construction cost of the property")
    square_footage: Optional[float] = Field(None, description="The total square footage of the property")
    projected_rent_per_sf: Optional[float] = Field(None, description="The projected rent per square foot")
    vacancy_rate: Optional[float] = Field(None, description="The vacancy rate as a percentage")
    operating_expenses_per_sf: Optional[float] = Field(None, description="The operating expenses per square foot")
    exit_cap_rate: Optional[float] = Field(None, description="The exit capitalization rate as a percentage")
    underwriting_result: Optional[Dict] = Field(None, description="The underwriting result data")
    ai_memo: Optional[str] = Field(None, description="AI-generated investment memo")
    status: Optional[str] = Field(None, description="The status of the deal")

class Deal(DealBase):
    """Model for a deal with all fields"""
    id: str = Field(..., description="The unique identifier for the deal")
    underwriting_result: Optional[Dict] = Field(None, description="The underwriting result data")
    ai_memo: Optional[str] = Field(None, description="AI-generated investment memo")
    created_at: datetime = Field(..., description="The date and time when the deal was created")
    updated_at: datetime = Field(..., description="The date and time when the deal was last updated")

class DealList(BaseModel):
    """Model for a list of deals"""
    deals: List[Deal] = Field(..., description="List of deals")
    total: int = Field(..., description="Total number of deals")

# ----------------- SERVICES -----------------

# In-memory database for deals
deals_db = {}
deal_counter = 0

def calculate_roi(request: RoiRequest) -> RoiResponse:
    """Calculate ROI for a property"""
    roi_percentage = (request.annual_rental_income / request.property_price) * 100
    return RoiResponse(
        property_price=request.property_price,
        annual_rental_income=request.annual_rental_income,
        roi_percentage=roi_percentage
    )

def analyze_text(request: TextAnalysisRequest) -> TextAnalysisResponse:
    """Analyze text using a fallback response"""
    text = request.text

    # Simple fallback analysis
    words = text.split()
    word_count = len(words)

    # Generate a simple summary
    summary = f"This is a {word_count} word text about real estate."

    # Extract some key points
    key_points = [
        "The text discusses real estate properties or investments.",
        "It may contain information about property values or market trends.",
        "Further analysis would require more sophisticated NLP techniques."
    ]

    # Determine sentiment (very basic)
    positive_words = ["good", "great", "excellent", "positive", "profit", "gain", "opportunity", "growth"]
    negative_words = ["bad", "poor", "negative", "loss", "risk", "decline", "downturn", "problem"]

    positive_count = sum(1 for word in words if word.lower() in positive_words)
    negative_count = sum(1 for word in words if word.lower() in negative_words)

    if positive_count > negative_count:
        sentiment = "Positive"
    elif negative_count > positive_count:
        sentiment = "Negative"
    else:
        sentiment = "Neutral"

    return TextAnalysisResponse(
        text=text,
        summary=summary,
        key_points=key_points,
        sentiment=sentiment
    )

def generate_investment_memo(request: InvestmentMemoRequest) -> InvestmentMemoResponse:
    """Generate an investment memo using a fallback response"""
    # Calculate price per square foot
    price_per_sf = request.asking_price / request.square_footage

    # Generate a fallback memo
    memo = f"""
# Investment Memo: {request.property_name}

## Property Overview
- **Location**: {request.location}
- **Property Type**: {request.property_type}
- **Square Footage**: {request.square_footage:,.0f} SF
- **Asking Price**: ${request.asking_price:,.2f}
- **Price per SF**: ${price_per_sf:.2f}
- **Cap Rate**: {request.cap_rate}%
- **Occupancy Rate**: {request.occupancy_rate}%

## Investment Thesis
This {request.property_type} property located in {request.location} presents an attractive investment opportunity with a cap rate of {request.cap_rate}% and current occupancy of {request.occupancy_rate}%.

## Market Analysis
The {request.location} market has shown stable growth in the {request.property_type} sector, with increasing demand from both tenants and investors.

## Financial Analysis
At an asking price of ${request.asking_price:,.2f} (${price_per_sf:.2f} per SF) and a cap rate of {request.cap_rate}%, this property is expected to generate strong cash flows.

## Risk Factors
- Market competition
- Potential economic downturn
- Property-specific maintenance issues

## Recommendation
Based on the current cap rate of {request.cap_rate}% and occupancy rate of {request.occupancy_rate}%, this property represents a {get_recommendation(request.cap_rate, request.occupancy_rate)} investment opportunity.
"""

    return InvestmentMemoResponse(
        property_name=request.property_name,
        location=request.location,
        property_type=request.property_type,
        asking_price=request.asking_price,
        square_footage=request.square_footage,
        cap_rate=request.cap_rate,
        occupancy_rate=request.occupancy_rate,
        price_per_sf=price_per_sf,
        memo=memo
    )

def get_recommendation(cap_rate: float, occupancy_rate: float) -> str:
    """Get a recommendation based on cap rate and occupancy rate"""
    if cap_rate >= 7 and occupancy_rate >= 90:
        return "strong"
    elif cap_rate >= 5 and occupancy_rate >= 80:
        return "moderate"
    else:
        return "cautious"

def perform_underwriting_calculations(request: UnderwritingRequest) -> dict:
    """Perform underwriting calculations"""
    # Calculate Gross Potential Income (GPI)
    gross_potential_income = request.square_footage * request.projected_rent_per_sf

    # Calculate Effective Gross Income (EGI)
    effective_gross_income = gross_potential_income * (1 - request.vacancy_rate / 100)

    # Calculate Operating Expenses
    operating_expenses = request.square_footage * request.operating_expenses_per_sf

    # Calculate Net Operating Income (NOI)
    net_operating_income = effective_gross_income - operating_expenses

    # Calculate Total Project Cost
    project_cost = request.acquisition_price + request.construction_cost

    # Calculate Estimated Exit Value
    estimated_exit_value = net_operating_income / (request.exit_cap_rate / 100)

    # Calculate Development Margin
    development_margin = (estimated_exit_value - project_cost) / project_cost * 100

    return {
        "gross_potential_income": gross_potential_income,
        "effective_gross_income": effective_gross_income,
        "operating_expenses": operating_expenses,
        "net_operating_income": net_operating_income,
        "project_cost": project_cost,
        "estimated_exit_value": estimated_exit_value,
        "development_margin": development_margin
    }

def generate_underwriting_summary(request: UnderwritingRequest, calculations: dict) -> str:
    """Generate an underwriting summary using a fallback response"""
    # Format currency values
    gpi_formatted = f"${calculations['gross_potential_income']:,.2f}"
    egi_formatted = f"${calculations['effective_gross_income']:,.2f}"
    opex_formatted = f"${calculations['operating_expenses']:,.2f}"
    noi_formatted = f"${calculations['net_operating_income']:,.2f}"
    project_cost_formatted = f"${calculations['project_cost']:,.2f}"
    exit_value_formatted = f"${calculations['estimated_exit_value']:,.2f}"

    # Generate a fallback summary
    summary = f"""
# Underwriting Summary: {request.project_name}

## Property Overview
- **Location**: {request.location}
- **Property Type**: {request.property_type}
- **Square Footage**: {request.square_footage:,.0f} SF

## Financial Analysis
- **Gross Potential Income (GPI)**: {gpi_formatted}
- **Effective Gross Income (EGI)**: {egi_formatted}
- **Operating Expenses**: {opex_formatted}
- **Net Operating Income (NOI)**: {noi_formatted}
- **Total Project Cost**: {project_cost_formatted}
- **Estimated Exit Value**: {exit_value_formatted}
- **Development Margin**: {calculations['development_margin']:.2f}%

## Investment Analysis
This {request.property_type} development project in {request.location} shows a development margin of {calculations['development_margin']:.2f}%, which is {get_margin_assessment(calculations['development_margin'])}.

## Market Considerations
The {request.property_type} market in {request.location} has shown {get_market_assessment(request.property_type)} trends, which should be considered when evaluating this investment.

## Risk Factors
- Vacancy risk (current projection: {request.vacancy_rate}%)
- Exit cap rate risk (current assumption: {request.exit_cap_rate}%)
- Construction cost overruns
- Market competition

## Recommendation
Based on the development margin of {calculations['development_margin']:.2f}% and the current market conditions, this project represents a {get_investment_recommendation(calculations['development_margin'])} investment opportunity.
"""

    return summary

def get_margin_assessment(margin: float) -> str:
    """Get an assessment of the development margin"""
    if margin >= 20:
        return "excellent"
    elif margin >= 15:
        return "good"
    elif margin >= 10:
        return "acceptable"
    else:
        return "below target"

def get_market_assessment(property_type: str) -> str:
    """Get a market assessment based on property type"""
    assessments = {
        "Office": "mixed with challenges from remote work trends",
        "Retail": "challenging due to e-commerce competition",
        "Industrial": "strong with increasing demand for logistics space",
        "Multifamily": "stable with consistent demand for housing",
        "Mixed-Use": "positive with growing interest in live-work-play environments",
        "Hospitality": "recovering from pandemic impacts"
    }

    return assessments.get(property_type, "stable")

def get_investment_recommendation(margin: float) -> str:
    """Get an investment recommendation based on development margin"""
    if margin >= 20:
        return "strong"
    elif margin >= 15:
        return "favorable"
    elif margin >= 10:
        return "moderate"
    else:
        return "cautious"

def calculate_risk_score(request: RiskRequest) -> RiskResponse:
    """Calculate risk score for a property"""
    # Perform underwriting calculations
    calculations = perform_underwriting_calculations(request)

    # Determine risk score based on development margin
    development_margin = calculations["development_margin"]

    if development_margin < 10:
        risk_score = "High"
    elif development_margin < 15:
        risk_score = "Medium"
    else:
        risk_score = "Low"

    # Generate risk flags
    flags = []

    # Check development margin
    if development_margin < 10:
        flags.append(f"Low development margin of {development_margin:.2f}% indicates high risk")
    elif development_margin < 15:
        flags.append(f"Moderate development margin of {development_margin:.2f}% indicates medium risk")

    # Check vacancy rate
    if request.vacancy_rate > 7:
        flags.append(f"High vacancy rate of {request.vacancy_rate}% increases risk")

    # Check exit cap rate
    if request.exit_cap_rate > 7:
        flags.append(f"High exit cap rate of {request.exit_cap_rate}% increases risk")

    # Property type specific risks
    if request.property_type == "Office":
        flags.append("Office properties face challenges from remote work trends")
    elif request.property_type == "Retail":
        flags.append("Retail properties face increased competition from e-commerce")
    elif request.property_type == "Industrial":
        flags.append("Industrial properties may be affected by supply chain disruptions")
    elif request.property_type == "Multifamily":
        flags.append("Multifamily properties may face rental market saturation in some areas")

    # Ensure we have at least one flag
    if not flags:
        flags.append("General market volatility and economic uncertainty")

    # Limit to 3 flags
    flags = flags[:3]

    # Create and return the response
    return RiskResponse(
        project_name=request.project_name,
        location=request.location,
        property_type=request.property_type,
        acquisition_price=request.acquisition_price,
        construction_cost=request.construction_cost,
        square_footage=request.square_footage,
        projected_rent_per_sf=request.projected_rent_per_sf,
        vacancy_rate=request.vacancy_rate,
        operating_expenses_per_sf=request.operating_expenses_per_sf,
        exit_cap_rate=request.exit_cap_rate,
        net_operating_income=calculations["net_operating_income"],
        project_cost=calculations["project_cost"],
        estimated_exit_value=calculations["estimated_exit_value"],
        development_margin=calculations["development_margin"],
        risk_score=risk_score,
        flags=flags
    )

def analyze_lease(request: LeaseAnalysisRequest) -> LeaseAnalysisResponse:
    """Analyze a commercial lease"""
    # Simple text analysis to extract basic information
    lease_text = request.lease_text
    lease_text_lower = lease_text.lower()

    # Extract base rent (look for dollar amounts near "rent" mentions)
    base_rent = "Not specified"
    rent_indicators = ["base rent", "monthly rent", "annual rent", "rent shall be"]
    for indicator in rent_indicators:
        if indicator in lease_text_lower:
            # Find the indicator in the text
            pos = lease_text_lower.find(indicator)
            # Look for a dollar amount in the next 100 characters
            snippet = lease_text[pos:pos+100]
            # Simple regex-like search for dollar amounts
            dollar_pos = snippet.find("$")
            if dollar_pos != -1:
                # Extract the amount (up to 20 chars after $ sign)
                amount = snippet[dollar_pos:dollar_pos+20]
                # Truncate at the first non-amount character
                for i, char in enumerate(amount):
                    if i > 0 and not (char.isdigit() or char in ",." or char.isspace()):
                        amount = amount[:i]
                        break
                base_rent = amount
                break

    # Extract lease term (look for years or months near "term" mentions)
    lease_term = "Not specified"
    term_indicators = ["lease term", "term of lease", "term shall be"]
    for indicator in term_indicators:
        if indicator in lease_text_lower:
            # Find the indicator in the text
            pos = lease_text_lower.find(indicator)
            # Look for year/month mentions in the next 100 characters
            snippet = lease_text_lower[pos:pos+100]
            # Check for common term patterns
            for pattern in ["year", "month", "annual"]:
                if pattern in snippet:
                    # Extract a reasonable snippet
                    start = max(0, snippet.find(pattern) - 10)
                    end = min(len(snippet), snippet.find(pattern) + 20)
                    term_snippet = lease_text[pos + start:pos + end]
                    lease_term = term_snippet.strip()
                    break
            if lease_term != "Not specified":
                break

    # Generate some plausible renewals based on common patterns
    renewals = []
    if "renew" in lease_text_lower or "extension" in lease_text_lower:
        if "option to extend" in lease_text_lower or "option to renew" in lease_text_lower:
            renewals.append("Tenant has option to renew/extend (details not fully extracted)")

    # Generate some plausible break clauses based on common patterns
    break_clauses = []
    if "terminat" in lease_text_lower:
        break_clauses.append("Lease may contain termination provisions (details not fully extracted)")

    # Generate some plausible red flags based on common issues
    red_flags = []
    red_flag_indicators = {
        "indemnif": "Broad indemnification clause may create excessive liability",
        "as is": "Property accepted 'as is' which may hide defects",
        "waive": "Waiver of rights may be problematic",
        "sole discret": "Landlord has sole discretion on certain matters",
        "default": "Default provisions may be strict",
        "assign": "Assignment restrictions may limit flexibility"
    }

    for indicator, flag in red_flag_indicators.items():
        if indicator in lease_text_lower:
            red_flags.append(flag)

    # Limit to 3 red flags
    red_flags = red_flags[:3]

    return LeaseAnalysisResponse(
        base_rent=base_rent,
        lease_term=lease_term,
        renewals=renewals,
        break_clauses=break_clauses,
        red_flags=red_flags
    )

def create_deal(deal: DealCreate) -> Deal:
    """Create a new deal"""
    global deal_counter

    # Generate a unique ID
    deal_id = str(deal_counter + 1)
    deal_counter += 1

    # Get current timestamp
    now = datetime.now()

    # Create a new Deal object
    new_deal = Deal(
        id=deal_id,
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
        underwriting_result=deal.underwriting_result,
        ai_memo=deal.ai_memo,
        status=deal.status,
        created_at=now,
        updated_at=now
    )

    # Save to the in-memory database
    deals_db[deal_id] = new_deal

    return new_deal

def get_deals(skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Deal]:
    """Get all deals with optional filtering and pagination"""
    deals = list(deals_db.values())

    # Filter by status if provided
    if status:
        deals = [deal for deal in deals if deal.status == status]

    # Apply pagination
    return deals[skip:skip + limit]

def get_deal(deal_id: str) -> Deal:
    """Get a deal by ID"""
    if deal_id not in deals_db:
        raise HTTPException(status_code=404, detail=f"Deal with ID {deal_id} not found")

    return deals_db[deal_id]

def update_deal(deal_id: str, deal_update: DealUpdate) -> Deal:
    """Update a deal"""
    # Check if the deal exists
    if deal_id not in deals_db:
        raise HTTPException(status_code=404, detail=f"Deal with ID {deal_id} not found")

    # Get the existing deal
    existing_deal = deals_db[deal_id]

    # Create a dictionary from the existing deal
    existing_deal_dict = {
        "id": existing_deal.id,
        "project_name": existing_deal.project_name,
        "location": existing_deal.location,
        "property_type": existing_deal.property_type,
        "acquisition_price": existing_deal.acquisition_price,
        "construction_cost": existing_deal.construction_cost,
        "square_footage": existing_deal.square_footage,
        "projected_rent_per_sf": existing_deal.projected_rent_per_sf,
        "vacancy_rate": existing_deal.vacancy_rate,
        "operating_expenses_per_sf": existing_deal.operating_expenses_per_sf,
        "exit_cap_rate": existing_deal.exit_cap_rate,
        "underwriting_result": existing_deal.underwriting_result,
        "ai_memo": existing_deal.ai_memo,
        "status": existing_deal.status,
        "created_at": existing_deal.created_at,
        "updated_at": existing_deal.updated_at
    }

    # Create a dictionary from the update data, excluding None values
    update_data = {k: v for k, v in deal_update.model_dump().items() if v is not None}

    # Update the existing deal data
    existing_deal_dict.update(update_data)

    # Update the updated_at timestamp
    existing_deal_dict["updated_at"] = datetime.now()

    # Create a new Deal object with the updated data
    updated_deal = Deal(**existing_deal_dict)

    # Save to the in-memory database
    deals_db[deal_id] = updated_deal

    return updated_deal

def delete_deal(deal_id: str) -> Dict[str, str]:
    """Delete a deal"""
    # Check if the deal exists
    if deal_id not in deals_db:
        raise HTTPException(status_code=404, detail=f"Deal with ID {deal_id} not found")

    # Delete the deal
    del deals_db[deal_id]

    return {"message": f"Deal with ID {deal_id} deleted"}

# ----------------- ROUTES -----------------

@app.post("/api/calculate-roi", response_model=RoiResponse, tags=["Calculations"])
async def calculate_roi_route(request: RoiRequest):
    """
    Calculate ROI for a property

    Args:
        request: The ROI request containing property price and annual rental income

    Returns:
        ROI response with calculated ROI percentage
    """
    return calculate_roi(request)

@app.post("/api/analyze-text", response_model=TextAnalysisResponse, tags=["Analysis"])
async def analyze_text_route(request: TextAnalysisRequest):
    """
    Analyze real estate text

    Args:
        request: The text analysis request containing the text to analyze

    Returns:
        Text analysis response with summary, key points, and sentiment
    """
    return analyze_text(request)

@app.post("/api/generate-memo", response_model=InvestmentMemoResponse, tags=["Generation"])
async def generate_investment_memo_route(request: InvestmentMemoRequest):
    """
    Generate an investment memo for a commercial real estate property

    Args:
        request: The investment memo request containing property details

    Returns:
        Investment memo response with generated memo
    """
    return generate_investment_memo(request)

@app.post("/api/underwrite", response_model=UnderwritingResponse, tags=["Underwriting"])
async def underwrite_property_route(request: UnderwritingRequest):
    """
    Perform property underwriting calculations and generate an underwriting summary

    Args:
        request: The underwriting request containing property details

    Returns:
        Underwriting response with calculated values and AI-generated underwriting summary
    """
    # Perform underwriting calculations
    calculations = perform_underwriting_calculations(request)

    # Generate underwriting summary
    underwriting_summary = generate_underwriting_summary(request, calculations)

    # Create and return the response
    return UnderwritingResponse(
        project_name=request.project_name,
        location=request.location,
        property_type=request.property_type,
        acquisition_price=request.acquisition_price,
        construction_cost=request.construction_cost,
        square_footage=request.square_footage,
        projected_rent_per_sf=request.projected_rent_per_sf,
        vacancy_rate=request.vacancy_rate,
        operating_expenses_per_sf=request.operating_expenses_per_sf,
        exit_cap_rate=request.exit_cap_rate,
        gross_potential_income=calculations["gross_potential_income"],
        effective_gross_income=calculations["effective_gross_income"],
        operating_expenses=calculations["operating_expenses"],
        net_operating_income=calculations["net_operating_income"],
        project_cost=calculations["project_cost"],
        estimated_exit_value=calculations["estimated_exit_value"],
        development_margin=calculations["development_margin"],
        underwriting_summary=underwriting_summary
    )

@app.post("/api/generate-report", tags=["Reports"])
async def generate_report_route(request: ReportRequest):
    """
    Generate a PDF report for a property based on underwriting calculations

    Args:
        request: The report request containing property details

    Returns:
        A message indicating that PDF generation is not available in this version
    """
    return {"message": "PDF report generation is not available in this version. Please use the full application for this feature."}

@app.post("/api/risk-score", response_model=RiskResponse, tags=["Risk"])
async def calculate_risk_score_route(request: RiskRequest):
    """
    Calculate risk score for a property based on underwriting calculations

    Args:
        request: The risk request containing property details

    Returns:
        Risk response with calculated values and AI-generated risk assessment
    """
    return calculate_risk_score(request)

@app.post("/api/analyze-lease", response_model=LeaseAnalysisResponse, tags=["Lease"])
async def analyze_lease_route(request: LeaseAnalysisRequest):
    """
    Analyze a commercial lease to extract key information

    Args:
        request: The lease analysis request containing the lease text

    Returns:
        Lease analysis response with extracted information
    """
    return analyze_lease(request)

@app.get("/api/portfolio-summary", response_model=PortfolioSummaryResponse, tags=["Portfolio"])
async def get_portfolio_summary_route():
    """
    Get a summary of portfolio metrics across all deals

    Returns:
        Portfolio summary with aggregate metrics
    """
    # Get all deals from the in-memory database
    deals = list(deals_db.values())

    # Check if there are any deals
    if not deals:
        return PortfolioSummaryResponse(
            total_deals=0,
            average_cap_rate=0.0,
            average_development_margin=0.0,
            total_gross_exit_value=0.0,
            average_project_cost=0.0
        )

    # Calculate aggregate metrics
    total_deals = len(deals)

    # Initialize variables for calculations
    sum_cap_rate = 0.0
    sum_development_margin = 0.0
    total_exit_value = 0.0
    sum_project_cost = 0.0

    # Count deals with valid metrics for averaging
    valid_cap_rate_count = 0
    valid_margin_count = 0
    valid_cost_count = 0

    # Process each deal
    for deal in deals:
        # Cap rate
        if hasattr(deal, 'exit_cap_rate') and deal.exit_cap_rate is not None:
            sum_cap_rate += deal.exit_cap_rate
            valid_cap_rate_count += 1

        # For the standalone server, we'll calculate these values on the fly
        # since we don't have underwriting_result stored

        # Calculate project cost
        project_cost = deal.acquisition_price + deal.construction_cost
        sum_project_cost += project_cost
        valid_cost_count += 1

        # Calculate NOI
        gross_potential_income = deal.square_footage * deal.projected_rent_per_sf
        effective_gross_income = gross_potential_income * (1 - deal.vacancy_rate / 100)
        operating_expenses = deal.square_footage * deal.operating_expenses_per_sf
        net_operating_income = effective_gross_income - operating_expenses

        # Calculate exit value
        estimated_exit_value = net_operating_income / (deal.exit_cap_rate / 100)
        total_exit_value += estimated_exit_value

        # Calculate development margin
        development_margin = (estimated_exit_value - project_cost) / project_cost * 100
        sum_development_margin += development_margin
        valid_margin_count += 1

    # Calculate averages (avoid division by zero)
    average_cap_rate = sum_cap_rate / valid_cap_rate_count if valid_cap_rate_count > 0 else 0.0
    average_development_margin = sum_development_margin / valid_margin_count if valid_margin_count > 0 else 0.0
    average_project_cost = sum_project_cost / valid_cost_count if valid_cost_count > 0 else 0.0

    # Create and return the response
    return PortfolioSummaryResponse(
        total_deals=total_deals,
        average_cap_rate=average_cap_rate,
        average_development_margin=average_development_margin,
        total_gross_exit_value=total_exit_value,
        average_project_cost=average_project_cost
    )

@app.post("/api/ai-chat", response_model=AIChatResponse, tags=["AI Chat"], deprecated=True)
async def ai_chat_route(request: AIChatRequest):
    """
    Process an AI chat request about a commercial real estate deal (single message)

    This endpoint is deprecated. Please use the conversational version instead.

    Args:
        request: The AI chat request containing the message and context

    Returns:
        AI chat response with the AI's reply
    """
    # Extract the message and context
    message = request.message
    context = request.context

    # Generate a response based on the question and context
    reply = _generate_ai_chat_response(message, context)

    # Return the response
    return AIChatResponse(reply=reply)

@app.post("/api/ai-chat/v2", response_model=ConversationalAIChatResponse, tags=["AI Chat"])
async def conversational_ai_chat_route(request: ConversationalAIChatRequest):
    """
    Process a conversational AI chat request about a commercial real estate deal

    Args:
        request: The conversational AI chat request containing the message history and context

    Returns:
        Conversational AI chat response with the AI's reply
    """
    # Extract the last user message
    last_user_message = ""
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_user_message = msg.content
            break

    # If no user message found, provide a generic response
    if not last_user_message:
        return ConversationalAIChatResponse(
            reply="I'm here to help with your commercial real estate analysis. What would you like to know about the deal?"
        )

    # Check if context is empty or completely missing
    context = request.context
    context_empty = not context or len(context) == 0

    # Define critical fields for different types of analysis
    basic_fields = ["project_name", "location", "property_type"]
    financial_fields = ["acquisition_price", "construction_cost", "square_footage", "projected_rent_per_sf"]
    risk_fields = ["vacancy_rate", "operating_expenses_per_sf", "exit_cap_rate"]
    all_critical_fields = basic_fields + financial_fields + risk_fields

    # Check which fields are missing
    missing_fields = [field for field in all_critical_fields if field not in context or context.get(field) in [None, "", 0]]

    # Determine the context completeness level
    if context_empty:
        return ConversationalAIChatResponse(
            reply="I'd be happy to help analyze a commercial real estate deal for you. To get started, could you please provide some basic information about the property? I'll need details like the project name, location, property type, acquisition price, construction cost, square footage, projected rent per square foot, vacancy rate, operating expenses, and exit cap rate."
        )

    elif len(missing_fields) > len(all_critical_fields) / 2:
        available_fields = [f for f in all_critical_fields if f not in missing_fields]
        return ConversationalAIChatResponse(
            reply=f"Thanks for providing some initial details about the deal. I see you've included information about {', '.join(available_fields)}. To complete my analysis, I'll also need {', '.join(missing_fields[:5])}{'...' if len(missing_fields) > 5 else ''}. This will help me give you a comprehensive assessment of the investment opportunity."
        )

    elif missing_fields:
        return ConversationalAIChatResponse(
            reply=f"I can work with the information you've provided so far, but to give you a more accurate analysis, it would be helpful to know the {', '.join(missing_fields)} as well. Would you like me to proceed with what we have, or would you prefer to provide the additional details?"
        )

    # If we have complete context, try to answer based on the question
    lower_message = last_user_message.lower()

    # Check for common question types and provide appropriate responses
    if any(term in lower_message for term in ["irr", "return", "yield"]):
        # Calculate a simple IRR estimate based on development margin
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        noi = _calculate_noi(context)
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0
        estimated_irr = development_margin / 5  # Simple approximation

        return ConversationalAIChatResponse(
            reply=f"Based on the information provided for {context.get('project_name', 'the project')}, I estimate the IRR to be approximately {estimated_irr:.1f}%. This is calculated using a development margin of {development_margin:.1f}% and an exit cap rate of {context.get('exit_cap_rate', 7)}%. Would you like me to break down the calculation in more detail?"
        )

    elif any(term in lower_message for term in ["risk", "risky", "safe", "concern"]):
        # Assess risk based on various factors
        risk_factors = []

        # Check development margin
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        noi = _calculate_noi(context)
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0

        if development_margin < 10:
            risk_factors.append(f"The development margin of {development_margin:.1f}% is below the typical threshold of 15% for this type of investment")

        # Check vacancy rate
        vacancy_rate = context.get("vacancy_rate", 5)
        if vacancy_rate > 7:
            risk_factors.append(f"The vacancy rate of {vacancy_rate}% is higher than market average")

        # Check exit cap rate
        exit_cap_rate = context.get("exit_cap_rate", 5)
        if exit_cap_rate > 7:
            risk_factors.append(f"The exit cap rate of {exit_cap_rate}% is relatively high, which could impact your exit value")

        # Check rent assumptions
        property_type = context.get("property_type", "")
        rent_per_sf = context.get("projected_rent_per_sf", 0)

        if property_type.lower() == "office" and rent_per_sf > 50:
            risk_factors.append(f"The projected rent of ${rent_per_sf}/SF for office space seems aggressive in the current market")
        elif property_type.lower() == "retail" and rent_per_sf > 40:
            risk_factors.append(f"The projected rent of ${rent_per_sf}/SF for retail space seems aggressive given e-commerce competition")

        if not risk_factors:
            risk_factors.append("Based on the provided metrics, this appears to be a relatively balanced investment with no major red flags")

        risk_assessment = "\n".join([f"- {factor}" for factor in risk_factors])
        return ConversationalAIChatResponse(
            reply=f"Here's my risk assessment for {context.get('project_name', 'the project')}:\n\n{risk_assessment}\n\nWould you like me to suggest any risk mitigation strategies?"
        )

    elif any(term in lower_message for term in ["summarize", "summary", "overview", "memo"]):
        # Generate a deal summary
        project_cost = context.get("acquisition_price", 0) + context.get("construction_cost", 0)
        price_per_sf = project_cost / context.get("square_footage", 1) if context.get("square_footage", 0) > 0 else 0
        noi = _calculate_noi(context)
        cap_rate = (noi / project_cost) * 100 if project_cost > 0 else 0
        exit_value = noi / (context.get("exit_cap_rate", 7) / 100)
        development_margin = ((exit_value - project_cost) / project_cost) * 100 if project_cost > 0 else 0

        summary = f"""## {context.get('project_name', 'Investment')} Summary

**Property Overview:**
- Location: {context.get('location', 'N/A')}
- Property Type: {context.get('property_type', 'N/A')}
- Size: {context.get('square_footage', 0):,.0f} SF

**Financial Metrics:**
- Total Project Cost: ${project_cost:,.2f} (${price_per_sf:.2f}/SF)
- Projected NOI: ${noi:,.2f}
- Going-in Cap Rate: {cap_rate:.2f}%
- Exit Cap Rate: {context.get('exit_cap_rate', 0)}%
- Development Margin: {development_margin:.2f}%

**Investment Thesis:**
This {context.get('property_type', '')} investment in {context.get('location', '')} presents a {_assess_margin(development_margin)} opportunity with a projected development margin of {development_margin:.2f}%."""

        return ConversationalAIChatResponse(
            reply=f"{summary}\n\nWould you like me to generate a more detailed report or focus on any specific aspect of this investment?"
        )

    else:
        # For other types of questions, use the existing handler with conversational enhancements
        reply = _generate_ai_chat_response(last_user_message, context)

        # Make the response more conversational
        if "?" not in last_user_message and len(last_user_message.split()) < 5:
            reply = f"Based on your input about {context.get('project_name', 'the project')}, {reply.lower()}"

        return ConversationalAIChatResponse(reply=reply)

def _assess_cap_rate(cap_rate: float) -> str:
    """Assess whether a cap rate is favorable"""
    if cap_rate < 4:
        return "very aggressive"
    elif cap_rate < 5:
        return "aggressive"
    elif cap_rate < 6:
        return "moderate"
    elif cap_rate < 7:
        return "conservative"
    else:
        return "very conservative"


def _assess_margin(margin: float) -> str:
    """Assess whether a development margin is favorable"""
    if margin < 10:
        return "below market expectations"
    elif margin < 15:
        return "within market expectations"
    elif margin < 20:
        return "favorable"
    else:
        return "highly favorable"


def _calculate_noi(context: Dict[str, Any]) -> float:
    """Calculate Net Operating Income based on context"""
    square_footage = context.get("square_footage", 0)
    rent_per_sf = context.get("projected_rent_per_sf", 0)
    vacancy_rate = context.get("vacancy_rate", 5)
    op_ex_per_sf = context.get("operating_expenses_per_sf", 0)

    # Calculate Gross Potential Income (GPI)
    gpi = square_footage * rent_per_sf

    # Calculate Effective Gross Income (EGI)
    egi = gpi * (1 - vacancy_rate / 100)

    # Calculate Operating Expenses
    op_ex = square_footage * op_ex_per_sf

    # Calculate Net Operating Income (NOI)
    noi = egi - op_ex

    return noi


def _assess_vacancy(vacancy_rate: float, property_type: str) -> str:
    """Assess whether a vacancy rate is favorable"""
    if property_type.lower() == "multifamily":
        if vacancy_rate < 3:
            return "very low"
        elif vacancy_rate < 5:
            return "low"
        elif vacancy_rate < 8:
            return "average"
        else:
            return "high"
    else:  # Commercial
        if vacancy_rate < 5:
            return "very low"
        elif vacancy_rate < 8:
            return "low"
        elif vacancy_rate < 12:
            return "average"
        else:
            return "high"


def _generate_ai_chat_response(message: str, context: Dict[str, Any]) -> str:
    """Generate an AI response to a question about a deal"""
    # Extract key metrics from the context
    message_lower = message.lower()

    # Calculate some basic metrics
    acquisition_price = context.get("acquisition_price", 0)
    construction_cost = context.get("construction_cost", 0)
    square_footage = context.get("square_footage", 1)  # Avoid division by zero
    projected_rent_per_sf = context.get("projected_rent_per_sf", 0)
    vacancy_rate = context.get("vacancy_rate", 0)
    operating_expenses_per_sf = context.get("operating_expenses_per_sf", 0)
    exit_cap_rate = context.get("exit_cap_rate", 0)

    # Calculate NOI
    gross_potential_income = square_footage * projected_rent_per_sf
    effective_gross_income = gross_potential_income * (1 - vacancy_rate / 100)
    operating_expenses = square_footage * operating_expenses_per_sf
    net_operating_income = effective_gross_income - operating_expenses

    # Calculate total project cost
    project_cost = acquisition_price + construction_cost

    # Calculate estimated exit value
    estimated_exit_value = 0
    if exit_cap_rate > 0:
        estimated_exit_value = net_operating_income / (exit_cap_rate / 100)

    # Calculate development margin
    development_margin = 0
    if project_cost > 0:
        development_margin = (estimated_exit_value - project_cost) / project_cost * 100

    # Calculate price per square foot
    price_per_sf = 0
    if square_footage > 0:
        price_per_sf = project_cost / square_footage

    # Generate a response based on the question
    if "irr" in message_lower or "return" in message_lower:
        # Estimate a plausible IRR based on the development margin
        estimated_irr = development_margin / 5  # Simple approximation
        return f"Based on the provided metrics, the projected IRR for the {context.get('project_name', 'project')} is estimated at approximately {estimated_irr:.1f}%, assuming a {exit_cap_rate}% exit cap rate and standard market conditions."

    elif "cap rate" in message_lower:
        return f"The exit cap rate for the {context.get('project_name', 'project')} is {exit_cap_rate}%, which is {_assess_cap_rate(exit_cap_rate)} for a {context.get('property_type', 'commercial')} property in {context.get('location', 'this market')}."

    elif "noi" in message_lower or "net operating income" in message_lower:
        return f"The projected Net Operating Income (NOI) for the {context.get('project_name', 'project')} is ${net_operating_income:,.2f}, based on the provided rent and expense assumptions."

    elif "margin" in message_lower or "profit" in message_lower:
        return f"The development margin for the {context.get('project_name', 'project')} is projected at {development_margin:.1f}%, which is {_assess_margin(development_margin)} for a {context.get('property_type', 'commercial')} development."

    elif "cost" in message_lower or "budget" in message_lower:
        return f"The total project cost for the {context.get('project_name', 'project')} is ${project_cost:,.2f} (${price_per_sf:.2f}/SF), including acquisition (${acquisition_price:,.2f}) and construction (${construction_cost:,.2f})."

    elif "rent" in message_lower or "income" in message_lower:
        return f"The projected rent for the {context.get('project_name', 'project')} is ${projected_rent_per_sf:.2f}/SF, resulting in a gross potential income of ${gross_potential_income:,.2f} annually."

    elif "vacancy" in message_lower:
        return f"The projected vacancy rate for the {context.get('project_name', 'project')} is {vacancy_rate}%, which is {_assess_vacancy(vacancy_rate, context.get('property_type', 'commercial'))} for a {context.get('property_type', 'commercial')} property in {context.get('location', 'this market')}."

    elif "exit" in message_lower or "sale" in message_lower:
        return f"The estimated exit value for the {context.get('project_name', 'project')} is ${estimated_exit_value:,.2f}, based on a {exit_cap_rate}% cap rate applied to the projected NOI of ${net_operating_income:,.2f}."

    else:
        return f"Based on the provided metrics, the {context.get('project_name', 'project')} shows a development margin of {development_margin:.1f}% with a projected NOI of ${net_operating_income:,.2f}. The total project cost is ${project_cost:,.2f} (${price_per_sf:.2f}/SF) with an estimated exit value of ${estimated_exit_value:,.2f} at a {exit_cap_rate}% cap rate."

@app.post("/api/deals", response_model=Deal, tags=["Deals"])
async def create_deal_route(deal: DealCreate):
    """
    Create a new commercial real estate deal

    Args:
        deal: The deal data to create

    Returns:
        The created deal with ID and timestamps
    """
    return create_deal(deal)

@app.get("/api/deals", response_model=DealList, tags=["Deals"])
async def get_deals_route(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """
    Get all commercial real estate deals

    Args:
        skip: Number of deals to skip (for pagination)
        limit: Maximum number of deals to return (for pagination)
        status: Filter deals by status (optional)

    Returns:
        List of deals
    """
    deals = get_deals(skip, limit, status)
    return DealList(deals=deals, total=len(deals))

@app.get("/api/deals/{deal_id}", response_model=Deal, tags=["Deals"])
async def get_deal_route(deal_id: str):
    """
    Get a commercial real estate deal by ID

    Args:
        deal_id: The ID of the deal to get

    Returns:
        The deal with the specified ID
    """
    return get_deal(deal_id)

@app.put("/api/deals/{deal_id}", response_model=Deal, tags=["Deals"])
async def update_deal_route(deal_id: str, deal_update: DealUpdate):
    """
    Update a commercial real estate deal

    Args:
        deal_id: The ID of the deal to update
        deal_update: The deal data to update

    Returns:
        The updated deal
    """
    return update_deal(deal_id, deal_update)

@app.delete("/api/deals/{deal_id}", tags=["Deals"])
async def delete_deal_route(deal_id: str):
    """
    Delete a commercial real estate deal

    Args:
        deal_id: The ID of the deal to delete

    Returns:
        A message indicating the deal was deleted
    """
    return delete_deal(deal_id)

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint

    Returns:
        A welcome message
    """
    return {
        "message": "Welcome to the CRE Platform API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
