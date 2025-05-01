import os
import re
import requests
from fastapi import HTTPException
from ..schemas.ai_schema import TextAnalysisRequest, TextAnalysisResponse


async def analyze_text(request: TextAnalysisRequest) -> TextAnalysisResponse:
    """
    Analyze text using DeepSeek model via Fireworks API or fallback to built-in analysis
    
    Args:
        request: The text analysis request containing the text to analyze
        
    Returns:
        Text analysis response with the analysis
        
    Raises:
        HTTPException: If there's an error with the API request
    """
    # Check if we should use a fallback response
    use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
    
    if use_fallback:
        return _get_fallback_analysis(request)
    
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
            return await analyze_text(request)
        elif "402" in error_message or "429" in error_message:
            status_code = 402  # Payment Required
            error_message = "Fireworks API quota exceeded. Using fallback response."
            # Enable fallback mode automatically when quota is exceeded
            os.environ["USE_FALLBACK"] = "true"
            return await analyze_text(request)
        elif "404" in error_message:
            status_code = 400  # Bad Request
            error_message = "The specified model is not available. Please try a different model."
            os.environ["USE_FALLBACK"] = "true"
            return await analyze_text(request)
        else:
            # For any other error, use fallback
            os.environ["USE_FALLBACK"] = "true"
            return await analyze_text(request)
        
        raise HTTPException(status_code=status_code, detail=error_message)


async def _call_fireworks_api(request: TextAnalysisRequest) -> TextAnalysisResponse:
    """Call the Fireworks API to analyze text"""
    fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
    
    # Send the text to DeepSeek model via Fireworks API for analysis
    headers = {
        "Authorization": f"Bearer {fireworks_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "accounts/fireworks/models/deepseek-coder-6.7b",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that analyzes text related to commercial real estate."},
            {"role": "user", "content": request.text}
        ],
        "max_tokens": 500
    }
    
    response = requests.post(
        "https://api.fireworks.ai/inference/v1/chat/completions",
        headers=headers,
        json=data,
        timeout=30
    )
    
    # Check if the request was successful
    response.raise_for_status()
    
    # Extract the assistant's response
    response_json = response.json()
    analysis = response_json["choices"][0]["message"]["content"]
    
    return TextAnalysisResponse(analysis=analysis)


def _get_fallback_analysis(request: TextAnalysisRequest) -> TextAnalysisResponse:
    """Provide a fallback response for text analysis"""
    # Check if the text is about property investment with price and rental info
    if "property" in request.text.lower() and "rental" in request.text.lower():
        # Extract numbers from the text if possible
        price_match = re.search(r'\$([\d,]+)', request.text)
        rental_match = re.search(r'rental[^$]*\$([\d,]+)', request.text)
        
        if price_match and rental_match:
            try:
                price = float(price_match.group(1).replace(',', ''))
                rental = float(rental_match.group(1).replace(',', ''))
                annual_rental = rental * 12
                roi = (annual_rental / price) * 100
                cap_rate = roi  # Simplified, in reality cap rate considers expenses
                
                analysis = f"Based on the information provided, the property costs ${price:,.2f} with a monthly rental income of ${rental:,.2f}. \n\n"
                analysis += f"The annual rental income would be ${annual_rental:,.2f}, giving an estimated ROI of {roi:.2f}%. "
                analysis += f"The cap rate (simplified) would be approximately {cap_rate:.2f}%. "
                
                if roi > 9.5:
                    analysis += "This appears to be a strong investment opportunity based on the numbers provided."
                elif roi > 7:
                    analysis += "This appears to be a decent investment opportunity, though you should consider other factors like location, property condition, and potential expenses."
                else:
                    analysis += "This investment may not provide optimal returns. Consider negotiating a better price or finding properties with higher rental income potential."
                    
                return TextAnalysisResponse(analysis=analysis)
            except:
                pass
    
    # Generic fallback response
    return TextAnalysisResponse(
        analysis="Based on the information provided, I would need more details to give a comprehensive analysis. "
                "For commercial real estate investments, consider factors such as location, property condition, "
                "tenant quality, lease terms, and potential expenses including maintenance, property taxes, and insurance. "
                "A thorough financial analysis should include cap rate, cash-on-cash return, and ROI calculations."
    )
