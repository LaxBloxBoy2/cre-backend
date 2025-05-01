from sqlalchemy.orm import Session
from ..models.promote_structure import PromoteStructure
from ..models.waterfall_tier import WaterfallTier
from ..schemas.waterfall_schema import (
    PromoteStructureCreate,
    WaterfallCalculationInput,
    WaterfallCalculationResult,
    YearlyDistribution
)
from typing import List, Dict, Any
import numpy as np
import uuid


def create_promote_structure(db: Session, deal_id: str, structure: PromoteStructureCreate) -> PromoteStructure:
    """Create a new promote structure with waterfall tiers"""
    db_structure = PromoteStructure(
        id=uuid.uuid4(),
        deal_id=deal_id,
        name=structure.name
    )
    db.add(db_structure)
    db.flush()  # Flush to get the ID

    # Create tiers
    for tier in structure.tiers:
        db_tier = WaterfallTier(
            id=uuid.uuid4(),
            structure_id=db_structure.id,
            tier_order=tier.tier_order,
            hurdle=tier.hurdle,
            gp_split=tier.gp_split,
            lp_split=tier.lp_split
        )
        db.add(db_tier)

    db.commit()
    db.refresh(db_structure)
    return db_structure


def get_promote_structures(db: Session, deal_id: str) -> List[PromoteStructure]:
    """Get all promote structures for a deal"""
    return db.query(PromoteStructure).filter(PromoteStructure.deal_id == deal_id).all()


def get_promote_structure(db: Session, structure_id: str) -> PromoteStructure:
    """Get a specific promote structure by ID"""
    return db.query(PromoteStructure).filter(PromoteStructure.id == structure_id).first()


def delete_promote_structure(db: Session, structure_id: str) -> bool:
    """Delete a promote structure"""
    db_structure = db.query(PromoteStructure).filter(PromoteStructure.id == structure_id).first()
    if db_structure:
        db.delete(db_structure)
        db.commit()
        return True
    return False


def calculate_irr(cash_flows: List[float]) -> float:
    """Calculate IRR from a list of cash flows"""
    try:
        # Use numpy's IRR function
        irr = np.irr(cash_flows)
        return round(irr * 100, 2)  # Convert to percentage and round to 2 decimal places
    except:
        # If IRR calculation fails (e.g., no solution), return 0
        return 0.0


def calculate_waterfall(db: Session, input_data: WaterfallCalculationInput) -> WaterfallCalculationResult:
    """Calculate waterfall distributions based on the promote structure or direct tiers"""
    structure_id = None
    structure_name = "Custom Waterfall"

    # Determine if we're using a saved structure or direct tiers
    if input_data.structure_id:
        # Get the promote structure
        structure = get_promote_structure(db, input_data.structure_id)
        if not structure:
            raise ValueError(f"Promote structure with ID {input_data.structure_id} not found")

        # Get tiers sorted by hurdle rate (ascending)
        tiers = sorted(structure.waterfall_tiers, key=lambda t: t.hurdle)
        structure_id = structure.id
        structure_name = structure.name
    elif input_data.tiers:
        # Use directly provided tiers
        tiers = sorted(input_data.tiers, key=lambda t: t.hurdle)
        structure_id = "custom"
    else:
        raise ValueError("Either structure_id or tiers must be provided")

    # Initial investment (negative cash flow)
    investment = -input_data.investment_amount

    # Initialize results
    yearly_distributions = []
    cumulative_gp = 0
    cumulative_lp = 0

    # Process each year's cash flow
    for year, cash_flow in enumerate(input_data.yearly_cash_flows):
        # Skip years with no cash flow
        if cash_flow == 0:
            yearly_distributions.append(YearlyDistribution(
                year=year + 1,
                total_cash_flow=0,
                gp_distribution=0,
                lp_distribution=0,
                cumulative_gp=cumulative_gp,
                cumulative_lp=cumulative_lp,
                cumulative_total=cumulative_gp + cumulative_lp,
                gp_percentage=0,
                lp_percentage=0
            ))
            continue

        # Calculate IRR up to this point to determine which tier applies
        # For the IRR calculation, we need all cash flows including the initial investment
        current_cash_flows = [investment] + input_data.yearly_cash_flows[:year+1]
        current_irr = calculate_irr(current_cash_flows)

        # Determine which tier applies based on the current IRR
        applicable_tier = None
        for tier in tiers:
            if current_irr <= tier.hurdle:
                applicable_tier = tier
                break

        # If no tier applies (IRR exceeds all hurdles), use the last tier
        if not applicable_tier and tiers:
            applicable_tier = tiers[-1]

        # If we have a tier, calculate distributions
        if applicable_tier:
            gp_amount = cash_flow * (applicable_tier.gp_split / 100)
            lp_amount = cash_flow * (applicable_tier.lp_split / 100)

            # Update cumulative amounts
            cumulative_gp += gp_amount
            cumulative_lp += lp_amount

            # Calculate percentages
            gp_percentage = applicable_tier.gp_split
            lp_percentage = applicable_tier.lp_split
        else:
            # Default to 50/50 if no tiers defined
            gp_amount = cash_flow * 0.5
            lp_amount = cash_flow * 0.5

            # Update cumulative amounts
            cumulative_gp += gp_amount
            cumulative_lp += lp_amount

            # Default percentages
            gp_percentage = 50
            lp_percentage = 50

        # Add to yearly distributions
        yearly_distributions.append(YearlyDistribution(
            year=year + 1,
            total_cash_flow=cash_flow,
            gp_distribution=gp_amount,
            lp_distribution=lp_amount,
            cumulative_gp=cumulative_gp,
            cumulative_lp=cumulative_lp,
            cumulative_total=cumulative_gp + cumulative_lp,
            gp_percentage=gp_percentage,
            lp_percentage=lp_percentage
        ))

    # Calculate IRRs and multiples
    gp_cash_flows = [investment * 0.5]  # Assume 50/50 initial investment split
    lp_cash_flows = [investment * 0.5]

    for dist in yearly_distributions:
        gp_cash_flows.append(dist.gp_distribution)
        lp_cash_flows.append(dist.lp_distribution)

    gp_irr = calculate_irr(gp_cash_flows)
    lp_irr = calculate_irr(lp_cash_flows)

    # Calculate multiples
    gp_multiple = sum(gp_cash_flows[1:]) / abs(gp_cash_flows[0]) if gp_cash_flows[0] != 0 else 0
    lp_multiple = sum(lp_cash_flows[1:]) / abs(lp_cash_flows[0]) if lp_cash_flows[0] != 0 else 0

    return WaterfallCalculationResult(
        structure_id=structure_id,
        structure_name=structure_name,
        yearly_distributions=yearly_distributions,
        total_gp_distribution=cumulative_gp,
        total_lp_distribution=cumulative_lp,
        gp_irr=gp_irr,
        lp_irr=lp_irr,
        gp_multiple=gp_multiple,
        lp_multiple=lp_multiple
    )
