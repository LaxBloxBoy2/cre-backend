from pydantic import BaseModel, Field
from typing import Optional, Literal

class MetricExplanationRequest(BaseModel):
    """Request model for metric explanation"""
    metric: Literal["irr", "dscr", "cap_rate", "lease_structure", "exit_cap_rate"] = Field(
        ..., description="The metric to explain"
    )

class MetricExplanationResponse(BaseModel):
    """Response model for metric explanation"""
    metric: str = Field(..., description="The metric name")
    value: float = Field(..., description="The metric value")
    explanation: str = Field(..., description="The explanation of the metric")
    comparison: Optional[str] = Field(None, description="Comparison to industry benchmarks")
