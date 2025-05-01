from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import logging

# Import local modules
from . import risk  # import the local risk-score module from the current directory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CRE Platform API",
    description="""API for Commercial Real Estate Platform (QAPT)""",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Add exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"{request.url.path} - {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error at {request.url.path}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"error": "Invalid request", "details": exc.errors()},
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Log the full exception with traceback
    logger.error(f"Unhandled error at {request.url.path}: {repr(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error"},
    )

# Include routes
app.include_router(risk.router, prefix="/api", tags=["Risk"])

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to the CRE Platform API",
        "docs": "/docs",
        "version": "0.1.0"
    }

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
