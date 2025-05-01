from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ScenarioBase(BaseModel):
    """Base model for scenario data"""
    var: str = Field(..., description="Variable that was changed (e.g., 'interest', 'exit_cap', 'rent')")
    delta: float = Field(..., description="Delta value (e.g., +0.50, -10%)")
    name: Optional[str] = Field(None, description="Scenario name (e.g., 'Base', 'Stress +50bp')")

class ScenarioCreate(ScenarioBase):
    """Model for creating a new scenario"""
    pass

class ScenarioResponse(ScenarioBase):
    """Model for a scenario response"""
    id: str
    deal_id: str
    irr: Optional[float] = None
    cashflow_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ScenarioList(BaseModel):
    """Model for a list of scenarios"""
    scenarios: List[ScenarioResponse]
    total: int
