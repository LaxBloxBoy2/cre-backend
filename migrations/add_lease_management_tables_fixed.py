"""
Migration script to add lease management tables to the database.
"""
import os
import sys
import logging
from datetime import datetime
import uuid

# Add the parent directory to the path so we can import from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, get_db
from sqlalchemy import text
from models.asset import Asset, Fund
from models.lease import Lease, Tenant, RenewalOption, LeaseStatus, LeaseType, PaymentHistory

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def create_tables():
    """Create the lease management tables"""
    try:
        # Create tables in the correct order to respect foreign key constraints
        # First, create the Fund table
        Fund.__table__.create(bind=engine, checkfirst=True)
        logger.info("Fund table created successfully")
        
        # Then create the Asset table that references Fund
        Asset.__table__.create(bind=engine, checkfirst=True)
        logger.info("Asset table created successfully")
        
        # Create the Tenant table
        Tenant.__table__.create(bind=engine, checkfirst=True)
        logger.info("Tenant table created successfully")
        
        # Create the Lease table that references Asset and Tenant
        Lease.__table__.create(bind=engine, checkfirst=True)
        logger.info("Lease table created successfully")
        
        # Finally, create the RenewalOption table that references Lease
        RenewalOption.__table__.create(bind=engine, checkfirst=True)
        logger.info("RenewalOption table created successfully")
        
        logger.info("All lease management tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Error creating lease management tables: {str(e)}")
        return False


def seed_sample_data():
    """Seed the database with sample data for testing"""
    try:
        # Get a database session
        db = next(get_db())
        
        # Check if we already have data
        existing_funds = db.query(Fund).count()
        if existing_funds > 0:
            logger.info("Sample data already exists, skipping seeding")
            return True
        
        # Create a sample fund
        fund = Fund(
            id=uuid.uuid4(),
            name="Sample Fund",
            target_irr=15.0
        )
        db.add(fund)
        db.flush()
        
        # Create sample assets
        assets = [
            Asset(
                id=uuid.uuid4(),
                name="Office Building A",
                property_type="Office",
                location="123 Main St, New York, NY",
                value=10000000.0,
                noi=750000.0,
                debt_service=450000.0,
                cap_rate=0.075,
                required_capex=250000.0,
                square_footage=50000.0,
                year_built=2005,
                fund_id=fund.id,
                latitude=40.7128,
                longitude=-74.0060
            ),
            Asset(
                id=uuid.uuid4(),
                name="Retail Center B",
                property_type="Retail",
                location="456 Market St, San Francisco, CA",
                value=8500000.0,
                noi=680000.0,
                debt_service=400000.0,
                cap_rate=0.08,
                required_capex=150000.0,
                square_footage=35000.0,
                year_built=2000,
                fund_id=fund.id,
                latitude=37.7749,
                longitude=-122.4194
            ),
            Asset(
                id=uuid.uuid4(),
                name="Industrial Park C",
                property_type="Industrial",
                location="789 Warehouse Blvd, Chicago, IL",
                value=12000000.0,
                noi=960000.0,
                debt_service=550000.0,
                cap_rate=0.08,
                required_capex=300000.0,
                square_footage=100000.0,
                year_built=1995,
                fund_id=fund.id,
                latitude=41.8781,
                longitude=-87.6298
            )
        ]
        
        for asset in assets:
            db.add(asset)
        db.flush()
        
        # Create sample tenants
        tenants = [
            Tenant(
                id=uuid.uuid4(),
                name="ABC Corporation",
                contact_name="John Smith",
                contact_email="john@abccorp.com",
                contact_phone="(212) 555-1234",
                industry="Technology",
                credit_rating="A+",
                payment_history=PaymentHistory.EXCELLENT
            ),
            Tenant(
                id=uuid.uuid4(),
                name="XYZ Retail",
                contact_name="Jane Doe",
                contact_email="jane@xyzretail.com",
                contact_phone="(415) 555-5678",
                industry="Retail",
                credit_rating="B+",
                payment_history=PaymentHistory.GOOD
            ),
            Tenant(
                id=uuid.uuid4(),
                name="123 Manufacturing",
                contact_name="Bob Johnson",
                contact_email="bob@123manufacturing.com",
                contact_phone="(312) 555-9012",
                industry="Manufacturing",
                credit_rating="A-",
                payment_history=PaymentHistory.GOOD
            ),
            Tenant(
                id=uuid.uuid4(),
                name="Global Logistics",
                contact_name="Sarah Williams",
                contact_email="sarah@globallogistics.com",
                contact_phone="(312) 555-3456",
                industry="Logistics",
                credit_rating="B",
                payment_history=PaymentHistory.FAIR
            )
        ]
        
        for tenant in tenants:
            db.add(tenant)
        db.flush()
        
        # Create sample leases
        now = datetime.utcnow()
        
        # Calculate dates for different lease statuses
        active_start = datetime(now.year - 2, now.month, 1)
        active_end = datetime(now.year + 2, now.month, 1)
        
        expiring_soon_start = datetime(now.year - 3, now.month, 1)
        expiring_soon_end = datetime(now.year, now.month + 3, 1)
        
        expired_start = datetime(now.year - 5, now.month, 1)
        expired_end = datetime(now.year - 1, now.month, 1)
        
        upcoming_start = datetime(now.year + 1, now.month, 1)
        upcoming_end = datetime(now.year + 5, now.month, 1)
        
        leases = [
            # Active leases
            Lease(
                id=uuid.uuid4(),
                asset_id=assets[0].id,
                tenant_id=tenants[0].id,
                lease_type=LeaseType.OFFICE,
                start_date=active_start,
                end_date=active_end,
                base_rent=25000.0,
                rent_escalation=3.0,
                security_deposit=50000.0,
                lease_area=10000.0,
                status=LeaseStatus.ACTIVE
            ),
            Lease(
                id=uuid.uuid4(),
                asset_id=assets[1].id,
                tenant_id=tenants[1].id,
                lease_type=LeaseType.RETAIL,
                start_date=active_start,
                end_date=active_end,
                base_rent=18000.0,
                rent_escalation=2.5,
                security_deposit=36000.0,
                lease_area=5000.0,
                status=LeaseStatus.ACTIVE
            ),
            
            # Expiring soon leases
            Lease(
                id=uuid.uuid4(),
                asset_id=assets[0].id,
                tenant_id=tenants[2].id,
                lease_type=LeaseType.OFFICE,
                start_date=expiring_soon_start,
                end_date=expiring_soon_end,
                base_rent=15000.0,
                rent_escalation=2.0,
                security_deposit=30000.0,
                lease_area=6000.0,
                status=LeaseStatus.ACTIVE
            ),
            
            # Expired leases
            Lease(
                id=uuid.uuid4(),
                asset_id=assets[2].id,
                tenant_id=tenants[3].id,
                lease_type=LeaseType.INDUSTRIAL,
                start_date=expired_start,
                end_date=expired_end,
                base_rent=35000.0,
                rent_escalation=2.0,
                security_deposit=70000.0,
                lease_area=25000.0,
                status=LeaseStatus.EXPIRED
            ),
            
            # Upcoming leases
            Lease(
                id=uuid.uuid4(),
                asset_id=assets[2].id,
                tenant_id=tenants[0].id,
                lease_type=LeaseType.INDUSTRIAL,
                start_date=upcoming_start,
                end_date=upcoming_end,
                base_rent=40000.0,
                rent_escalation=2.5,
                security_deposit=80000.0,
                lease_area=30000.0,
                status=LeaseStatus.UPCOMING
            )
        ]
        
        for lease in leases:
            db.add(lease)
        
        # Create sample renewal options
        renewal_options = [
            RenewalOption(
                id=uuid.uuid4(),
                lease_id=leases[0].id,
                term=60,  # 5 years in months
                notice_required=6,  # 6 months notice
                rent_increase=10.0  # 10% increase
            ),
            RenewalOption(
                id=uuid.uuid4(),
                lease_id=leases[1].id,
                term=36,  # 3 years in months
                notice_required=3,  # 3 months notice
                rent_increase=8.0  # 8% increase
            )
        ]
        
        for option in renewal_options:
            db.add(option)
        
        # Commit all changes
        db.commit()
        
        logger.info("Sample data seeded successfully")
        return True
    except Exception as e:
        logger.error(f"Error seeding sample data: {str(e)}")
        db.rollback()
        return False


if __name__ == "__main__":
    logger.info("Starting lease management tables migration")
    
    # Create tables
    if create_tables():
        # Seed sample data
        seed_sample_data()
    
    logger.info("Lease management tables migration completed")
