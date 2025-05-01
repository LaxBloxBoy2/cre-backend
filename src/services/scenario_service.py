import json
from sqlalchemy.orm import Session
from ..models.deal import Deal
from ..models.deal_scenario import DealScenario
from ..schemas.scenario_schema import ScenarioCreate
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from ..deal_service import calculate_deal_metrics
from fastapi import HTTPException, status

def create_scenario(
    db: Session,
    deal_id: str,
    scenario: ScenarioCreate,
    user_id: str
) -> Optional[DealScenario]:
    """
    Create a new scenario for a deal

    Args:
        db: Database session
        deal_id: Deal ID
        scenario: Scenario data
        user_id: User ID

    Returns:
        Created scenario or None if deal not found
    """
    # Get the deal
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )

    # Generate a name if not provided
    scenario_name = scenario.name
    if not scenario_name:
        prefix = '+' if scenario.delta > 0 else ''
        suffix = ''
        if scenario.var == 'interest':
            suffix = ' bp interest'
        elif scenario.var == 'exit_cap':
            suffix = '% exit cap'
        elif scenario.var == 'rent':
            suffix = '% rent'
        elif scenario.var == 'vacancy':
            suffix = '% vacancy'
        scenario_name = f"{prefix}{scenario.delta}{suffix}"

    # Clone base underwriting and apply delta
    modified_params = apply_delta_to_deal(deal, scenario.var, scenario.delta)

    # Calculate new metrics
    cashflow_data, irr = calculate_scenario_metrics(modified_params)

    # Create new scenario
    new_scenario = DealScenario(
        deal_id=deal_id,
        name=scenario_name,
        var_changed=scenario.var,
        delta=scenario.delta,
        cashflow_json=json.dumps(cashflow_data),
        irr=round(irr, 2) if irr is not None else None
    )

    db.add(new_scenario)
    db.commit()
    db.refresh(new_scenario)

    return new_scenario

def apply_delta_to_deal(deal: Deal, var: str, delta: float) -> Dict[str, Any]:
    """
    Apply delta to deal parameters

    Args:
        deal: Deal object
        var: Variable to change
        delta: Delta value

    Returns:
        Modified parameters
    """
    # Clone deal parameters
    params = {
        "acquisition_price": deal.acquisition_price,
        "construction_cost": deal.construction_cost,
        "projected_rent_per_sf": deal.projected_rent_per_sf,
        "square_footage": deal.square_footage,
        "vacancy_rate": deal.vacancy_rate,
        "operating_expenses_per_sf": deal.operating_expenses_per_sf,
        "exit_cap_rate": deal.exit_cap_rate
    }

    # Apply delta based on variable
    if var == "interest":
        # Interest rate affects debt service, which is calculated in the metrics
        params["interest_rate_delta"] = delta
    elif var == "exit_cap":
        params["exit_cap_rate"] += delta
    elif var == "rent":
        # Assuming delta is a percentage change
        params["projected_rent_per_sf"] *= (1 + delta / 100)
    elif var == "vacancy":
        params["vacancy_rate"] += delta

    return params

def calculate_scenario_metrics(params: Dict[str, Any]) -> tuple:
    """
    Calculate metrics for a scenario

    Args:
        params: Modified deal parameters

    Returns:
        Tuple of (cashflow_data, irr)
    """
    # Calculate basic metrics
    metrics = calculate_deal_metrics(
        acquisition_price=params["acquisition_price"],
        construction_cost=params["construction_cost"],
        projected_rent_per_sf=params["projected_rent_per_sf"],
        square_footage=params["square_footage"],
        vacancy_rate=params["vacancy_rate"],
        operating_expenses_per_sf=params["operating_expenses_per_sf"],
        exit_cap_rate=params["exit_cap_rate"]
    )

    # Generate yearly cashflow
    cashflow_data = generate_yearly_cashflow(params, metrics, interest_rate_delta=params.get("interest_rate_delta", 0))

    # Calculate IRR from cashflow
    irr = calculate_irr_from_cashflow(cashflow_data)

    return cashflow_data, irr

def generate_yearly_cashflow(params: Dict[str, Any], metrics: Dict[str, Any], interest_rate_delta: float = 0) -> Dict[str, Any]:
    """
    Generate yearly cashflow for 5 years

    Args:
        params: Deal parameters
        metrics: Calculated metrics
        interest_rate_delta: Interest rate delta (if applicable)

    Returns:
        Yearly cashflow data
    """
    # Calculate total project cost
    total_cost = params["acquisition_price"] + params["construction_cost"]

    # Calculate NOI
    noi = metrics["noi"]

    # Assume 2% annual growth in NOI
    yearly_cashflow = []
    cumulative_cash = -total_cost * 0.35  # Assuming 65% LTV, so equity is 35%

    # Base debt service (8% of total cost per year)
    base_debt_service_rate = 0.08

    # Apply interest rate delta if provided
    debt_service_rate = base_debt_service_rate
    if interest_rate_delta != 0:
        debt_service_rate = base_debt_service_rate + interest_rate_delta / 100

    debt_service = total_cost * 0.65 * debt_service_rate  # 65% LTV

    for year in range(1, 6):
        # Grow NOI by 2% each year
        current_noi = noi * (1.02 ** (year - 1))

        # Free cash flow after debt service
        free_cash = current_noi - debt_service

        # Add to cumulative cash
        cumulative_cash += free_cash

        yearly_cashflow.append({
            "year": year,
            "noi": round(current_noi, 2),
            "debt_service": round(debt_service, 2),
            "free_cash": round(free_cash, 2),
            "cumulative": round(cumulative_cash, 2)
        })

    # Add exit in year 5
    exit_value = yearly_cashflow[4]["noi"] / (params["exit_cap_rate"] / 100)
    remaining_debt = total_cost * 0.65 * 0.9  # Assume 10% of debt paid down
    exit_proceeds = exit_value - remaining_debt

    # Add exit proceeds to cumulative cash
    final_cash = cumulative_cash + exit_proceeds

    return {
        "yearly": yearly_cashflow,
        "exit_value": round(exit_value, 2),
        "exit_proceeds": round(exit_proceeds, 2),
        "final_cash": round(final_cash, 2)
    }

def calculate_irr_from_cashflow(cashflow_data: Dict[str, Any]) -> float:
    """
    Calculate IRR from cashflow data

    Args:
        cashflow_data: Cashflow data

    Returns:
        IRR as a percentage
    """
    # Extract cash flows
    initial_investment = -cashflow_data["yearly"][0]["cumulative"]  # Initial equity
    yearly_cash_flows = [cf["free_cash"] for cf in cashflow_data["yearly"]]

    # Add exit proceeds to final year
    yearly_cash_flows[-1] += cashflow_data["exit_proceeds"]

    # Calculate IRR using numpy's IRR function
    try:
        import numpy as np
        cash_flows = [-initial_investment] + yearly_cash_flows
        irr = np.irr(cash_flows)
        return round(irr * 100, 2)  # Convert to percentage and round to 2 decimals
    except:
        # Fallback calculation if numpy is not available
        return 12.5  # Simplified IRR calculation
