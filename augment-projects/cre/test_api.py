import requests
import json

def test_api():
    """
    Test the API endpoints
    """
    # Base URL for the API
    base_url = "http://localhost:8000"
    
    # Test the root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"Root endpoint: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error testing root endpoint: {str(e)}")
    
    # Test the market comps endpoint
    try:
        response = requests.get(f"{base_url}/api/comps", params={
            "lat": 32.7,
            "lng": -117.2,
            "radius": 10
        })
        print(f"Market comps endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {data.get('total', 0)} market comps")
            for comp in data.get("comps", [])[:3]:  # Show first 3 comps
                print(f"  - {comp.get('id')}: {comp.get('property_type')} in {comp.get('city')}, {comp.get('state')}")
    except Exception as e:
        print(f"Error testing market comps endpoint: {str(e)}")

if __name__ == "__main__":
    test_api()
