from pydantic import BaseModel, Field, UUID4, validator
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid


class OptimizationConstraints(BaseModel):
    min_dscr: float = Field(1.25, description="Minimum Debt Service Coverage Ratio")
    max_leverage: float = Field(0.75, description="Maximum Leverage Ratio")


class OptimizationRequest(BaseModel):
    fund_id: UUID4
    target_horizon_years: int = Field(..., ge=1, le=10, description="Optimization horizon in years")
    constraints: OptimizationConstraints = Field(default_factory=OptimizationConstraints)


class OptimizationResponse(BaseModel):
    run_id: UUID4
    status: str
    message: str


class OptimizerActionResponse(BaseModel):
    id: UUID4
    asset_id: UUID4
    month: datetime
    action_type: str
    confidence_score: float
    details: Optional[Dict[str, Any]] = None


class OptimizationRunDetail(BaseModel):
    id: UUID4
    fund_id: UUID4
    start_timestamp: datetime
    horizon_months: int
    optimized_irr: Optional[float] = None
    baseline_irr: Optional[float] = None
    status: str
    actions: List[OptimizerActionResponse]
    constraints: Dict[str, float]
    
    @property
    def irr_improvement(self) -> Optional[float]:
        """Calculate the IRR improvement percentage"""
        if self.optimized_irr is not None and self.baseline_irr is not None and self.baseline_irr > 0:
            return ((self.optimized_irr - self.baseline_irr) / self.baseline_irr) * 100
        return None
