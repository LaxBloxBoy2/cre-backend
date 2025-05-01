import numpy as np
from typing import Dict, List, Any, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PortfolioSimulator:
    """
    Simulates the performance of a real estate portfolio over time.
    
    This simulator handles:
    - Monthly cash flows
    - Debt service
    - Asset value changes
    - CapEx projects
    - DSCR calculations
    """
    
    def __init__(
        self,
        assets: List[Dict[str, Any]],
        horizon_months: int,
        min_dscr: float = 1.25,
        max_leverage: float = 0.75,
        seed: int = None
    ):
        self.assets = assets
        self.horizon_months = horizon_months
        self.min_dscr = min_dscr
        self.max_leverage = max_leverage
        
        # Set random seed for reproducibility if provided
        if seed is not None:
            np.random.seed(seed)
        
        # Initialize simulation state
        self.reset()
    
    def reset(self):
        """Reset the simulation to initial state"""
        self.current_month = 0
        self.portfolio_value = sum(asset["value"] for asset in self.assets)
        self.portfolio_noi = sum(asset["noi"] for asset in self.assets)
        self.portfolio_debt_service = sum(asset["debt_service"] for asset in self.assets)
        self.portfolio_dscr = self.portfolio_noi / self.portfolio_debt_service if self.portfolio_debt_service > 0 else float('inf')
        self.bankruptcy = False
        self.consecutive_dscr_violations = 0
        self.cash_balance = 0
        self.irr = 0
        
        # Track asset-specific state
        self.asset_states = {}
        for asset in self.assets:
            self.asset_states[asset["id"]] = {
                "owned": True,
                "value": asset["value"],
                "noi": asset["noi"],
                "debt_service": asset["debt_service"],
                "cap_rate": asset["cap_rate"],
                "required_capex": asset["required_capex"],
                "last_refinance_month": -12,  # Assume last refinance was 12 months ago
                "capex_completed": False
            }
        
        # Track cash flows for IRR calculation
        self.cash_flows = [-self.portfolio_value]  # Initial investment (negative cash flow)
        
        return self._get_state()
    
    def step(self, actions: Dict[str, str]) -> Tuple[Dict[str, Any], float, bool, Dict[str, Any]]:
        """
        Take a step in the simulation based on actions.
        
        Args:
            actions: Dictionary mapping asset IDs to action types (hold, refinance, sell, capex)
            
        Returns:
            Tuple of (new_state, reward, done, info)
        """
        if self.bankruptcy or self.current_month >= self.horizon_months:
            return self._get_state(), 0, True, {"message": "Simulation already complete"}
        
        # Process actions for each asset
        monthly_cash_flow = 0
        
        for asset_id, action in actions.items():
            if asset_id in self.asset_states and self.asset_states[asset_id]["owned"]:
                asset_state = self.asset_states[asset_id]
                
                # Process the action
                if action == "hold":
                    # Collect NOI minus debt service
                    asset_cash_flow = asset_state["noi"] - asset_state["debt_service"]
                    monthly_cash_flow += asset_cash_flow
                
                elif action == "refinance":
                    # Check if refinance is allowed (not within 12 months of last refinance)
                    if self.current_month - asset_state["last_refinance_month"] < 12:
                        logger.warning(f"Cannot refinance asset {asset_id} - last refinance was less than 12 months ago")
                        # Collect NOI minus debt service (same as hold)
                        asset_cash_flow = asset_state["noi"] - asset_state["debt_service"]
                        monthly_cash_flow += asset_cash_flow
                    else:
                        # Simulate refinance: increase debt, adjust debt service, collect cash
                        new_loan_amount = asset_state["value"] * self.max_leverage
                        # Assume current loan is 60% of value (simplified)
                        current_loan_estimate = asset_state["value"] * 0.6
                        cash_out = new_loan_amount - current_loan_estimate
                        
                        # Adjust debt service (simplified - would use actual debt calculation in real model)
                        asset_state["debt_service"] = new_loan_amount * 0.06 / 12  # Assume 6% annual rate
                        
                        # Update last refinance month
                        asset_state["last_refinance_month"] = self.current_month
                        
                        # Add cash out to monthly cash flow
                        monthly_cash_flow += cash_out
                
                elif action == "sell":
                    # Check if mandatory capex has been completed
                    if asset_state["required_capex"] > 0 and not asset_state["capex_completed"]:
                        logger.warning(f"Cannot sell asset {asset_id} - mandatory CapEx not completed")
                        # Collect NOI minus debt service (same as hold)
                        asset_cash_flow = asset_state["noi"] - asset_state["debt_service"]
                        monthly_cash_flow += asset_cash_flow
                    else:
                        # Simulate sale: add sale proceeds minus estimated loan payoff
                        sale_price = asset_state["value"] * (1 + np.random.normal(0, 0.05))  # Random variation in sale price
                        # Assume current loan is 60% of value (simplified)
                        current_loan_estimate = asset_state["value"] * 0.6
                        sale_proceeds = sale_price - current_loan_estimate
                        
                        # Mark asset as no longer owned
                        asset_state["owned"] = False
                        
                        # Add sale proceeds to monthly cash flow
                        monthly_cash_flow += sale_proceeds
                
                elif action == "capex":
                    # Implement CapEx project
                    capex_amount = asset_state["required_capex"]
                    
                    # Pay for CapEx
                    monthly_cash_flow -= capex_amount
                    
                    # Mark CapEx as completed
                    asset_state["capex_completed"] = True
                    asset_state["required_capex"] = 0
                    
                    # Increase asset value and NOI after CapEx (simplified model)
                    value_increase = capex_amount * 1.2  # Assume 20% return on CapEx
                    asset_state["value"] += value_increase
                    asset_state["noi"] += value_increase * asset_state["cap_rate"] / 12  # Monthly NOI increase
                    
                    # Collect NOI minus debt service
                    asset_cash_flow = asset_state["noi"] - asset_state["debt_service"]
                    monthly_cash_flow += asset_cash_flow
        
        # Update portfolio state
        self._update_portfolio_state()
        
        # Check for DSCR violations
        if self.portfolio_dscr < self.min_dscr:
            self.consecutive_dscr_violations += 1
        else:
            self.consecutive_dscr_violations = 0
        
        # Check for bankruptcy
        if self.consecutive_dscr_violations >= 3:
            self.bankruptcy = True
        
        # Add monthly cash flow to cash balance
        self.cash_balance += monthly_cash_flow
        
        # Add to cash flows for IRR calculation (only at end of year or if simulation ends)
        if self.current_month % 12 == 11 or self.current_month == self.horizon_months - 1 or self.bankruptcy:
            self.cash_flows.append(monthly_cash_flow)
        
        # Calculate IRR if simulation is ending
        done = self.bankruptcy or self.current_month >= self.horizon_months - 1
        if done:
            self.irr = self._calculate_irr()
        
        # Calculate reward (simplified - would be more complex in real model)
        reward = monthly_cash_flow / self.portfolio_value  # Monthly return
        
        # Apply penalty for DSCR violations
        if self.portfolio_dscr < self.min_dscr:
            reward -= 0.01  # Penalty for DSCR violation
        
        # Advance to next month
        self.current_month += 1
        
        return self._get_state(), reward, done, {"monthly_cash_flow": monthly_cash_flow}
    
    def _update_portfolio_state(self):
        """Update the overall portfolio state based on individual asset states"""
        # Only include owned assets
        owned_assets = [state for asset_id, state in self.asset_states.items() if state["owned"]]
        
        # Update portfolio metrics
        self.portfolio_value = sum(state["value"] for state in owned_assets)
        self.portfolio_noi = sum(state["noi"] for state in owned_assets)
        self.portfolio_debt_service = sum(state["debt_service"] for state in owned_assets)
        
        # Calculate DSCR
        self.portfolio_dscr = self.portfolio_noi / self.portfolio_debt_service if self.portfolio_debt_service > 0 else float('inf')
    
    def _get_state(self) -> Dict[str, Any]:
        """Get the current state of the simulation"""
        return {
            "current_month": self.current_month,
            "portfolio_value": self.portfolio_value,
            "portfolio_noi": self.portfolio_noi,
            "portfolio_debt_service": self.portfolio_debt_service,
            "portfolio_dscr": self.portfolio_dscr,
            "cash_balance": self.cash_balance,
            "bankruptcy": self.bankruptcy,
            "consecutive_dscr_violations": self.consecutive_dscr_violations,
            "asset_states": self.asset_states,
            "irr": self.irr
        }
    
    def _calculate_irr(self) -> float:
        """Calculate the Internal Rate of Return (IRR) based on cash flows"""
        try:
            # Add terminal value to final cash flow
            final_cash_flows = self.cash_flows.copy()
            if not self.bankruptcy:
                # Add terminal value based on cap rate
                terminal_value = self.portfolio_value
                final_cash_flows[-1] += terminal_value
            
            # Calculate IRR
            irr = np.irr(final_cash_flows)
            
            # Convert to annual rate
            annual_irr = (1 + irr) ** 12 - 1
            
            return max(annual_irr, -1)  # Cap at -100% to avoid extreme negative values
        except:
            # If IRR calculation fails, return a default value
            return 0.0
