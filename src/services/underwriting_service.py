import os
import requests
from fastapi import HTTPException
from ..schemas.underwriting_schema import UnderwritingRequest, UnderwritingResponse


async def underwrite_property(request: UnderwritingRequest) -> UnderwritingResponse:
    """
    Perform property underwriting calculations and generate an underwriting summary
    
    Args:
        request: The underwriting request containing property details
        
    Returns:
        Underwriting response with calculated values and AI-generated summary
        
    Raises:
        HTTPException: If there's an error with the API request
    """
    # Perform underwriting calculations
    calculations = _perform_underwriting_calculations(request)
    
    # Check if we should use a fallback response
    use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
    
    # Generate underwriting summary
    if use_fallback:
        underwriting_summary = _get_fallback_summary(request, calculations)
    else:
        try:
            underwriting_summary = await _generate_ai_summary(request, calculations)
        except requests.RequestException as e:
            error_message = str(e)
            status_code = 500
            
            # Check for specific error types and provide more helpful messages
            if "401" in error_message:
                print("Invalid Fireworks API key. Using fallback response.")
                # Enable fallback mode automatically when API key is invalid
                os.environ["USE_FALLBACK"] = "true"
                underwriting_summary = _get_fallback_summary(request, calculations)
            elif "402" in error_message or "429" in error_message:
                print("Fireworks API quota exceeded. Using fallback response.")
                # Enable fallback mode automatically when quota is exceeded
                os.environ["USE_FALLBACK"] = "true"
                underwriting_summary = _get_fallback_summary(request, calculations)
            elif "404" in error_message:
                print("The specified model is not available. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                underwriting_summary = _get_fallback_summary(request, calculations)
            else:
                # For any other error, use fallback
                print(f"Error calling Fireworks API: {error_message}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                underwriting_summary = _get_fallback_summary(request, calculations)
    
    # Create and return the response
    response = UnderwritingResponse(
        # Input values
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
        
        # Calculated values
        gross_potential_income=calculations["gross_potential_income"],
        effective_gross_income=calculations["effective_gross_income"],
        operating_expenses=calculations["operating_expenses"],
        net_operating_income=calculations["net_operating_income"],
        project_cost=calculations["project_cost"],
        estimated_exit_value=calculations["estimated_exit_value"],
        development_margin=calculations["development_margin"],
        
        # AI-generated summary
        underwriting_summary=underwriting_summary
    )
    
    return response


def _perform_underwriting_calculations(request: UnderwritingRequest) -> dict:
    """
    Perform underwriting calculations based on the request data
    
    Args:
        request: The underwriting request containing property details
        
    Returns:
        Dictionary with calculated values
    """
    # Calculate Gross Potential Income (GPI)
    gross_potential_income = request.square_footage * request.projected_rent_per_sf
    
    # Calculate Effective Gross Income (EGI)
    effective_gross_income = gross_potential_income * (1 - request.vacancy_rate / 100)
    
    # Calculate Operating Expenses
    operating_expenses = request.square_footage * request.operating_expenses_per_sf
    
    # Calculate Net Operating Income (NOI)
    net_operating_income = effective_gross_income - operating_expenses
    
    # Calculate Project Cost
    project_cost = request.acquisition_price + request.construction_cost
    
    # Calculate Estimated Exit Value
    estimated_exit_value = net_operating_income / (request.exit_cap_rate / 100)
    
    # Calculate Development Margin
    development_margin = (estimated_exit_value - project_cost) / project_cost * 100
    
    # Round all monetary values to 2 decimal places
    calculations = {
        "gross_potential_income": round(gross_potential_income, 2),
        "effective_gross_income": round(effective_gross_income, 2),
        "operating_expenses": round(operating_expenses, 2),
        "net_operating_income": round(net_operating_income, 2),
        "project_cost": round(project_cost, 2),
        "estimated_exit_value": round(estimated_exit_value, 2),
        "development_margin": round(development_margin, 2)
    }
    
    return calculations


async def _generate_ai_summary(request: UnderwritingRequest, calculations: dict) -> str:
    """
    Generate an underwriting summary using DeepSeek model via Fireworks API
    
    Args:
        request: The underwriting request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        AI-generated underwriting summary
        
    Raises:
        requests.RequestException: If there's an error with the API request
    """
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
    
    # Create a prompt for the underwriting summary
    prompt = _create_underwriting_prompt(request, calculations)
    
    # Send the prompt to DeepSeek model via Fireworks API
    headers = {
        "Authorization": f"Bearer {fireworks_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "accounts/fireworks/models/deepseek-coder-6.7b",
        "messages": [
            {
                "role": "system", 
                "content": "You are an expert commercial real estate underwriter. Your task is to create professional underwriting summaries for institutional investors. Your summaries should be well-structured, data-driven, and highlight both opportunities and risks."
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
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
    summary = response_json["choices"][0]["message"]["content"]
    
    return summary


def _create_underwriting_prompt(request: UnderwritingRequest, calculations: dict) -> str:
    """
    Create a prompt for the underwriting summary based on the request data and calculations
    
    Args:
        request: The underwriting request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        Prompt for the AI model
    """
    prompt = f"""Provide an institutional-style underwriting summary for a {request.property_type} project called '{request.project_name}' in {request.location}. The project cost is ${calculations['project_cost']:,.2f}, the projected NOI is ${calculations['net_operating_income']:,.2f}, and the estimated exit cap rate is {request.exit_cap_rate}%. Highlight investment risks, projected value, and the development margin.

Here are the key metrics for the project:

Project Details:
- Project Name: {request.project_name}
- Location: {request.location}
- Property Type: {request.property_type}
- Square Footage: {request.square_footage:,.0f} SF

Financial Metrics:
- Acquisition Price: ${request.acquisition_price:,.2f}
- Construction Cost: ${request.construction_cost:,.2f}
- Total Project Cost: ${calculations['project_cost']:,.2f}
- Projected Rent per SF: ${request.projected_rent_per_sf:.2f}
- Vacancy Rate: {request.vacancy_rate}%
- Operating Expenses per SF: ${request.operating_expenses_per_sf:.2f}

Projected Performance:
- Gross Potential Income (GPI): ${calculations['gross_potential_income']:,.2f}
- Effective Gross Income (EGI): ${calculations['effective_gross_income']:,.2f}
- Operating Expenses: ${calculations['operating_expenses']:,.2f}
- Net Operating Income (NOI): ${calculations['net_operating_income']:,.2f}
- Exit Cap Rate: {request.exit_cap_rate}%
- Estimated Exit Value: ${calculations['estimated_exit_value']:,.2f}
- Development Margin: {calculations['development_margin']:.2f}%

Please provide a comprehensive underwriting summary that includes:
1. Executive Summary
2. Project Overview
3. Market Analysis
4. Financial Analysis
5. Risk Assessment
6. Investment Recommendation

Use professional language suitable for institutional investors.
"""
    
    return prompt


def _get_fallback_summary(request: UnderwritingRequest, calculations: dict) -> str:
    """
    Provide a fallback response for underwriting summary generation
    
    Args:
        request: The underwriting request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        Fallback underwriting summary
    """
    # Determine investment quality based on development margin
    if calculations["development_margin"] > 20:
        quality = "excellent"
        recommendation = "strong buy"
    elif calculations["development_margin"] > 15:
        quality = "good"
        recommendation = "buy"
    elif calculations["development_margin"] > 10:
        quality = "fair"
        recommendation = "hold"
    else:
        quality = "below average"
        recommendation = "pass"
    
    # Create a basic underwriting summary
    summary = f"""# UNDERWRITING SUMMARY: {request.project_name.upper()}

## 1. EXECUTIVE SUMMARY

This underwriting analysis presents an investment opportunity for a {request.property_type} development project called '{request.project_name}' located in {request.location}. The total project cost is ${calculations['project_cost']:,.2f}, with a projected NOI of ${calculations['net_operating_income']:,.2f} and an estimated exit value of ${calculations['estimated_exit_value']:,.2f} based on a {request.exit_cap_rate}% cap rate. The development margin is projected at {calculations['development_margin']:.2f}%, representing a {quality} opportunity in the current market.

## 2. PROJECT OVERVIEW

- **Project Name:** {request.project_name}
- **Location:** {request.location}
- **Property Type:** {request.property_type}
- **Square Footage:** {request.square_footage:,.0f} SF
- **Acquisition Price:** ${request.acquisition_price:,.2f}
- **Construction Cost:** ${request.construction_cost:,.2f}
- **Total Project Cost:** ${calculations['project_cost']:,.2f}

## 3. MARKET ANALYSIS

The subject property is located in {request.location}, which presents the following market characteristics:
- Projected rent of ${request.projected_rent_per_sf:.2f} per square foot
- Market vacancy rate of {request.vacancy_rate}%
- Operating expenses of ${request.operating_expenses_per_sf:.2f} per square foot
- Exit cap rate of {request.exit_cap_rate}%

## 4. FINANCIAL ANALYSIS

- **Gross Potential Income (GPI):** ${calculations['gross_potential_income']:,.2f}
- **Effective Gross Income (EGI):** ${calculations['effective_gross_income']:,.2f}
- **Operating Expenses:** ${calculations['operating_expenses']:,.2f}
- **Net Operating Income (NOI):** ${calculations['net_operating_income']:,.2f}
- **Estimated Exit Value:** ${calculations['estimated_exit_value']:,.2f}
- **Development Margin:** {calculations['development_margin']:.2f}%

## 5. RISK ASSESSMENT

Key risks associated with this investment include:
- Market fluctuations affecting rental rates and vacancy
- Construction cost overruns
- Potential delays in project completion
- Changes in cap rates affecting exit valuation
- Competitive pressures in the {request.location} market
- Regulatory and zoning challenges

## 6. INVESTMENT RECOMMENDATION

Based on the financial analysis and project characteristics, we recommend a **{recommendation.upper()}** position on this investment opportunity. The {calculations['development_margin']:.2f}% development margin represents a {quality} return potential in the current market environment.
"""
    
    return summary
