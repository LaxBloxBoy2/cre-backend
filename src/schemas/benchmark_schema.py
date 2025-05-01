from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class BenchmarkRequest(BaseModel):
    """Request model for benchmark report generation"""
    deal_ids: List[str] = Field(..., description="List of deal IDs to include in the benchmark")
    market_comparison: bool = Field(True, description="Whether to include market comparison")

class BenchmarkMetric(BaseModel):
    """Model for a benchmark metric"""
    name: str = Field(..., description="The metric name")
    value: float = Field(..., description="The metric value")
    market_value: Optional[float] = Field(None, description="The market value for comparison")
    difference: Optional[float] = Field(None, description="The difference between the value and market value")
    difference_percent: Optional[float] = Field(None, description="The percentage difference")

class BenchmarkResponse(BaseModel):
    """Response model for benchmark report generation"""
    metrics: List[BenchmarkMetric] = Field(..., description="List of benchmark metrics")
    summary: str = Field(..., description="Summary of the benchmark report")
    deal_count: int = Field(..., description="Number of deals included in the benchmark")
    property_types: List[str] = Field(..., description="List of property types included in the benchmark")
    locations: List[str] = Field(..., description="List of locations included in the benchmark")
