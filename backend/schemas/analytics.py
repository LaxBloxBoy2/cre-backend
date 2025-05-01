from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class PropertyTypeDistribution(BaseModel):
    name: str
    value: float
    percentage: float
    count: int


class LeaseExpirationTimeline(BaseModel):
    period: str
    year: int
    quarter: int
    count: int
    rent: float
    area: float
    timestamp: int


class TenantConcentration(BaseModel):
    id: str
    name: str
    rent: float
    percentage: float


class RentRollSummary(BaseModel):
    total_monthly_rent: float
    total_leased_area: float
    average_rent_per_sqft: float
    active_leases_count: int
    expiring_within_90_days: int
    expiring_within_year: int
    occupancy_rate: float
    top_property_type: str
    top_property_type_percentage: float
