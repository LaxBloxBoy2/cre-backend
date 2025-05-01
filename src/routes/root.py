from fastapi import APIRouter
import sys
import os
import platform

router = APIRouter()


@router.get("/")
def read_root():
    """
    Root endpoint that returns a simple message indicating the server is running

    Returns:
        A message indicating the server is running
    """
    return {"message": "CRE backend running"}


@router.get("/health")
async def health_check():
    """
    Health check endpoint to diagnose deployment issues

    Returns:
        A dictionary with system information and environment variables
    """
    return {
        "status": "ok",
        "python_version": sys.version,
        "platform": platform.platform(),
        "environment": {
            "database_url_set": "DATABASE_URL" in os.environ,
            "fireworks_api_key_set": "FIREWORKS_API_KEY" in os.environ,
            "env_vars": list(os.environ.keys())
        }
    }
