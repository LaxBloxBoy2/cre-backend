import csv
import json
import uuid
import datetime
import os
from sqlalchemy.orm import Session
from models import Asset, AssetType, Tenant, PaymentHistory, Lease, LeaseStatus, LeaseType, RenewalOption
from database import engine, SessionLocal

def import_assets(file_path):
    """Import assets from a CSV file."""
    print(f"Importing assets from {file_path}...")
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        db = SessionLocal()
        try:
            for row in reader:
                asset = Asset(
                    id=uuid.uuid4(),
                    name=row['name'],
                    asset_type=getattr(AssetType, row['asset_type']),
                    address=row['address'],
                    city=row['city'],
                    state=row['state'],
                    zip_code=row['zip_code'],
                    total_area=float(row['total_area']),
                    year_built=int(row['year_built']) if row['year_built'] else None,
                    floors=int(row['floors']) if row['floors'] else None,
                    units=int(row['units']) if row['units'] else None,
                    purchase_price=float(row['purchase_price']) if row['purchase_price'] else None,
                    current_value=float(row['current_value']) if row['current_value'] else None,
                    annual_taxes=float(row['annual_taxes']) if row['annual_taxes'] else None,
                    annual_insurance=float(row['annual_insurance']) if row['annual_insurance'] else None
                )
                db.add(asset)
            db.commit()
            print(f"Successfully imported assets.")
        except Exception as e:
            db.rollback()
            print(f"Error importing assets: {e}")
        finally:
            db.close()

def import_tenants(file_path):
    """Import tenants from a CSV file."""
    print(f"Importing tenants from {file_path}...")
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        db = SessionLocal()
        try:
            for row in reader:
                tenant = Tenant(
                    id=uuid.uuid4(),
                    name=row['name'],
                    contact_name=row['contact_name'],
                    contact_email=row['contact_email'],
                    contact_phone=row['contact_phone'],
                    industry=row['industry'],
                    credit_rating=row['credit_rating'] if row['credit_rating'] else None,
                    payment_history=getattr(PaymentHistory, row['payment_history']) if row['payment_history'] else None,
                    notes=row['notes'] if row['notes'] else None,
                    year_founded=int(row['year_founded']) if row['year_founded'] else None,
                    company_size=row['company_size'] if row['company_size'] else None,
                    website=row['website'] if row['website'] else None,
                    address=row['address'] if row['address'] else None,
                    city=row['city'] if row['city'] else None,
                    state=row['state'] if row['state'] else None,
                    zip_code=row['zip_code'] if row['zip_code'] else None,
                    annual_revenue=float(row['annual_revenue']) if row['annual_revenue'] else None,
                    profit_margin=float(row['profit_margin']) if row['profit_margin'] else None,
                    debt_to_equity_ratio=float(row['debt_to_equity_ratio']) if row['debt_to_equity_ratio'] else None,
                    current_ratio=float(row['current_ratio']) if row['current_ratio'] else None,
                    quick_ratio=float(row['quick_ratio']) if row['quick_ratio'] else None,
                    satisfaction_rating=float(row['satisfaction_rating']) if row['satisfaction_rating'] else None
                )
                db.add(tenant)
            db.commit()
            print(f"Successfully imported tenants.")
        except Exception as e:
            db.rollback()
            print(f"Error importing tenants: {e}")
        finally:
            db.close()

def import_leases(file_path):
    """Import leases from a CSV file."""
    print(f"Importing leases from {file_path}...")
    with open(file_path, 'r') as f:
        reader = csv.DictReader(f)
        db = SessionLocal()
        try:
            # Get all assets and tenants
            assets = {str(asset.id): asset for asset in db.query(Asset).all()}
            tenants = {str(tenant.id): tenant for tenant in db.query(Tenant).all()}
            
            for row in reader:
                # Parse dates
                start_date = datetime.datetime.strptime(row['start_date'], '%Y-%m-%d')
                end_date = datetime.datetime.strptime(row['end_date'], '%Y-%m-%d')
                
                # Determine status
                now = datetime.datetime.utcnow()
                if now < start_date:
                    status = LeaseStatus.UPCOMING
                elif now > end_date:
                    status = LeaseStatus.EXPIRED
                else:
                    status = LeaseStatus.ACTIVE
                
                # Create lease
                lease = Lease(
                    id=uuid.uuid4(),
                    asset_id=uuid.UUID(row['asset_id']),
                    tenant_id=uuid.UUID(row['tenant_id']),
                    lease_type=getattr(LeaseType, row['lease_type']),
                    start_date=start_date,
                    end_date=end_date,
                    base_rent=float(row['base_rent']),
                    rent_escalation=float(row['rent_escalation']),
                    security_deposit=float(row['security_deposit']),
                    lease_area=float(row['lease_area']),
                    status=status,
                    notes=row['notes'] if row['notes'] else None
                )
                db.add(lease)
                
                # Add renewal options if provided
                if row.get('renewal_options'):
                    options = json.loads(row['renewal_options'])
                    for option in options:
                        renewal = RenewalOption(
                            id=uuid.uuid4(),
                            lease_id=lease.id,
                            term=option['term'],
                            notice_required=option['notice_required'],
                            rent_increase=option['rent_increase']
                        )
                        db.add(renewal)
            
            db.commit()
            print(f"Successfully imported leases.")
        except Exception as e:
            db.rollback()
            print(f"Error importing leases: {e}")
        finally:
            db.close()

def create_sample_data():
    """Create sample data files if they don't exist."""
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    # Create sample assets
    if not os.path.exists('data/assets.csv'):
        print("Creating sample assets data...")
        with open('data/assets.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'name', 'asset_type', 'address', 'city', 'state', 'zip_code',
                'total_area', 'year_built', 'floors', 'units', 'purchase_price',
                'current_value', 'annual_taxes', 'annual_insurance'
            ])
            
            # Sample office building
            writer.writerow([
                'Downtown Office Tower', 'OFFICE', '123 Main St', 'New York', 'NY', '10001',
                '50000', '2005', '15', '30', '25000000', '30000000', '500000', '150000'
            ])
            
            # Sample retail center
            writer.writerow([
                'Westside Shopping Center', 'RETAIL', '456 Market Ave', 'Los Angeles', 'CA', '90001',
                '75000', '2010', '2', '25', '15000000', '18000000', '300000', '100000'
            ])
            
            # Sample industrial property
            writer.writerow([
                'Eastside Industrial Park', 'INDUSTRIAL', '789 Factory Rd', 'Chicago', 'IL', '60007',
                '100000', '2000', '1', '5', '10000000', '12000000', '200000', '80000'
            ])
            
            # Sample multifamily property
            writer.writerow([
                'Riverside Apartments', 'MULTIFAMILY', '321 River Dr', 'Miami', 'FL', '33101',
                '60000', '2015', '8', '120', '30000000', '35000000', '600000', '200000'
            ])
            
            # Sample mixed-use property
            writer.writerow([
                'Central Square', 'MIXED_USE', '555 Central Ave', 'San Francisco', 'CA', '94103',
                '80000', '2018', '10', '50', '40000000', '45000000', '800000', '250000'
            ])
    
    # Create sample tenants
    if not os.path.exists('data/tenants.csv'):
        print("Creating sample tenants data...")
        with open('data/tenants.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'name', 'contact_name', 'contact_email', 'contact_phone', 'industry',
                'credit_rating', 'payment_history', 'notes', 'year_founded', 'company_size',
                'website', 'address', 'city', 'state', 'zip_code', 'annual_revenue',
                'profit_margin', 'debt_to_equity_ratio', 'current_ratio', 'quick_ratio',
                'satisfaction_rating'
            ])
            
            # Sample tech company
            writer.writerow([
                'TechCorp Inc.', 'John Smith', 'john@techcorp.com', '555-123-4567', 'Technology',
                'A', 'EXCELLENT', 'Long-term tenant', '2005', '500-1000',
                'https://techcorp.com', '100 Tech Blvd', 'San Francisco', 'CA', '94103', '50000000',
                '15', '0.8', '2.5', '2.0', '4.5'
            ])
            
            # Sample retail company
            writer.writerow([
                'Fashion Outlet', 'Jane Doe', 'jane@fashionoutlet.com', '555-234-5678', 'Retail',
                'B', 'GOOD', 'Expanding operations', '2010', '100-500',
                'https://fashionoutlet.com', '200 Retail Row', 'Los Angeles', 'CA', '90001', '20000000',
                '10', '1.2', '1.8', '1.5', '4.0'
            ])
            
            # Sample law firm
            writer.writerow([
                'Legal Partners LLP', 'Robert Johnson', 'robert@legalpartners.com', '555-345-6789', 'Legal',
                'A+', 'EXCELLENT', 'Premium tenant', '1995', '50-100',
                'https://legalpartners.com', '300 Law Lane', 'New York', 'NY', '10001', '30000000',
                '25', '0.5', '3.0', '2.8', '4.8'
            ])
            
            # Sample restaurant
            writer.writerow([
                'Gourmet Dining', 'Maria Garcia', 'maria@gourmetdining.com', '555-456-7890', 'Food & Beverage',
                'B-', 'FAIR', 'Seasonal business', '2015', '10-50',
                'https://gourmetdining.com', '400 Food Court', 'Miami', 'FL', '33101', '5000000',
                '8', '1.5', '1.2', '0.9', '3.5'
            ])
            
            # Sample manufacturing company
            writer.writerow([
                'Industrial Solutions', 'David Lee', 'david@industrialsolutions.com', '555-567-8901', 'Manufacturing',
                'B+', 'GOOD', 'Heavy equipment', '2000', '100-500',
                'https://industrialsolutions.com', '500 Factory Way', 'Chicago', 'IL', '60007', '40000000',
                '12', '1.0', '2.0', '1.7', '4.2'
            ])
    
    # Create sample leases
    if not os.path.exists('data/leases.csv'):
        print("Creating sample leases data...")
        with open('data/leases.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'asset_id', 'tenant_id', 'lease_type', 'start_date', 'end_date',
                'base_rent', 'rent_escalation', 'security_deposit', 'lease_area',
                'notes', 'renewal_options'
            ])
            
            # We'll need to fill in the asset_id and tenant_id after importing those
            writer.writerow([
                '{asset_id_1}', '{tenant_id_1}', 'OFFICE', '2020-01-01', '2025-12-31',
                '25000', '3', '75000', '10000',
                'Premium office space', '[{"term": 60, "notice_required": 6, "rent_increase": 5}]'
            ])
            
            writer.writerow([
                '{asset_id_2}', '{tenant_id_2}', 'RETAIL', '2021-03-01', '2026-02-28',
                '15000', '2.5', '45000', '5000',
                'Corner unit with high visibility', '[{"term": 36, "notice_required": 3, "rent_increase": 3}]'
            ])
            
            writer.writerow([
                '{asset_id_3}', '{tenant_id_5}', 'INDUSTRIAL', '2019-06-01', '2024-05-31',
                '20000', '2', '40000', '15000',
                'Warehouse with loading docks', '[{"term": 48, "notice_required": 4, "rent_increase": 2.5}]'
            ])
            
            writer.writerow([
                '{asset_id_4}', '{tenant_id_4}', 'RETAIL', '2022-01-01', '2023-12-31',
                '10000', '3', '30000', '2000',
                'Restaurant space with outdoor seating', '[{"term": 24, "notice_required": 3, "rent_increase": 4}]'
            ])
            
            writer.writerow([
                '{asset_id_5}', '{tenant_id_3}', 'OFFICE', '2021-09-01', '2026-08-31',
                '30000', '3.5', '90000', '8000',
                'Premium office with city views', '[{"term": 60, "notice_required": 6, "rent_increase": 4}]'
            ])
    
    print("Sample data files created.")

def update_lease_ids():
    """Update the lease CSV file with actual asset and tenant IDs."""
    print("Updating lease data with actual IDs...")
    db = SessionLocal()
    try:
        # Get all assets and tenants
        assets = list(db.query(Asset).all())
        tenants = list(db.query(Tenant).all())
        
        if not assets or not tenants:
            print("No assets or tenants found in the database. Import them first.")
            return
        
        # Read the lease template
        with open('data/leases.csv', 'r') as f:
            content = f.read()
        
        # Replace placeholders with actual IDs
        content = content.replace('{asset_id_1}', str(assets[0].id))
        content = content.replace('{asset_id_2}', str(assets[1].id))
        content = content.replace('{asset_id_3}', str(assets[2].id))
        content = content.replace('{asset_id_4}', str(assets[3].id))
        content = content.replace('{asset_id_5}', str(assets[4].id))
        
        content = content.replace('{tenant_id_1}', str(tenants[0].id))
        content = content.replace('{tenant_id_2}', str(tenants[1].id))
        content = content.replace('{tenant_id_3}', str(tenants[2].id))
        content = content.replace('{tenant_id_4}', str(tenants[3].id))
        content = content.replace('{tenant_id_5}', str(tenants[4].id))
        
        # Write the updated content
        with open('data/leases.csv', 'w') as f:
            f.write(content)
        
        print("Lease data updated with actual IDs.")
    except Exception as e:
        print(f"Error updating lease IDs: {e}")
    finally:
        db.close()

def import_all_data():
    """Import all data from CSV files."""
    # Create sample data files if they don't exist
    create_sample_data()
    
    # Import assets and tenants
    import_assets('data/assets.csv')
    import_tenants('data/tenants.csv')
    
    # Update lease IDs and import leases
    update_lease_ids()
    import_leases('data/leases.csv')
    
    print("All data imported successfully!")

if __name__ == "__main__":
    import_all_data()
