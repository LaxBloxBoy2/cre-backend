import os
import json
import requests
from fastapi import HTTPException
from ..schemas.risk_schema import RiskRequest, RiskResponse
from ..underwriting_service import _perform_underwriting_calculations


async def calculate_risk_score(request: RiskRequest) -> RiskResponse:
    """
    Calculate risk score for a property based on underwriting calculations
    
    Args:
        request: The risk request containing property details
        
    Returns:
        Risk response with calculated values and AI-generated risk assessment
        
    Raises:
        HTTPException: If there's an error with the API request
    """
    try:
        # Perform underwriting calculations
        calculations = _perform_underwriting_calculations(request)
        
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
        
        # Generate risk assessment
        if use_fallback:
            risk_score, flags = _get_fallback_risk_assessment(request, calculations)
        else:
            try:
                risk_score, flags = await _generate_ai_risk_assessment(request, calculations)
            except Exception as e:
                print(f"Error calling Fireworks API: {str(e)}. Using fallback response.")
                os.environ["USE_FALLBACK"] = "true"
                risk_score, flags = _get_fallback_risk_assessment(request, calculations)
        
        # Create and return the response
        response = RiskResponse(
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
            net_operating_income=calculations["net_operating_income"],
            project_cost=calculations["project_cost"],
            estimated_exit_value=calculations["estimated_exit_value"],
            development_margin=calculations["development_margin"],
            
            # Risk assessment
            risk_score=risk_score,
            flags=flags
        )
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating risk score: {str(e)}")


async def _generate_ai_risk_assessment(request: RiskRequest, calculations: dict) -> tuple:
    """
    Generate a risk assessment using DeepSeek model via Fireworks API
    
    Args:
        request: The risk request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        Tuple of (risk_score, flags)
        
    Raises:
        requests.RequestException: If there's an error with the API request
    """
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
    
    # Create a prompt for the risk assessment
    prompt = _create_risk_assessment_prompt(request, calculations)
    
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
                "content": "You are an expert commercial real estate risk analyst. Your task is to assess the risk level of real estate investments based on financial data and provide specific risk flags."
            },
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500,
        "temperature": 0.3
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
    assessment = response_json["choices"][0]["message"]["content"]
    
    # Parse the response to extract risk score and flags
    try:
        # Try to parse as JSON
        assessment_data = json.loads(assessment)
        risk_score = assessment_data.get("risk_score", "Medium")
        flags = assessment_data.get("flags", [])
    except json.JSONDecodeError:
        # If not valid JSON, try to extract information from text
        risk_score = "Medium"  # Default
        flags = []
        
        # Extract risk score
        if "risk_score" in assessment.lower():
            if "low" in assessment.lower():
                risk_score = "Low"
            elif "high" in assessment.lower():
                risk_score = "High"
            elif "medium" in assessment.lower():
                risk_score = "Medium"
        
        # Extract flags
        lines = assessment.split("\n")
        for line in lines:
            line = line.strip()
            if line.startswith("-") or line.startswith("*"):
                flags.append(line.lstrip("- *").strip())
            elif ":" in line and not line.startswith("{") and not line.startswith('"'):
                parts = line.split(":", 1)
                if len(parts) == 2 and len(parts[1].strip()) > 0:
                    flags.append(parts[1].strip())
        
        # Limit to 3 flags
        flags = flags[:3]
    
    # Ensure risk score is one of the expected values
    if risk_score not in ["Low", "Medium", "High"]:
        risk_score = "Medium"
    
    # Ensure we have at least one flag
    if not flags:
        flags = _generate_default_flags(request, calculations)
    
    return risk_score, flags


def _create_risk_assessment_prompt(request: RiskRequest, calculations: dict) -> str:
    """
    Create a prompt for the risk assessment based on the request data and calculations
    
    Args:
        request: The risk request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        Prompt for the AI model
    """
    # Create a JSON representation of the underwriting data
    underwriting_data = {
        "project_name": request.project_name,
        "location": request.location,
        "property_type": request.property_type,
        "acquisition_price": request.acquisition_price,
        "construction_cost": request.construction_cost,
        "square_footage": request.square_footage,
        "projected_rent_per_sf": request.projected_rent_per_sf,
        "vacancy_rate": request.vacancy_rate,
        "operating_expenses_per_sf": request.operating_expenses_per_sf,
        "exit_cap_rate": request.exit_cap_rate,
        "net_operating_income": calculations["net_operating_income"],
        "project_cost": calculations["project_cost"],
        "estimated_exit_value": calculations["estimated_exit_value"],
        "development_margin": calculations["development_margin"]
    }
    
    prompt = f"""Given this underwriting data: {json.dumps(underwriting_data, indent=2)}, provide a risk score (Low, Medium, High) and list 2-3 reasons for the rating based on financial assumptions.

Please respond with a JSON object in the following format:
{{
  "risk_score": "Low|Medium|High",
  "flags": [
    "Reason 1",
    "Reason 2",
    "Reason 3"
  ]
}}

Focus on key risk factors such as:
- Development margin (below 10% is high risk, 10-15% is medium risk, above 15% is low risk)
- Vacancy rate (above 7% is high risk)
- Exit cap rate (above 7% is high risk)
- Rent assumptions compared to market averages
- Location-specific risks
- Property type risks in the current market

Your assessment should be concise and focused on the most important risk factors."""
    
    return prompt


def _get_fallback_risk_assessment(request: RiskRequest, calculations: dict) -> tuple:
    """
    Provide a fallback response for risk assessment
    
    Args:
        request: The risk request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        Tuple of (risk_score, flags)
    """
    # Determine risk score based on development margin
    development_margin = calculations["development_margin"]
    
    if development_margin < 10:
        risk_score = "High"
    elif development_margin < 15:
        risk_score = "Medium"
    else:
        risk_score = "Low"
    
    # Generate risk flags
    flags = _generate_default_flags(request, calculations)
    
    return risk_score, flags


def _generate_default_flags(request: RiskRequest, calculations: dict) -> list:
    """
    Generate default risk flags based on the request data and calculations
    
    Args:
        request: The risk request containing property details
        calculations: Dictionary with calculated values
        
    Returns:
        List of risk flags
    """
    flags = []
    
    # Check development margin
    development_margin = calculations["development_margin"]
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
    
    # Check rent assumptions
    if request.property_type == "Office" and request.projected_rent_per_sf < 20:
        flags.append(f"Low projected rent of ${request.projected_rent_per_sf:.2f} per SF for office space")
    elif request.property_type == "Retail" and request.projected_rent_per_sf < 15:
        flags.append(f"Low projected rent of ${request.projected_rent_per_sf:.2f} per SF for retail space")
    elif request.property_type == "Industrial" and request.projected_rent_per_sf < 8:
        flags.append(f"Low projected rent of ${request.projected_rent_per_sf:.2f} per SF for industrial space")
    elif request.property_type == "Multifamily" and request.projected_rent_per_sf < 1.5:
        flags.append(f"Low projected rent of ${request.projected_rent_per_sf:.2f} per SF for multifamily")
    
    # Ensure we have at least one flag
    if not flags:
        flags.append("General market volatility and economic uncertainty")
    
    # Limit to 3 flags
    return flags[:3]
