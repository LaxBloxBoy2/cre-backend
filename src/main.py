import os
import logging
import traceback
from logging.handlers import RotatingFileHandler
from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .routes import deals, analyze, root, investment, underwriting, report, auth, risk, lease, portfolio, ai_chat
from .database import Base, engine, get_db
from .models import User, Deal, ChatMessage
from .models.upload import UploadedFile
from .models.lease_analysis import LeaseAnalysis
from .utils.limiter import limiter

# Configure logging
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

# File handler with rotation (10 MB max size, keep 5 backup files)
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app.log')
file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
file_handler.setFormatter(log_formatter)

# Configure root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)

# Get application logger
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get Fireworks API key and check if it's valid
fireworks_api_key = os.getenv("FIREWORKS_API_KEY")
if not fireworks_api_key or fireworks_api_key == "your_fireworks_api_key_here":
    print("Warning: FIREWORKS_API_KEY environment variable is not properly set. Fallback mode will be used.")
    os.environ["USE_FALLBACK"] = "true"


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    app = FastAPI(
        title="CRE Platform API",
        description="""API for Commercial Real Estate Platform

        ## Authentication

        The API uses JWT tokens for authentication. There are two types of tokens:

        - **Access Token**: Used to authenticate API requests. Expires in 30 minutes.
        - **Refresh Token**: Used to get a new access token when it expires. Expires in 7 days.

        ### Login

        To get tokens, send a POST request to `/login` with your credentials. The response will include both tokens:

        ```json
        {
          "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          "token_type": "bearer"
        }
        ```

        ### Using Tokens

        Include the access token in the `Authorization` header of your requests:

        ```
        Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        ```

        ### Refreshing Tokens

        When the access token expires, send a POST request to `/refresh` with the refresh token:

        ```json
        {
          "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
        ```

        The response will include new access and refresh tokens.
        """,
        version="0.1.0",
    )

    # Add rate limiter
    app.state.limiter = limiter

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
        # Get user information if available
        user_info = ""
        try:
            if hasattr(request.state, "user"):
                user_info = f" - User: {request.state.user.id} ({request.state.user.email})"
        except:
            pass

        # Log the full exception with traceback
        logger.error(f"Unhandled error at {request.url.path}{user_info}: {repr(exc)}\n{traceback.format_exc()}")

        return JSONResponse(
            status_code=500,
            content={"error": "Internal Server Error"},
        )

    # Add rate limiter exception handler
    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        logger.warning(f"Rate limit exceeded at {request.url.path}")
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "details": str(exc)},
        )

    # Add CORS middleware to allow cross-origin requests
    # NOTE: In production, replace ["*"] with the actual frontend domain (e.g., ["https://mycreplatform.framer.website"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in development
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )

    # Include routers
    app.include_router(root.router)

    # Health check routes
    from .routes.health import router as health_router
    app.include_router(health_router, tags=["Health"])

    # Authentication routes
    # Use the database-enabled auth routes
    from .routes.auth_db import router as auth_db_router
    app.include_router(auth_db_router, tags=["Authentication"])

    # Legacy routes
    app.include_router(deals.router, prefix="/api")
    app.include_router(analyze.router, prefix="/api")
    app.include_router(investment.router, prefix="/api")
    app.include_router(underwriting.router, prefix="/api")
    app.include_router(report.router, prefix="/api")
    app.include_router(risk.router, prefix="/api")
    app.include_router(lease.router, prefix="/api")

    # Portfolio routes
    # Use the database-enabled portfolio routes
    from .routes.portfolio_db import router as portfolio_db_router
    app.include_router(portfolio_db_router, prefix="/api", tags=["Portfolio"])

    # AI Chat routes
    # Use the database-enabled AI chat routes
    from .routes.ai_chat_db import router as ai_chat_db_router
    app.include_router(ai_chat_db_router, prefix="/api", tags=["AI Chat"])

    # Chat Memory routes
    from .routes.chat_memory import router as chat_memory_router
    app.include_router(chat_memory_router, prefix="/api", tags=["Chat Memory"])

    # Dashboard routes
    from .routes.dashboard import router as dashboard_router
    app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])

    # Upload routes
    from .routes.upload import router as upload_router
    app.include_router(upload_router, prefix="/api", tags=["Uploads"])

    # Report routes
    from .routes.reports import router as reports_router
    app.include_router(reports_router, prefix="/api", tags=["Reports"])

    # Admin routes
    from .routes.admin import router as admin_router
    app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

    # Organization routes
    from .routes.orgs import router as orgs_router
    app.include_router(orgs_router, prefix="/api/orgs", tags=["Organizations"])

    # Invite routes
    from .routes.invites import router as invites_router
    app.include_router(invites_router, prefix="/api/invite", tags=["Invites"])

    # Comment routes
    from .routes.comments import router as comments_router
    app.include_router(comments_router, prefix="/api", tags=["Comments"])

    # Notification routes
    from .routes.notifications import router as notifications_router
    app.include_router(notifications_router, prefix="/api/notifications", tags=["Notifications"])

    # Import routes
    from .routes.deal_import import router as import_router
    app.include_router(import_router, prefix="/api", tags=["Import"])

    # Activity log routes
    from .routes.activity_log import router as activity_log_router
    app.include_router(activity_log_router, prefix="/api/activity", tags=["Activity"])

    # Budget routes
    from .routes.budget import router as budget_router
    app.include_router(budget_router, prefix="/api", tags=["Budget"])

    # Comparables routes
    from .routes.comparables import router as comparables_router
    app.include_router(comparables_router, prefix="/api", tags=["Comparables"])

    # Visibility routes
    from .routes.visibility import router as visibility_router
    app.include_router(visibility_router, prefix="/api", tags=["Visibility"])

    # Document routes
    from .routes.documents import router as documents_router
    app.include_router(documents_router, prefix="/api", tags=["Documents"])

    # Financing routes
    from .routes.financing import router as financing_router
    app.include_router(financing_router, prefix="/api", tags=["Financing"])

    # Metrics routes
    from .routes.metrics import router as metrics_router
    app.include_router(metrics_router, prefix="/api", tags=["Metrics"])

    # Alerts routes
    from .routes.alerts import router as alerts_router
    app.include_router(alerts_router, prefix="/api", tags=["Alerts"])

    # LP routes
    from .routes.lp import router as lp_router
    app.include_router(lp_router, prefix="/api", tags=["LP"])

    # Benchmark routes
    from .routes.benchmark import router as benchmark_router
    app.include_router(benchmark_router, prefix="/api", tags=["Benchmark"])

    # Property Attributes routes
    from .routes.property_attributes import router as property_attributes_router
    app.include_router(property_attributes_router, prefix="/api", tags=["Property Attributes"])

    # Geocoding routes
    from .routes.geocoding import router as geocoding_router
    app.include_router(geocoding_router, prefix="/api", tags=["Geocoding"])

    # Investment Strategy routes
    from .routes.investment_strategy import router as investment_strategy_router
    app.include_router(investment_strategy_router, prefix="/api", tags=["Investment Strategy"])

    # Seller Propensity routes
    from .routes.seller_propensity import router as seller_propensity_router
    app.include_router(seller_propensity_router, prefix="/api", tags=["Seller Propensity"])

    # Owner Stats routes
    from .routes.owner_stats import router as owner_stats_router
    app.include_router(owner_stats_router, prefix="/api", tags=["Owner Stats"])

    # Enhanced Underwriting routes
    from .routes.enhanced_underwriting import router as enhanced_underwriting_router
    app.include_router(enhanced_underwriting_router, prefix="/api", tags=["Enhanced Underwriting"])

    # Scenarios routes
    from .routes.scenarios import router as scenarios_router
    app.include_router(scenarios_router, prefix="/api", tags=["Scenarios"])

    # Waterfall routes
    from .routes.waterfall import router as waterfall_router
    app.include_router(waterfall_router, prefix="/api", tags=["Waterfall"])

    # Deal Stages routes
    from .routes.deal_stages import router as deal_stages_router
    app.include_router(deal_stages_router, prefix="/api", tags=["Deal Stages"])

    # Tasks routes
    from .routes.tasks import router as tasks_router
    app.include_router(tasks_router, prefix="/api", tags=["Tasks"])

    # Test Dashboard routes
    from .routes.test_dashboard import router as test_dashboard_router
    app.include_router(test_dashboard_router, prefix="/test-dashboard", tags=["Test Dashboard"])

    # Market Comps routes
    from .routes.market_comps import router as market_comps_router
    app.include_router(market_comps_router, prefix="/api", tags=["Market Comps"])

    # Debt Sizing routes
    from .routes.debt_sizing import router as debt_sizing_router
    app.include_router(debt_sizing_router, prefix="/api", tags=["Debt Sizing"])

    # Bulk Import routes
    from .routes.bulk_import import router as bulk_import_router
    app.include_router(bulk_import_router, prefix="/api", tags=["Bulk Import"])

    # Invoice routes
    from .routes.invoices import router as invoices_router
    app.include_router(invoices_router, prefix="/api", tags=["Invoices"])

    # Lease Management routes
    from .routes.lease_management import router as lease_management_router
    app.include_router(lease_management_router, prefix="/api", tags=["Lease Management"])

    # API routes are all set up

    # Deal CRUD routes
    # Use the database-enabled deal routes
    from .routes.deals_db import router as deals_db_router
    app.include_router(deals_db_router, prefix="/api", tags=["Deals"])

    # Deal CRUD routes with rate limiting
    from .routes.deals_crud import router as deals_crud_router
    app.include_router(deals_crud_router, prefix="/api", tags=["Deals CRUD"])

    return app


# Create the app
app = create_app()

# Create database tables
try:
    # Only create the market_comps table
    from .models.market_comp import MarketComp
    MarketComp.__table__.create(bind=engine, checkfirst=True)
    print("Market comps table created successfully")
except Exception as e:
    print(f"Error creating market_comps table: {str(e)}")

# Start background jobs
from .services.background_jobs import start_background_jobs
start_background_jobs()


if __name__ == "__main__":
    import uvicorn
    # Create the app if running directly
    application = create_app()
    uvicorn.run(application, host="0.0.0.0", port=8000)
