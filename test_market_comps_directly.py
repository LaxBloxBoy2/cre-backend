import os
import sys
import uuid
from datetime import datetime

# Add the cre_platform_backend directory to the path
sys.path.append(os.path.join(os.getcwd(), "cre_platform_backend"))

# Import the necessary modules
from models.market_comp import MarketComp
from schemas.market_comp_schema import MarketCompBase, MarketCompCreate, MarketCompInDB
from services.market_comp_service import fetch_loopnet_comps

def test_market_comp_model():
    """Test the MarketComp model"""
    print("Testing MarketComp model...")
    
    # Create a test market comp
    test_comp = MarketComp(
        id=uuid.uuid4(),
        property_type="Test Property",
        latitude=32.7,
        longitude=-117.2,
        city="Test City",
        state="TS",
        zipcode="12345",
        price=1000000,
        rent=5000,
        beds=3,
        baths=2,
        sqft=2000,
        created_at=datetime.now(),
        source="Test"
    )
    
    print(f"Created test market comp: {test_comp}")
    print(f"  - ID: {test_comp.id}")
    print(f"  - Property Type: {test_comp.property_type}")
    print(f"  - Location: {test_comp.city}, {test_comp.state} {test_comp.zipcode}")
    print(f"  - Price: ${test_comp.price}")
    print(f"  - Rent: ${test_comp.rent}")
    print(f"  - Beds: {test_comp.beds}")
    print(f"  - Baths: {test_comp.baths}")
    print(f"  - Square Feet: {test_comp.sqft}")
    print(f"  - Created At: {test_comp.created_at}")
    print(f"  - Source: {test_comp.source}")
    
    print("MarketComp model test completed successfully!")

def test_market_comp_schema():
    """Test the MarketComp schema"""
    print("\nTesting MarketComp schema...")
    
    # Create a test market comp schema
    test_comp_schema = MarketCompBase(
        property_type="Test Property",
        latitude=32.7,
        longitude=-117.2,
        city="Test City",
        state="TS",
        zipcode="12345",
        price=1000000,
        rent=5000,
        beds=3,
        baths=2,
        sqft=2000,
        source="Test"
    )
    
    print(f"Created test market comp schema: {test_comp_schema}")
    print(f"  - Property Type: {test_comp_schema.property_type}")
    print(f"  - Location: {test_comp_schema.city}, {test_comp_schema.state} {test_comp_schema.zipcode}")
    print(f"  - Price: ${test_comp_schema.price}")
    print(f"  - Rent: ${test_comp_schema.rent}")
    print(f"  - Beds: {test_comp_schema.beds}")
    print(f"  - Baths: {test_comp_schema.baths}")
    print(f"  - Square Feet: {test_comp_schema.sqft}")
    print(f"  - Source: {test_comp_schema.source}")
    
    print("MarketComp schema test completed successfully!")

def test_loopnet_api():
    """Test the LoopNet API integration"""
    print("\nTesting LoopNet API integration...")
    
    try:
        # Set the RAPIDAPI_KEY environment variable
        os.environ["RAPIDAPI_KEY"] = "92e538cc3emsh09a1774d80151f4p18579bjsn4de8cee86769"
        
        # Fetch property data from LoopNet API
        properties = fetch_loopnet_comps()
        
        print(f"Fetched {len(properties)} properties from LoopNet API:")
        for i, prop in enumerate(properties):
            print(f"\nProperty {i+1}:")
            for key, value in prop.items():
                print(f"  - {key}: {value}")
        
        print("\nLoopNet API integration test completed successfully!")
    
    except Exception as e:
        print(f"Error testing LoopNet API integration: {str(e)}")

if __name__ == "__main__":
    test_market_comp_model()
    test_market_comp_schema()
    test_loopnet_api()
