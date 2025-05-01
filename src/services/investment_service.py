import os
import requests
import json
from fastapi import HTTPException
from typing import Dict, Any, List, Optional
from ..schemas.investment_schema import InvestmentMemoRequest, InvestmentMemoResponse
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)


async def generate_investment_memo(request: InvestmentMemoRequest) -> InvestmentMemoResponse:
    """
    Generate an investment memo using DeepSeek model via Fireworks API

    Args:
        request: The investment memo request containing property details

    Returns:
        Investment memo response with the generated memo

    Raises:
        HTTPException: If there's an error with the API request
    """
    # Check if we should use a fallback response
    use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"

    if use_fallback:
        return _get_fallback_memo(request)

    try:
        return await _call_fireworks_api(request)
    except requests.RequestException as e:
        error_message = str(e)
        status_code = 500

        # Check for specific error types and provide more helpful messages
        if "401" in error_message:
            status_code = 401  # Unauthorized
            error_message = "Invalid Fireworks API key. Please check your .env file."
            # Enable fallback mode automatically when API key is invalid
            os.environ["USE_FALLBACK"] = "true"
            return await generate_investment_memo(request)
        elif "402" in error_message or "429" in error_message:
            status_code = 402  # Payment Required
            error_message = "Fireworks API quota exceeded. Using fallback response."
            # Enable fallback mode automatically when quota is exceeded
            os.environ["USE_FALLBACK"] = "true"
            return await generate_investment_memo(request)
        elif "404" in error_message:
            status_code = 400  # Bad Request
            error_message = "The specified model is not available. Please try a different model."
            os.environ["USE_FALLBACK"] = "true"
            return await generate_investment_memo(request)
        else:
            # For any other error, use fallback
            os.environ["USE_FALLBACK"] = "true"
            return await generate_investment_memo(request)

        raise HTTPException(status_code=status_code, detail=error_message)


async def _call_fireworks_api(request: InvestmentMemoRequest) -> InvestmentMemoResponse:
    """Call the Fireworks API to generate an investment memo"""
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")

    # Create a prompt for the investment memo
    prompt = _create_investment_memo_prompt(request)

    # Send the prompt to DeepSeek model via Fireworks API
    headers = {
        "Authorization": f"Bearer {fireworks_api_key}",
        "Content-Type": "application/json"
    }

    # Select the model based on the style
    model = "accounts/fireworks/models/llama-v3-70b-instruct"
    if request.style == "brief":
        # Use a smaller model for brief memos
        model = "accounts/fireworks/models/llama-v3-8b-instruct"

    # Create system message based on style
    system_message = "You are an expert commercial real estate investment advisor. Your task is to create professional investment memos for potential investors. Your memos should be well-structured, data-driven, and persuasive."

    if request.style == "brief":
        system_message += " Create a concise, to-the-point memo that highlights only the most critical information."
    elif request.style == "detailed":
        system_message += " Create a comprehensive memo that covers all aspects of the investment in detail."
    elif request.style == "pitch":
        system_message += " Create a persuasive pitch-style memo that emphasizes the upside potential and minimizes the risks."

    data = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": system_message
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.7
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
    memo = response_json["choices"][0]["message"]["content"]

    return InvestmentMemoResponse(
        memo=memo,
        format=request.format,
        style=request.style
    )


def _create_investment_memo_prompt(request: InvestmentMemoRequest) -> str:
    """Create a prompt for the investment memo based on the request data"""
    # Calculate some basic metrics
    annual_rental_income = request.rental_income * 12
    roi = (annual_rental_income / request.property_price) * 100

    # Use provided cap rate or estimate it
    cap_rate = request.cap_rate if request.cap_rate is not None else roi

    # Use provided NOI or estimate it
    noi = request.noi if request.noi is not None else annual_rental_income * 0.6  # Estimate NOI as 60% of annual rental income

    prompt = f"""
Please create a professional investment memo for a commercial real estate opportunity with the following details:

Property Type: {request.property_type}
Location: {request.location}
Purchase Price: ${request.property_price:,.2f}
Monthly Rental Income: ${request.rental_income:,.2f}
Annual Rental Income: ${annual_rental_income:,.2f}
NOI: ${noi:,.2f}
Estimated ROI: {roi:.2f}%
Cap Rate: {cap_rate:.2f}%
"""

    # Add IRR and DSCR if provided
    if request.projected_irr is not None:
        prompt += f"Projected IRR: {request.projected_irr:.2f}%\n"
    if request.dscr is not None:
        prompt += f"Debt Service Coverage Ratio: {request.dscr:.2f}\n"

    # Add optional details if provided
    if request.occupancy_rate is not None:
        prompt += f"Occupancy Rate: {request.occupancy_rate}%\n"

    if request.year_built is not None:
        prompt += f"Year Built: {request.year_built}\n"

    if request.square_footage is not None:
        prompt += f"Square Footage: {request.square_footage:,} sq ft\n"

    # Add exit strategy if provided
    if request.exit_strategy:
        prompt += f"Exit Strategy: {request.exit_strategy}\n"
    else:
        prompt += "Exit Strategy: Sell in year 5 at the projected exit cap rate\n"

    # Add red flags if provided
    if request.red_flags:
        prompt += f"\nRed Flags: {', '.join(request.red_flags)}\n"

    if request.additional_info:
        prompt += f"\nAdditional Information:\n{request.additional_info}\n"

    # Add tags if provided
    if request.tags:
        prompt += f"\nTags: {', '.join(request.tags)}\n"

    prompt += """
Format the memo as a professional investment pitch with the following sections:
1. Executive Summary
2. Property Overview
3. Location Analysis
4. Financial Analysis (including IRR, DSCR, NOI, and other key metrics)
5. Investment Highlights
6. Red Flags (if any)
7. Exit Strategy
8. AI Recommendation

Make it persuasive and data-driven, highlighting the potential return on investment. Use professional language suitable for sophisticated investors.
"""

    # Customize tone based on tags if provided
    if request.tags:
        if "value-add" in [tag.lower() for tag in request.tags]:
            prompt += "\nEmphasize the value-add potential and opportunities for improvement."
        if "core" in [tag.lower() for tag in request.tags]:
            prompt += "\nEmphasize the stability and long-term income potential."
        if "opportunistic" in [tag.lower() for tag in request.tags]:
            prompt += "\nEmphasize the higher risk but potentially higher returns."
        if "distressed" in [tag.lower() for tag in request.tags]:
            prompt += "\nEmphasize the turnaround potential and current challenges."
        if "development" in [tag.lower() for tag in request.tags]:
            prompt += "\nEmphasize the development potential and timeline."
        if "flagged" in [tag.lower() for tag in request.tags]:
            prompt += "\nInclude a special section highlighting potential red flags or concerns."

    # Customize based on style
    if request.style == "brief":
        prompt += "\nKeep the memo brief and concise, focusing only on the most important information. Limit to 500 words."
    elif request.style == "detailed":
        prompt += "\nProvide a comprehensive analysis with detailed information in each section."
    elif request.style == "pitch":
        prompt += "\nCreate a persuasive pitch that emphasizes the upside potential and presents a compelling investment case."

    # Customize based on format
    if request.format == "markdown":
        prompt += "\nFormat the memo in clean markdown with proper headings, bullet points, and formatting."
    elif request.format == "pdf":
        prompt += "\nFormat the memo in a clean, professional layout suitable for PDF conversion."

    return prompt


def _get_fallback_memo(request: InvestmentMemoRequest) -> InvestmentMemoResponse:
    """Provide a fallback response for investment memo generation"""
    # Calculate some basic metrics
    annual_rental_income = request.rental_income * 12
    roi = (annual_rental_income / request.property_price) * 100
    cap_rate = request.cap_rate if request.cap_rate is not None else roi

    # Use provided NOI or estimate it
    noi = request.noi if request.noi is not None else annual_rental_income * 0.6  # Estimate NOI as 60% of annual rental income

    # Format currency values
    property_price_formatted = f"${request.property_price:,.2f}"
    monthly_rental_formatted = f"${request.rental_income:,.2f}"
    annual_rental_formatted = f"${annual_rental_income:,.2f}"
    noi_formatted = f"${noi:,.2f}"

    # Determine investment quality based on ROI
    if roi > 9:
        quality = "excellent"
        recommendation = "strong buy"
    elif roi > 7:
        quality = "good"
        recommendation = "buy"
    elif roi > 5:
        quality = "fair"
        recommendation = "hold"
    else:
        quality = "below average"
        recommendation = "pass"

    # Get exit strategy
    exit_strategy = request.exit_strategy if request.exit_strategy else f"Sell in year 5 at a {cap_rate:.2f}% cap rate"

    # Create a basic investment memo
    memo = f"""
# INVESTMENT MEMORANDUM

## 1. EXECUTIVE SUMMARY

This memorandum presents an investment opportunity for a {request.property_type} property located in {request.location}. The property is available for {property_price_formatted} and generates {monthly_rental_formatted} in monthly rental income ({annual_rental_formatted} annually). With a projected ROI of {roi:.2f}%, a cap rate of {cap_rate:.2f}%, and an NOI of {noi_formatted}, this represents a {quality} investment opportunity in today's market.

## 2. PROPERTY OVERVIEW

- **Property Type:** {request.property_type}
- **Location:** {request.location}
"""

    # Add optional details if provided
    if request.year_built is not None:
        memo += f"- **Year Built:** {request.year_built}\n"

    if request.square_footage is not None:
        memo += f"- **Square Footage:** {request.square_footage:,} sq ft\n"

    if request.occupancy_rate is not None:
        memo += f"- **Current Occupancy:** {request.occupancy_rate}%\n"

    memo += f"""
## 3. LOCATION ANALYSIS

The property is situated in {request.location}, which offers the following advantages:
- Strategic location with potential for appreciation
- Access to transportation and amenities
- Stable local economy with growth potential

## 4. FINANCIAL ANALYSIS

- **Purchase Price:** {property_price_formatted}
- **Monthly Rental Income:** {monthly_rental_formatted}
- **Annual Rental Income:** {annual_rental_formatted}
- **NOI:** {noi_formatted}
- **ROI:** {roi:.2f}%
- **Cap Rate:** {cap_rate:.2f}%
"""

    # Add IRR and DSCR if provided
    if request.projected_irr is not None:
        memo += f"- **Projected IRR:** {request.projected_irr:.2f}%\n"
    if request.dscr is not None:
        memo += f"- **Debt Service Coverage Ratio:** {request.dscr:.2f}\n"

    memo += f"""

## 5. INVESTMENT HIGHLIGHTS

- Stable cash flow from rental income
- Property located in {request.location} with growth potential
- {quality.capitalize()} return on investment compared to market averages
- Potential for property value appreciation
"""

    # Add Red Flags section
    if request.red_flags:
        memo += f"\n## 6. RED FLAGS\n\n"
        for flag in request.red_flags:
            memo += f"- {flag}\n"
    else:
        memo += f"""
## 6. RISK FACTORS

- Market fluctuations could affect property values
- Changes in local regulations or zoning
- Potential for increased competition in the area
- Maintenance and repair costs may impact returns
"""

    # Add Exit Strategy section
    memo += f"""

## 7. EXIT STRATEGY

{exit_strategy}
"""

    # Add AI Recommendation section
    memo += f"""

## 8. AI RECOMMENDATION

Based on the financial analysis and property characteristics, we recommend a **{recommendation.upper()}** position on this investment opportunity. The {roi:.2f}% ROI represents a {quality} return in the current market environment.
"""

    if request.additional_info:
        memo += f"\n## ADDITIONAL NOTES\n\n{request.additional_info}\n"

    # Add tags section if provided
    if request.tags:
        memo += f"\n## PROPERTY CLASSIFICATION\n\n{', '.join(request.tags)}\n"

    # Adjust memo based on style
    if request.style == "brief":
        # Create a shorter version for brief style
        brief_memo = f"""
# INVESTMENT MEMORANDUM: {request.property_type.upper()} IN {request.location.upper()}

## EXECUTIVE SUMMARY

{request.property_type} property in {request.location} available for {property_price_formatted}. Generates {annual_rental_formatted} annually with {roi:.2f}% ROI and {cap_rate:.2f}% cap rate. {quality.capitalize()} investment opportunity.

## KEY METRICS

- **Price:** {property_price_formatted}
- **NOI:** {noi_formatted}
- **Cap Rate:** {cap_rate:.2f}%
- **ROI:** {roi:.2f}%
"""
        if request.projected_irr is not None:
            brief_memo += f"- **IRR:** {request.projected_irr:.2f}%\n"
        if request.dscr is not None:
            brief_memo += f"- **DSCR:** {request.dscr:.2f}\n"

        brief_memo += f"""

## RECOMMENDATION

**{recommendation.upper()}** - {quality.capitalize()} return potential with {exit_strategy.lower()}.
"""
        memo = brief_memo
    elif request.style == "pitch":
        # Enhance the pitch aspects for pitch style
        memo = memo.replace("Risk Factors", "Managed Risks")
        memo = memo.replace("Red Flags", "Considerations")
        memo = memo.replace("represents a {quality}", f"represents an attractive")

    return InvestmentMemoResponse(
        memo=memo,
        format=request.format,
        style=request.style
    )
