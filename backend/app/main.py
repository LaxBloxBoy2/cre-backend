from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, UUID4
from typing import Dict, List, Optional
import uuid
from datetime import datetime, timedelta
import random
import time
import asyncio

app = FastAPI(
    title="Fund Optimizer API",
    description="API for optimizing fund performance using AI simulation and reinforcement learning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo purposes
optimization_runs = {}
optimization_actions = {}

# Pydantic models
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
    details: Optional[Dict] = None

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

# Simulate optimization process
async def run_optimization(run_id: uuid.UUID):
    # Update status to running
    optimization_runs[run_id]["status"] = "running"

    # Simulate processing time
    await asyncio.sleep(10)

    # Generate baseline IRR (random for demo)
    baseline_irr = random.uniform(0.05, 0.12)
    optimization_runs[run_id]["baseline_irr"] = baseline_irr

    # Generate optimized IRR (higher than baseline)
    optimized_irr = baseline_irr * (1 + random.uniform(0.1, 0.3))
    optimization_runs[run_id]["optimized_irr"] = optimized_irr

    # Generate actions
    actions = []
    fund_id = optimization_runs[run_id]["fund_id"]
    horizon_months = optimization_runs[run_id]["horizon_months"]

    # Create 10 random assets for demo
    assets = [uuid.uuid4() for _ in range(10)]

    # Generate actions for each month in the horizon
    for month in range(horizon_months):
        # Only generate actions for some months (not every month will have actions)
        if random.random() < 0.2:  # 20% chance of an action in a given month
            # Select a random asset
            asset_id = random.choice(assets)

            # Determine action type
            action_type = random.choice(["hold", "refinance", "sell", "capex"])

            # Generate action details
            details = {}
            if action_type == "refinance":
                details["refinance_amount"] = random.uniform(1000000, 5000000)
            elif action_type == "sell":
                details["sale_price"] = random.uniform(2000000, 10000000)
            elif action_type == "capex":
                details["capex_amount"] = random.uniform(100000, 1000000)

            # Create action
            action_id = uuid.uuid4()
            action = {
                "id": action_id,
                "run_id": run_id,
                "asset_id": asset_id,
                "month": datetime.now() + timedelta(days=30 * month),
                "action_type": action_type,
                "confidence_score": random.uniform(0.6, 0.95),
                "details": details
            }

            # Store action
            optimization_actions[action_id] = action
            actions.append(action_id)

    # Store actions in run
    optimization_runs[run_id]["action_ids"] = actions

    # Update status to completed
    optimization_runs[run_id]["status"] = "completed"

# Routes
@app.post("/fund/optimize", response_model=OptimizationResponse)
async def start_optimization(request: OptimizationRequest, background_tasks: BackgroundTasks):
    """Start a new fund optimization run"""

    # Create a new optimization run
    run_id = uuid.uuid4()
    run = {
        "id": run_id,
        "fund_id": request.fund_id,
        "start_timestamp": datetime.now(),
        "horizon_months": request.target_horizon_years * 12,
        "optimized_irr": None,
        "baseline_irr": None,
        "status": "pending",
        "action_ids": [],
        "constraints": {
            "min_dscr": request.constraints.min_dscr,
            "max_leverage": request.constraints.max_leverage
        }
    }

    # Store the run
    optimization_runs[run_id] = run

    # Start the optimization in the background
    background_tasks.add_task(run_optimization, run_id)

    return OptimizationResponse(
        run_id=run_id,
        status="pending",
        message="Optimization started successfully"
    )

@app.get("/fund/optimize/{run_id}", response_model=OptimizationRunDetail)
async def get_optimization_run(run_id: uuid.UUID):
    """Get details of a specific optimization run"""

    # Check if run exists
    if run_id not in optimization_runs:
        raise HTTPException(status_code=404, detail=f"Optimization run with ID {run_id} not found")

    # Get run
    run = optimization_runs[run_id]

    # Get actions
    actions = []
    for action_id in run.get("action_ids", []):
        if action_id in optimization_actions:
            action_data = optimization_actions[action_id]
            actions.append(OptimizerActionResponse(
                id=action_data["id"],
                asset_id=action_data["asset_id"],
                month=action_data["month"],
                action_type=action_data["action_type"],
                confidence_score=action_data["confidence_score"],
                details=action_data.get("details")
            ))

    # Create response
    return OptimizationRunDetail(
        id=run["id"],
        fund_id=run["fund_id"],
        start_timestamp=run["start_timestamp"],
        horizon_months=run["horizon_months"],
        optimized_irr=run["optimized_irr"],
        baseline_irr=run["baseline_irr"],
        status=run["status"],
        actions=actions,
        constraints=run["constraints"]
    )

@app.delete("/fund/optimize/{run_id}")
async def cancel_optimization(run_id: uuid.UUID):
    """Cancel an ongoing optimization run"""

    # Check if run exists
    if run_id not in optimization_runs:
        raise HTTPException(status_code=404, detail=f"Optimization run with ID {run_id} not found")

    # Get run
    run = optimization_runs[run_id]

    # Check if run can be cancelled
    if run["status"] not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel optimization run with status {run['status']}")

    # Update status to failed
    run["status"] = "failed"

    return {"message": "Optimization run cancelled successfully"}

@app.get("/")
async def root():
    return {"message": "Welcome to the Fund Optimizer API"}
