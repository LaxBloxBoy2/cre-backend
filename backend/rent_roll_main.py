from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from routers import assets_router, tenants_router, leases_router, rent_roll_router
from models.base import Base
from database import engine

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title="CRE Platform API",
    description="API for Commercial Real Estate Platform",
    version="1.0.0"
)

# Configure CORS
origins = ["http://localhost:3000", "http://localhost:3002", "https://cre-platform.vercel.app"]
if os.getenv("ENVIRONMENT") == "production":
    # In production, only allow specific origins
    pass
else:
    # In development, allow all origins
    origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Demo-Token"],
)

# Include routers
app.include_router(assets_router)
app.include_router(tenants_router)
app.include_router(leases_router)
app.include_router(rent_roll_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the CRE Platform API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
