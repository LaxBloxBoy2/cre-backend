from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
import uuid


class WaterfallTierBase(BaseModel):
    tier_order: int = Field(..., description="Order of the tier in the waterfall")
    hurdle: float = Field(..., description="IRR hurdle as a percentage (e.g., 8.0 for 8%)")
    gp_split: float = Field(..., description="GP percentage (e.g., 30.0 for 30%)")
    lp_split: float = Field(..., description="LP percentage (e.g., 70.0 for 70%)")

    @validator('gp_split', 'lp_split')
    def validate_splits(cls, v):
        if v < 0 or v > 100:
            raise ValueError('Split percentages must be between 0 and 100')
        return v

    @validator('hurdle')
    def validate_hurdle(cls, v):
        if v < 0:
            raise ValueError('Hurdle must be a positive number')
        return v


class WaterfallTierCreate(WaterfallTierBase):
    pass


class WaterfallTier(WaterfallTierBase):
    id: str
    structure_id: str

    class Config:
        orm_mode = True


class PromoteStructureBase(BaseModel):
    name: str = Field(..., description="Name of the promote structure")


class PromoteStructureCreate(PromoteStructureBase):
    tiers: List[WaterfallTierCreate] = Field(..., description="Waterfall tiers for this structure")


class PromoteStructure(PromoteStructureBase):
    id: str
    deal_id: str
    created_at: datetime
    tiers: List[WaterfallTier] = []

    class Config:
        orm_mode = True


class WaterfallCalculationInput(BaseModel):
    structure_id: Optional[str] = Field(None, description="ID of the promote structure to use for calculation")
    tiers: Optional[List[WaterfallTierCreate]] = Field(None, description="Waterfall tiers for direct calculation")
    investment_amount: float = Field(..., description="Initial investment amount")
    yearly_cash_flows: List[float] = Field(..., description="Yearly cash flows (including exit)")
    exit_year: int = Field(5, description="Year of exit/sale")

    @validator('tiers', 'structure_id')
    def validate_tiers_or_structure(cls, v, values):
        if 'structure_id' in values and values['structure_id'] is None and 'tiers' in values and values['tiers'] is None:
            raise ValueError('Either structure_id or tiers must be provided')
        return v


class YearlyDistribution(BaseModel):
    year: int
    total_cash_flow: float
    gp_distribution: float
    lp_distribution: float
    cumulative_gp: float
    cumulative_lp: float
    cumulative_total: float
    gp_percentage: float
    lp_percentage: float


class WaterfallCalculationResult(BaseModel):
    structure_id: str
    structure_name: str
    yearly_distributions: List[YearlyDistribution]
    total_gp_distribution: float
    total_lp_distribution: float
    gp_irr: float
    lp_irr: float
    gp_multiple: float
    lp_multiple: float
