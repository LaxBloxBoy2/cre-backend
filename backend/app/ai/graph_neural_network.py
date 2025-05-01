import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool
from torch_geometric.data import Data
import numpy as np
from typing import Dict, List, Any, Tuple

class PortfolioGNN(nn.Module):
    """
    Graph Neural Network for embedding portfolio state.
    
    This network takes a graph representation of a real estate portfolio
    and produces embeddings that capture the relationships between assets.
    """
    
    def __init__(self, node_features: int, edge_features: int, hidden_dim: int = 64, output_dim: int = 32):
        super(PortfolioGNN, self).__init__()
        
        # Graph convolutional layers
        self.conv1 = GCNConv(node_features, hidden_dim)
        self.conv2 = GCNConv(hidden_dim, hidden_dim)
        self.conv3 = GCNConv(hidden_dim, output_dim)
        
        # MLP for final embedding
        self.mlp = nn.Sequential(
            nn.Linear(output_dim, output_dim),
            nn.ReLU(),
            nn.Linear(output_dim, output_dim)
        )
    
    def forward(self, data):
        x, edge_index, edge_attr, batch = data.x, data.edge_index, data.edge_attr, data.batch
        
        # Apply graph convolutions
        x = F.relu(self.conv1(x, edge_index, edge_attr))
        x = F.dropout(x, p=0.2, training=self.training)
        
        x = F.relu(self.conv2(x, edge_index, edge_attr))
        x = F.dropout(x, p=0.2, training=self.training)
        
        x = self.conv3(x, edge_index, edge_attr)
        
        # Global pooling to get graph-level embedding
        x = global_mean_pool(x, batch)
        
        # Apply MLP
        x = self.mlp(x)
        
        return x


def build_portfolio_graph(assets: List[Dict[str, Any]]) -> Data:
    """
    Build a graph representation of a real estate portfolio.
    
    Args:
        assets: List of asset dictionaries
        
    Returns:
        PyTorch Geometric Data object representing the portfolio graph
    """
    # Extract node features
    node_features = []
    for asset in assets:
        # Normalize features
        value = asset["value"] / 1e7  # Normalize to [0, 1] assuming max $10M
        noi = asset["noi"] / 1e6  # Normalize to [0, 1] assuming max $1M/year
        debt_service = asset["debt_service"] / 5e5  # Normalize to [0, 1] assuming max $500K/year
        cap_rate = asset["cap_rate"] / 0.1  # Normalize to [0, 1] assuming max 10%
        required_capex = asset["required_capex"] / 1e6  # Normalize to [0, 1] assuming max $1M
        dscr = min(asset["noi"] / asset["debt_service"] if asset["debt_service"] > 0 else 3.0, 3.0) / 3.0  # Cap at 3.0 and normalize
        
        # Combine features
        node_features.append([value, noi, debt_service, cap_rate, required_capex, dscr])
    
    # Convert to tensor
    x = torch.tensor(node_features, dtype=torch.float)
    
    # Create edges (simplified - in a real implementation, this would be more complex)
    # For now, we'll create a fully connected graph
    num_nodes = len(assets)
    edge_index = []
    edge_attr = []
    
    for i in range(num_nodes):
        for j in range(num_nodes):
            if i != j:
                edge_index.append([i, j])
                
                # Edge features could represent financial relationships
                # For simplicity, we'll use a placeholder
                edge_attr.append([0.5])  # Placeholder edge feature
    
    # Convert to tensors
    edge_index = torch.tensor(edge_index, dtype=torch.long).t().contiguous()
    edge_attr = torch.tensor(edge_attr, dtype=torch.float)
    
    # Create PyTorch Geometric Data object
    data = Data(x=x, edge_index=edge_index, edge_attr=edge_attr)
    
    return data


def embed_portfolio_state(model: PortfolioGNN, assets: List[Dict[str, Any]]) -> torch.Tensor:
    """
    Embed the portfolio state using the GNN model.
    
    Args:
        model: Trained GNN model
        assets: List of asset dictionaries
        
    Returns:
        Tensor embedding of the portfolio state
    """
    # Build graph
    data = build_portfolio_graph(assets)
    
    # Set model to evaluation mode
    model.eval()
    
    # Get embedding
    with torch.no_grad():
        embedding = model(data)
    
    return embedding
