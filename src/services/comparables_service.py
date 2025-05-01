import os
import json
import requests
import random
from fastapi import HTTPException
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..schemas.comparables_schema import ComparablesRequest, ComparablesResponse, ComparableProperty
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

# Sample comparable properties by location and property type
SAMPLE_COMPS = {
    "Austin": {
        "Multifamily": [
            {"name": "Sunset Lofts", "cap_rate": 5.6, "noi": 1200000, "price_per_sf": 325, "square_footage": 45000},
            {"name": "Maple Grove", "cap_rate": 5.8, "noi": 950000, "price_per_sf": 310, "square_footage": 38000},
            {"name": "The Residences at Domain", "cap_rate": 5.4, "noi": 1500000, "price_per_sf": 340, "square_footage": 52000},
            {"name": "Barton Creek Apartments", "cap_rate": 5.7, "noi": 1100000, "price_per_sf": 315, "square_footage": 42000},
            {"name": "Riverside Towers", "cap_rate": 5.9, "noi": 850000, "price_per_sf": 300, "square_footage": 35000}
        ],
        "Office": [
            {"name": "Tech Ridge Center", "cap_rate": 6.2, "noi": 2200000, "price_per_sf": 420, "square_footage": 65000},
            {"name": "Downtown Plaza", "cap_rate": 6.0, "noi": 2500000, "price_per_sf": 450, "square_footage": 70000},
            {"name": "Congress Avenue Tower", "cap_rate": 5.9, "noi": 2800000, "price_per_sf": 460, "square_footage": 75000},
            {"name": "Westlake Office Park", "cap_rate": 6.1, "noi": 2000000, "price_per_sf": 430, "square_footage": 60000},
            {"name": "South Austin Business Center", "cap_rate": 6.3, "noi": 1800000, "price_per_sf": 410, "square_footage": 55000}
        ],
        "Retail": [
            {"name": "Arboretum Market", "cap_rate": 6.5, "noi": 1800000, "price_per_sf": 380, "square_footage": 50000},
            {"name": "South Congress Shops", "cap_rate": 6.3, "noi": 2000000, "price_per_sf": 400, "square_footage": 55000},
            {"name": "Lakeline Mall Outparcel", "cap_rate": 6.6, "noi": 1600000, "price_per_sf": 370, "square_footage": 45000},
            {"name": "Domain Retail", "cap_rate": 6.2, "noi": 2200000, "price_per_sf": 410, "square_footage": 60000},
            {"name": "Southpark Meadows", "cap_rate": 6.4, "noi": 1900000, "price_per_sf": 390, "square_footage": 52000}
        ],
        "Industrial": [
            {"name": "MetCenter Business Park", "cap_rate": 7.0, "noi": 1500000, "price_per_sf": 250, "square_footage": 80000},
            {"name": "North Austin Industrial", "cap_rate": 7.2, "noi": 1300000, "price_per_sf": 240, "square_footage": 70000},
            {"name": "Southeast Distribution Center", "cap_rate": 7.1, "noi": 1400000, "price_per_sf": 245, "square_footage": 75000},
            {"name": "Airport Commerce Park", "cap_rate": 7.3, "noi": 1200000, "price_per_sf": 235, "square_footage": 65000},
            {"name": "Southside Logistics", "cap_rate": 7.4, "noi": 1100000, "price_per_sf": 230, "square_footage": 60000}
        ]
    },
    "Dallas": {
        "Multifamily": [
            {"name": "Uptown Heights", "cap_rate": 5.5, "noi": 1300000, "price_per_sf": 330, "square_footage": 48000},
            {"name": "Knox Henderson Residences", "cap_rate": 5.7, "noi": 1100000, "price_per_sf": 320, "square_footage": 42000},
            {"name": "Victory Park Apartments", "cap_rate": 5.4, "noi": 1500000, "price_per_sf": 345, "square_footage": 54000},
            {"name": "Deep Ellum Lofts", "cap_rate": 5.8, "noi": 950000, "price_per_sf": 315, "square_footage": 38000},
            {"name": "Lakewood Living", "cap_rate": 5.6, "noi": 1200000, "price_per_sf": 325, "square_footage": 45000}
        ],
        "Office": [
            {"name": "Uptown Tower", "cap_rate": 6.0, "noi": 2600000, "price_per_sf": 455, "square_footage": 72000},
            {"name": "Downtown Dallas Plaza", "cap_rate": 5.9, "noi": 2800000, "price_per_sf": 465, "square_footage": 76000},
            {"name": "North Dallas Business Park", "cap_rate": 6.1, "noi": 2200000, "price_per_sf": 440, "square_footage": 65000},
            {"name": "Galleria Office Center", "cap_rate": 5.8, "noi": 3000000, "price_per_sf": 470, "square_footage": 80000},
            {"name": "Las Colinas Corporate", "cap_rate": 6.2, "noi": 2000000, "price_per_sf": 430, "square_footage": 60000}
        ],
        "Retail": [
            {"name": "NorthPark Outparcel", "cap_rate": 6.2, "noi": 2100000, "price_per_sf": 405, "square_footage": 58000},
            {"name": "Mockingbird Station", "cap_rate": 6.0, "noi": 2300000, "price_per_sf": 415, "square_footage": 62000},
            {"name": "Greenville Avenue Shops", "cap_rate": 6.3, "noi": 1900000, "price_per_sf": 395, "square_footage": 54000},
            {"name": "West Village Retail", "cap_rate": 5.9, "noi": 2400000, "price_per_sf": 420, "square_footage": 64000},
            {"name": "Addison Walk", "cap_rate": 6.4, "noi": 1800000, "price_per_sf": 385, "square_footage": 52000}
        ],
        "Industrial": [
            {"name": "South Dallas Logistics", "cap_rate": 6.8, "noi": 1600000, "price_per_sf": 255, "square_footage": 85000},
            {"name": "DFW Airport Distribution", "cap_rate": 6.7, "noi": 1700000, "price_per_sf": 260, "square_footage": 90000},
            {"name": "Garland Industrial Park", "cap_rate": 7.0, "noi": 1400000, "price_per_sf": 245, "square_footage": 75000},
            {"name": "Mesquite Business Center", "cap_rate": 7.1, "noi": 1300000, "price_per_sf": 240, "square_footage": 70000},
            {"name": "Grand Prairie Warehouse", "cap_rate": 6.9, "noi": 1500000, "price_per_sf": 250, "square_footage": 80000}
        ]
    },
    "New York": {
        "Multifamily": [
            {"name": "Manhattan Towers", "cap_rate": 4.2, "noi": 3500000, "price_per_sf": 950, "square_footage": 60000},
            {"name": "Brooklyn Heights Residences", "cap_rate": 4.5, "noi": 2800000, "price_per_sf": 850, "square_footage": 50000},
            {"name": "Upper East Side Apartments", "cap_rate": 4.0, "noi": 4000000, "price_per_sf": 1000, "square_footage": 65000},
            {"name": "Chelsea Lofts", "cap_rate": 4.3, "noi": 3200000, "price_per_sf": 900, "square_footage": 55000},
            {"name": "Williamsburg Waterfront", "cap_rate": 4.6, "noi": 2500000, "price_per_sf": 800, "square_footage": 45000}
        ],
        "Office": [
            {"name": "Midtown Tower", "cap_rate": 4.8, "noi": 5500000, "price_per_sf": 1200, "square_footage": 100000},
            {"name": "Financial District Plaza", "cap_rate": 4.7, "noi": 6000000, "price_per_sf": 1250, "square_footage": 110000},
            {"name": "Park Avenue Center", "cap_rate": 4.5, "noi": 6500000, "price_per_sf": 1300, "square_footage": 120000},
            {"name": "Times Square Building", "cap_rate": 4.6, "noi": 6200000, "price_per_sf": 1275, "square_footage": 115000},
            {"name": "Hudson Yards Office", "cap_rate": 4.4, "noi": 7000000, "price_per_sf": 1350, "square_footage": 125000}
        ],
        "Retail": [
            {"name": "Fifth Avenue Flagship", "cap_rate": 4.0, "noi": 8000000, "price_per_sf": 2000, "square_footage": 40000},
            {"name": "SoHo Boutique", "cap_rate": 4.2, "noi": 6000000, "price_per_sf": 1800, "square_footage": 35000},
            {"name": "Madison Avenue Shops", "cap_rate": 4.1, "noi": 7000000, "price_per_sf": 1900, "square_footage": 38000},
            {"name": "Herald Square Retail", "cap_rate": 4.3, "noi": 5500000, "price_per_sf": 1700, "square_footage": 33000},
            {"name": "Union Square Stores", "cap_rate": 4.4, "noi": 5000000, "price_per_sf": 1600, "square_footage": 30000}
        ],
        "Industrial": [
            {"name": "Queens Logistics Center", "cap_rate": 5.5, "noi": 3000000, "price_per_sf": 400, "square_footage": 150000},
            {"name": "Bronx Distribution Facility", "cap_rate": 5.7, "noi": 2800000, "price_per_sf": 380, "square_footage": 140000},
            {"name": "Brooklyn Navy Yard", "cap_rate": 5.4, "noi": 3200000, "price_per_sf": 420, "square_footage": 160000},
            {"name": "Staten Island Industrial Park", "cap_rate": 5.8, "noi": 2600000, "price_per_sf": 360, "square_footage": 130000},
            {"name": "Long Island City Warehouse", "cap_rate": 5.6, "noi": 2900000, "price_per_sf": 390, "square_footage": 145000}
        ]
    },
    "Other": {
        "Multifamily": [
            {"name": "Sample Apartments A", "cap_rate": 5.5, "noi": 1200000, "price_per_sf": 300, "square_footage": 45000},
            {"name": "Sample Apartments B", "cap_rate": 5.7, "noi": 1000000, "price_per_sf": 290, "square_footage": 40000},
            {"name": "Sample Apartments C", "cap_rate": 5.3, "noi": 1400000, "price_per_sf": 310, "square_footage": 50000}
        ],
        "Office": [
            {"name": "Sample Office A", "cap_rate": 6.0, "noi": 2000000, "price_per_sf": 400, "square_footage": 60000},
            {"name": "Sample Office B", "cap_rate": 6.2, "noi": 1800000, "price_per_sf": 380, "square_footage": 55000},
            {"name": "Sample Office C", "cap_rate": 5.8, "noi": 2200000, "price_per_sf": 420, "square_footage": 65000}
        ],
        "Retail": [
            {"name": "Sample Retail A", "cap_rate": 6.3, "noi": 1700000, "price_per_sf": 370, "square_footage": 50000},
            {"name": "Sample Retail B", "cap_rate": 6.5, "noi": 1500000, "price_per_sf": 350, "square_footage": 45000},
            {"name": "Sample Retail C", "cap_rate": 6.1, "noi": 1900000, "price_per_sf": 390, "square_footage": 55000}
        ],
        "Industrial": [
            {"name": "Sample Industrial A", "cap_rate": 7.0, "noi": 1300000, "price_per_sf": 230, "square_footage": 70000},
            {"name": "Sample Industrial B", "cap_rate": 7.2, "noi": 1100000, "price_per_sf": 210, "square_footage": 65000},
            {"name": "Sample Industrial C", "cap_rate": 6.8, "noi": 1500000, "price_per_sf": 250, "square_footage": 75000}
        ]
    }
}

async def generate_comparables(
    db: Session,
    deal_id: str,
    request: Optional[ComparablesRequest] = None
) -> ComparablesResponse:
    """
    Generate comparables for a deal
    
    Args:
        db: Database session
        deal_id: Deal ID
        request: Optional comparables request (if not provided, deal data will be used)
        
    Returns:
        Comparables response
    """
    try:
        # Get the deal
        deal = db.query(Deal).filter(Deal.id == deal_id).first()
        if not deal:
            raise HTTPException(status_code=404, detail="Deal not found")
        
        # Use deal data if request is not provided
        if not request:
            request = ComparablesRequest(
                location=deal.location,
                property_type=deal.property_type,
                cap_rate=deal.exit_cap_rate,
                noi=deal.noi if hasattr(deal, 'noi') else None,
                square_footage=deal.square_footage
            )
        
        # Get comparable properties
        comps = get_comparable_properties(request)
        
        # Calculate market average cap rate
        market_avg_cap_rate = sum(comp.cap_rate for comp in comps) / len(comps) if comps else request.cap_rate
        
        # Calculate delta in basis points
        delta_bps = int((request.cap_rate - market_avg_cap_rate) * 100)
        delta_bps_str = f"+{delta_bps}" if delta_bps > 0 else f"{delta_bps}"
        
        # Generate summary
        summary = await generate_comparables_summary(request.cap_rate, market_avg_cap_rate, delta_bps, request.property_type)
        
        # Create response
        response = ComparablesResponse(
            subject_cap_rate=request.cap_rate,
            market_avg_cap_rate=market_avg_cap_rate,
            delta_bps=f"{delta_bps_str} bps",
            comps=comps,
            summary=summary
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Error generating comparables: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating comparables: {str(e)}")

def get_comparable_properties(request: ComparablesRequest) -> List[ComparableProperty]:
    """
    Get comparable properties based on location and property type
    
    Args:
        request: Comparables request
        
    Returns:
        List of comparable properties
    """
    # Normalize location
    location = request.location
    if location not in SAMPLE_COMPS:
        location = "Other"
    
    # Normalize property type
    property_type = request.property_type
    if property_type not in SAMPLE_COMPS[location]:
        property_type = next(iter(SAMPLE_COMPS[location].keys()))
    
    # Get comparable properties
    all_comps = SAMPLE_COMPS[location][property_type]
    
    # Select 3-5 random comps
    num_comps = min(len(all_comps), random.randint(3, 5))
    selected_comps = random.sample(all_comps, num_comps)
    
    # Convert to ComparableProperty objects
    comp_objects = []
    for comp in selected_comps:
        comp_objects.append(
            ComparableProperty(
                name=comp["name"],
                location=location,
                property_type=property_type,
                cap_rate=comp["cap_rate"],
                noi=comp["noi"],
                price_per_sf=comp["price_per_sf"],
                square_footage=comp["square_footage"]
            )
        )
    
    return comp_objects

async def generate_comparables_summary(subject_cap_rate: float, market_avg_cap_rate: float, delta_bps: int, property_type: str) -> str:
    """
    Generate a summary of the comparables analysis using Fireworks API
    
    Args:
        subject_cap_rate: Cap rate of the subject property
        market_avg_cap_rate: Average cap rate of comparable properties
        delta_bps: Difference between subject and market cap rates in basis points
        property_type: Type of property
        
    Returns:
        Summary of the comparables analysis
    """
    try:
        # Check if we should use a fallback response
        use_fallback = os.getenv("USE_FALLBACK", "false").lower() == "true"
        
        if use_fallback:
            # Generate a fallback summary
            if delta_bps > 50:
                return f"Your cap rate of {subject_cap_rate}% is significantly above the market average of {market_avg_cap_rate}% for similar {property_type} properties. This suggests the deal may be underpriced or have higher risk factors compared to the market."
            elif delta_bps > 10:
                return f"Your cap rate of {subject_cap_rate}% is slightly above the market average of {market_avg_cap_rate}% for similar {property_type} properties. This indicates a potentially favorable acquisition price or slightly higher risk profile."
            elif delta_bps < -50:
                return f"Your cap rate of {subject_cap_rate}% is significantly below the market average of {market_avg_cap_rate}% for similar {property_type} properties. This suggests the deal may be overpriced or have lower risk factors compared to the market."
            elif delta_bps < -10:
                return f"Your cap rate of {subject_cap_rate}% is slightly below the market average of {market_avg_cap_rate}% for similar {property_type} properties. This indicates a potentially premium acquisition price or lower risk profile."
            else:
                return f"Your cap rate of {subject_cap_rate}% is in line with the market average of {market_avg_cap_rate}% for similar {property_type} properties. This suggests the deal is fairly priced relative to market conditions."
        
        # Call the Fireworks API
        fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
        if not fireworks_api_key:
            raise ValueError("Fireworks API key not configured")
        
        # Create system message
        system_message = """You are a commercial real estate investment analyst specializing in market comparisons. 
        Your task is to provide a concise, professional analysis of how a property's cap rate compares to the market average."""
        
        # Create user message
        user_message = f"""Analyze the following cap rate comparison for a {property_type} property:

Subject Property Cap Rate: {subject_cap_rate}%
Market Average Cap Rate: {market_avg_cap_rate}%
Difference: {delta_bps} basis points

Provide a concise 2-3 sentence analysis explaining what this comparison means for the investor. 
Consider whether the property is potentially underpriced, overpriced, or fairly priced relative to the market.
Also consider the risk implications of the cap rate difference."""
        
        # Call the Fireworks API
        headers = {
            "Authorization": f"Bearer {fireworks_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "accounts/fireworks/models/llama-v3-8b-instruct",
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 200,
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
        summary = response_json["choices"][0]["message"]["content"]
        
        return summary
    
    except Exception as e:
        logger.error(f"Error generating comparables summary: {str(e)}")
        
        # Return a fallback summary
        if delta_bps > 50:
            return f"Your cap rate of {subject_cap_rate}% is significantly above the market average of {market_avg_cap_rate}% for similar {property_type} properties. This suggests the deal may be underpriced or have higher risk factors compared to the market."
        elif delta_bps > 10:
            return f"Your cap rate of {subject_cap_rate}% is slightly above the market average of {market_avg_cap_rate}% for similar {property_type} properties. This indicates a potentially favorable acquisition price or slightly higher risk profile."
        elif delta_bps < -50:
            return f"Your cap rate of {subject_cap_rate}% is significantly below the market average of {market_avg_cap_rate}% for similar {property_type} properties. This suggests the deal may be overpriced or have lower risk factors compared to the market."
        elif delta_bps < -10:
            return f"Your cap rate of {subject_cap_rate}% is slightly below the market average of {market_avg_cap_rate}% for similar {property_type} properties. This indicates a potentially premium acquisition price or lower risk profile."
        else:
            return f"Your cap rate of {subject_cap_rate}% is in line with the market average of {market_avg_cap_rate}% for similar {property_type} properties. This suggests the deal is fairly priced relative to market conditions."
