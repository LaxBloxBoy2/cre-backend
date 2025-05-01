from sqlalchemy import Column, String, Float, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime

from .base import Base


class OptimizationStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ActionType(enum.Enum):
    HOLD = "hold"
    REFINANCE = "refinance"
    SELL = "sell"
    CAPEX = "capex"


class FundOptimizerRun(Base):
    __tablename__ = "fund_optimizer_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fund_id = Column(UUID(as_uuid=True), nullable=False)
    start_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    horizon_months = Column(Integer, nullable=False)
    optimized_irr = Column(Float, nullable=True)
    baseline_irr = Column(Float, nullable=True)
    status = Column(Enum(OptimizationStatus), default=OptimizationStatus.PENDING, nullable=False)
    
    # Constraints
    min_dscr = Column(Float, nullable=False, default=1.25)
    max_leverage = Column(Float, nullable=False, default=0.75)
    
    # Relationships
    actions = relationship("OptimizerAction", back_populates="run", cascade="all, delete-orphan")


class OptimizerAction(Base):
    __tablename__ = "optimizer_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("fund_optimizer_runs.id"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), nullable=False)
    month = Column(DateTime, nullable=False)
    action_type = Column(Enum(ActionType), nullable=False)
    confidence_score = Column(Float, nullable=False)
    
    # Additional details for specific actions
    capex_amount = Column(Float, nullable=True)  # For CAPEX actions
    refinance_amount = Column(Float, nullable=True)  # For REFINANCE actions
    sale_price = Column(Float, nullable=True)  # For SELL actions
    
    # Relationships
    run = relationship("FundOptimizerRun", back_populates="actions")
