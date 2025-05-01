import time
import threading
import schedule
from datetime import datetime
from ..database import SessionLocal
from ..alerts_service import check_for_alerts
from ..market_comp_service import update_market_comps
from ..utils.logging_utils import get_logger

# Get logger
logger = get_logger(__name__)

def run_alert_check():
    """
    Run the alert check job
    """
    logger.info("Running alert check job")

    # Create a new database session
    db = SessionLocal()

    try:
        # Check for alerts
        created_alerts = check_for_alerts(db)

        # Log results
        logger.info(f"Alert check job completed. Created {len(created_alerts)} alerts.")

        # Log details of created alerts
        for alert in created_alerts:
            logger.info(f"Created alert: {alert.alert_type} - {alert.message}")

    except Exception as e:
        logger.error(f"Error in alert check job: {str(e)}")

    finally:
        # Close the database session
        db.close()

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

def run_scheduled_jobs():
    """
    Run scheduled jobs
    """
    # Schedule the alert check job to run daily at midnight
    schedule.every().day.at("00:00").do(run_alert_check)

    # Schedule the market comp update job to run daily at 2:00 AM
    schedule.every().day.at("02:00").do(run_market_comp_update)

    # Run the job loop
    while True:
        schedule.run_pending()
        time.sleep(60)  # Sleep for 60 seconds

def start_background_jobs():
    """
    Start background jobs in a separate thread
    """
    # Create a thread for the scheduled jobs
    thread = threading.Thread(target=run_scheduled_jobs)
    thread.daemon = True  # Daemon threads are killed when the main program exits

    # Start the thread
    thread.start()

    logger.info("Background jobs started")
