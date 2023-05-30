# CRE Backend (QAPT)

This is the backend repository for the CRE (Commercial Real Estate) platform, now rebranded as QAPT.

## Repository Cleanup

This repository has been cleaned to remove large files that were causing issues with GitHub's file size limits.

### Cleanup Process

The repository was cleaned by creating a new branch without history and then force-pushing it to GitHub. This approach completely removes the large files from the Git history.

## Fund Optimizer System

A system that uses AI simulation and reinforcement learning to generate multi-year action plans for maximizing fund IRR while maintaining DSCR constraints.

## Overview

This system provides a comprehensive solution for optimizing commercial real estate fund performance using advanced AI techniques:

- **Portfolio Simulation**: Simulates the performance of real estate assets over time
- **Graph Neural Networks**: Models complex relationships between assets
- **Reinforcement Learning**: Learns optimal strategies for maximizing returns
- **Action Planning**: Generates detailed, confidence-rated action plans

## Architecture

The system consists of two main components:

### Backend (FastAPI + PostgreSQL)

- **Database**: Stores optimization runs and recommended actions
- **API**: Provides endpoints for starting optimizations and retrieving results
- **AI Engine**: Implements portfolio simulation and reinforcement learning

### Frontend (Next.js + Tailwind + ShadcnUI)

- **Optimization Interface**: Allows users to configure and start optimizations
- **Results Dashboard**: Displays optimization results with visualizations
- **Action Timeline**: Shows recommended actions over time
- **IRR Projection**: Compares baseline and optimized IRR

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL 13+

### Backend Setup

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations:
   ```bash
   alembic upgrade head
   ```

5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API URL
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /fund/optimize

Starts a new optimization run for a fund.

**Request Body:**
```json
{
  "fund_id": "uuid",
  "target_horizon_years": 5,
  "constraints": {
    "min_dscr": 1.25,
    "max_leverage": 0.75
  }
}
```

**Response:**
```json
{
  "run_id": "uuid",
  "status": "pending",
  "message": "Optimization started successfully"
}
```

### GET /fund/optimize/{run_id}

Returns the details of an optimization run.

**Response:**
```json
{
  "id": "uuid",
  "fund_id": "uuid",
  "start_timestamp": "2023-01-01T00:00:00Z",
  "horizon_months": 60,
  "optimized_irr": 0.15,
  "baseline_irr": 0.12,
  "status": "completed",
  "actions": [
    {
      "id": "uuid",
      "asset_id": "uuid",
      "month": "2023-06-01T00:00:00Z",
      "action_type": "refinance",
      "confidence_score": 0.85,
      "details": {
        "refinance_amount": 5000000
      }
    }
  ],
  "constraints": {
    "min_dscr": 1.25,
    "max_leverage": 0.75
  }
}
```

## AI Components

### Portfolio Simulator

Simulates the performance of a real estate portfolio over time, handling:
- Monthly cash flows
- Debt service
- Asset value changes
- CapEx projects
- DSCR calculations

### Graph Neural Network

Models the portfolio as a graph where:
- Nodes = assets
- Edges = financial relationships
- Embeddings = state representations

### Reinforcement Learning Agent

Learns optimal strategies through simulation:
- Action space: Hold, Refinance, Sell, CapEx
- Reward function: Maximize IRR with DSCR constraints
- Policy gradient method for learning

## License

This project is licensed under the MIT License - see the LICENSE file for details.
