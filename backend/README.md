# Rent Roll Backend

This is the backend API for the Rent Roll feature of the CRE Platform.

## Features

- Asset management
- Tenant management
- Lease management
- Rent roll analytics
- Data visualization

## Tech Stack

- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic (migrations)
- Pydantic (validation)

## Getting Started

### Prerequisites

- Python 3.9+
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
# Create a .env file
echo "DATABASE_URL=postgresql://username:password@localhost/dbname" > .env
```

### Database Setup

1. Run migrations:

```bash
python deploy.py --migrate
```

2. Import sample data:

```bash
python deploy.py --import-data
```

### Running the Server

```bash
python deploy.py --start
```

Or run all steps at once:

```bash
python deploy.py --all
```

## API Documentation

Once the server is running, you can access the API documentation at:

- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Deployment

### Render.com Deployment

1. Create a new Web Service on Render.com
2. Connect to your GitHub repository
3. Configure the build:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker rent_roll_main:app`
4. Set environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `ENVIRONMENT`: `production`

### Running Migrations on Render

After deployment, you can run migrations using the Render shell:

1. Go to your Web Service on Render
2. Click on "Shell"
3. Run: `cd backend && alembic upgrade head`

## Project Structure

```
backend/
├── models/             # Database models
├── routers/            # API routes
├── schemas/            # Pydantic schemas
├── services/           # Business logic
├── migrations/         # Alembic migrations
├── data/               # Sample data
├── rent_roll_main.py   # Main application
├── database.py         # Database connection
├── alembic.ini         # Alembic configuration
├── requirements.txt    # Dependencies
└── README.md           # This file
```

## License

This project is proprietary and confidential.
