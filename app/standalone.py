from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskRequest(BaseModel):
    """Request model for risk score calculation"""
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


class RiskResponse(BaseModel):
    """Response model for risk score calculation"""
    project_name: str
    location: str
    property_type: str
    
    # Financial inputs
    acquisition_price: float
    construction_cost: float
    square_footage: float
    projected_rent_per_sf: float
    vacancy_rate: float
    operating_expenses_per_sf: float
    exit_cap_rate: float
    
    # Calculated values
    net_operating_income: float
    project_cost: float
    estimated_exit_value: float
    development_margin: float
    
    # Risk assessment
    risk_score: str
    flags: List[str]


@app.post("/api/risk-score", response_model=RiskResponse)
async def calculate_risk_score(request: RiskRequest):
    """
    Calculate risk score for a property based on underwriting calculations
    
    Args:
        request: The risk request containing property details
        
    Returns:
        Risk response with calculated values and risk assessment
    """
    try:
        # Calculate financial metrics
        gross_potential_income = request.square_footage * request.projected_rent_per_sf
        effective_gross_income = gross_potential_income * (1 - request.vacancy_rate / 100)
        operating_expenses = request.square_footage * request.operating_expenses_per_sf
        net_operating_income = effective_gross_income - operating_expenses
        project_cost = request.acquisition_price + request.construction_cost
        estimated_exit_value = net_operating_income / (request.exit_cap_rate / 100)
        development_margin = (estimated_exit_value - project_cost) / project_cost * 100
        
        # Determine risk score based on development margin
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
            net_operating_income=net_operating_income,
            project_cost=project_cost,
            estimated_exit_value=estimated_exit_value,
            development_margin=development_margin,
            risk_score=risk_score,
            flags=flags
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating risk score: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
