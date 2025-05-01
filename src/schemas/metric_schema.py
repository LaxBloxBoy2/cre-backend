from pydantic import BaseModel
from typing import Optional

class MetricExplanation(BaseModel):
    """
    Metric explanation schema
    """
    metric: str
    explanation: str
    comparison: Optional[str] = None
    value: Optional[str] = None
