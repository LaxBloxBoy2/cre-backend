import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions import Categorical
import logging
from typing import Dict, List, Any, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PolicyNetwork(nn.Module):
    """
    Neural network for the policy gradient agent.
    
    This network takes a state representation and outputs action probabilities.
    """
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super(PolicyNetwork, self).__init__()
        
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Softmax(dim=-1)
        )
    
    def forward(self, x):
        return self.network(x)


class PolicyGradientAgent:
    """
    Reinforcement Learning agent using Policy Gradient method.
    
    This agent learns to optimize fund performance by taking actions
    that maximize IRR while maintaining DSCR constraints.
    """
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        learning_rate: float = 0.001,
        gamma: float = 0.99,
        device: str = "cpu"
    ):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.device = device
        
        # Initialize policy network
        self.policy = PolicyNetwork(state_dim, action_dim).to(device)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=learning_rate)
        
        # Initialize memory for storing trajectories
        self.states = []
        self.actions = []
        self.rewards = []
        self.action_probs = []
        
        # Track training metrics
        self.episode_rewards = []
        self.episode_irrs = []
    
    def select_action(self, state: np.ndarray) -> Tuple[int, float]:
        """
        Select an action based on the current policy.
        
        Args:
            state: The current state vector
            
        Returns:
            Tuple of (action_index, action_probability)
        """
        state_tensor = torch.FloatTensor(state).to(self.device)
        action_probs = self.policy(state_tensor)
        
        # Sample action from the probability distribution
        m = Categorical(action_probs)
        action = m.sample()
        
        return action.item(), action_probs[action.item()].item()
    
    def store_transition(self, state: np.ndarray, action: int, reward: float, action_prob: float):
        """Store a transition in memory"""
        self.states.append(state)
        self.actions.append(action)
        self.rewards.append(reward)
        self.action_probs.append(action_prob)
    
    def update_policy(self):
        """Update the policy network based on collected trajectories"""
        # Convert rewards to returns (discounted future rewards)
        returns = []
        G = 0
        
        # Calculate returns in reverse order
        for r in reversed(self.rewards):
            G = r + self.gamma * G
            returns.insert(0, G)
        
        # Convert to tensor and normalize
        returns = torch.FloatTensor(returns).to(self.device)
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)
        
        # Calculate loss
        policy_loss = []
        for log_prob, R in zip(self.action_probs, returns):
            policy_loss.append(-torch.log(torch.tensor(log_prob)) * R)
        
        policy_loss = torch.stack(policy_loss).sum()
        
        # Update policy
        self.optimizer.zero_grad()
        policy_loss.backward()
        self.optimizer.step()
        
        # Clear memory
        self.states = []
        self.actions = []
        self.rewards = []
        self.action_probs = []
    
    def train(self, env, num_episodes: int = 1000, max_steps: int = 100) -> Dict[str, List[float]]:
        """
        Train the agent on the environment.
        
        Args:
            env: The environment to train on
            num_episodes: Number of episodes to train for
            max_steps: Maximum steps per episode
            
        Returns:
            Dictionary of training metrics
        """
        logger.info(f"Starting training for {num_episodes} episodes")
        
        for episode in range(num_episodes):
            state = env.reset()
            state_vector = self._state_to_vector(state)
            episode_reward = 0
            
            for step in range(max_steps):
                # Select action
                action_idx, action_prob = self.select_action(state_vector)
                action = self._idx_to_action(action_idx, state)
                
                # Take action in environment
                next_state, reward, done, _ = env.step(action)
                next_state_vector = self._state_to_vector(next_state)
                
                # Store transition
                self.store_transition(state_vector, action_idx, reward, action_prob)
                
                # Update state
                state = next_state
                state_vector = next_state_vector
                episode_reward += reward
                
                if done:
                    break
            
            # Update policy after episode
            self.update_policy()
            
            # Track metrics
            self.episode_rewards.append(episode_reward)
            self.episode_irrs.append(state["irr"])
            
            # Log progress
            if (episode + 1) % 100 == 0:
                logger.info(f"Episode {episode+1}/{num_episodes}, Avg Reward: {np.mean(self.episode_rewards[-100:]):.4f}, Avg IRR: {np.mean(self.episode_irrs[-100:]):.4f}")
        
        logger.info("Training complete")
        
        return {
            "rewards": self.episode_rewards,
            "irrs": self.episode_irrs
        }
    
    def _state_to_vector(self, state: Dict[str, Any]) -> np.ndarray:
        """Convert state dictionary to vector representation"""
        # This is a simplified version - in a real implementation, this would be more complex
        # and would handle the graph structure of the portfolio
        
        # Extract global portfolio features
        portfolio_features = [
            state["current_month"] / 60,  # Normalize to [0, 1] assuming max 60 months
            state["portfolio_value"] / 1e8,  # Normalize to [0, 1] assuming max $100M
            state["portfolio_noi"] / 1e7,  # Normalize to [0, 1] assuming max $10M/year
            min(state["portfolio_dscr"], 3) / 3,  # Cap at 3.0 and normalize
            state["cash_balance"] / 1e7,  # Normalize to [0, 1] assuming max $10M
            1 if state["bankruptcy"] else 0,  # Binary indicator
            min(state["consecutive_dscr_violations"], 3) / 3  # Normalize to [0, 1]
        ]
        
        # Extract features for each asset (simplified)
        asset_features = []
        for asset_id, asset_state in state["asset_states"].items():
            if asset_state["owned"]:
                asset_features.extend([
                    asset_state["value"] / 1e7,  # Normalize to [0, 1] assuming max $10M
                    asset_state["noi"] / 1e6,  # Normalize to [0, 1] assuming max $1M/year
                    asset_state["debt_service"] / 5e5,  # Normalize to [0, 1] assuming max $500K/year
                    asset_state["cap_rate"] / 0.1,  # Normalize to [0, 1] assuming max 10%
                    asset_state["required_capex"] / 1e6,  # Normalize to [0, 1] assuming max $1M
                    (state["current_month"] - asset_state["last_refinance_month"]) / 60,  # Time since last refinance
                    1 if asset_state["capex_completed"] else 0  # Binary indicator
                ])
        
        # Pad or truncate asset features to fixed length
        max_assets = 10  # Assume maximum 10 assets
        asset_features_per_asset = 7  # Number of features per asset
        
        if len(asset_features) < max_assets * asset_features_per_asset:
            # Pad with zeros
            asset_features.extend([0] * (max_assets * asset_features_per_asset - len(asset_features)))
        elif len(asset_features) > max_assets * asset_features_per_asset:
            # Truncate
            asset_features = asset_features[:max_assets * asset_features_per_asset]
        
        # Combine all features
        return np.array(portfolio_features + asset_features, dtype=np.float32)
    
    def _idx_to_action(self, action_idx: int, state: Dict[str, Any]) -> Dict[str, str]:
        """Convert action index to action dictionary"""
        # This is a simplified version - in a real implementation, this would be more complex
        
        # Define action types
        action_types = ["hold", "refinance", "sell", "capex"]
        
        # Get owned assets
        owned_assets = [asset_id for asset_id, asset_state in state["asset_states"].items() if asset_state["owned"]]
        
        if not owned_assets:
            return {}  # No assets to act on
        
        # Determine which asset to act on (simplified)
        asset_idx = action_idx // len(action_types)
        action_type_idx = action_idx % len(action_types)
        
        if asset_idx >= len(owned_assets):
            # Default to hold for all assets if index is out of bounds
            return {asset_id: "hold" for asset_id in owned_assets}
        
        # Create action dictionary
        actions = {asset_id: "hold" for asset_id in owned_assets}
        actions[owned_assets[asset_idx]] = action_types[action_type_idx]
        
        return actions
