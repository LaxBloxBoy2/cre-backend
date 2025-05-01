import logging
import schedule
import time
from datetime import datetime, timezone
from ..database import SessionLocal
from ..market_comp_service import update_market_comps

# Get logger
logger = logging.getLogger(__name__)

def run_market_comp_update():
    """
    Run the market comp update job
    """
    logger.info("Running market comp update job")
    
    # Create a new database session
    db = SessionLocal()
    
    try:
        # Update market comps
        updated_count = update_market_comps(db)
        
        # Log results
        logger.info(f"Market comp update job completed. Updated {updated_count} market comps.")
    
    except Exception as e:
        logger.error(f"Error in market comp update job: {str(e)}")
    
    finally:
        # Close the database session
        db.close()

def schedule_market_comp_update():
    """
    Schedule the market comp update job
    """
    # Schedule the job to run every day at 2:00 AM
    schedule.every().day.at("02:00").do(run_market_comp_update)
    
    logger.info("Market comp update job scheduled to run daily at 2:00 AM")
