import os
import sys
import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

def test_login():
    """Test logging in"""
    print("\n=== Testing Login ===")
    
    # Login
    login_data = {
        "username": "testuser@example.com",
        "password": "testpassword"
    }
    
    response = requests.post(f"{BASE_URL}/login", data=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"Login successful: {token_data}")
        return token_data["access_token"]
    else:
        print(f"Failed to login: {response.status_code} - {response.text}")
        return None

def test_create_deal(token):
    """Test creating a new deal"""
    print("\n=== Testing Deal Creation ===")
    
    # Create a new deal
    deal_data = {
        "project_name": "Test Project for Report",
        "location": "Test Location",
        "property_type": "Office",
        "acquisition_price": 1000000,
        "construction_cost": 500000,
        "square_footage": 10000,
        "projected_rent_per_sf": 30,
        "vacancy_rate": 5,
        "operating_expenses_per_sf": 10,
        "exit_cap_rate": 6,
        "status": "Draft"
    }
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(f"{BASE_URL}/api/deals/db", json=deal_data, headers=headers)
    
    if response.status_code == 201:
        deal = response.json()
        print(f"Deal created successfully: {deal}")
        return deal["id"]
    else:
        print(f"Failed to create deal: {response.status_code} - {response.text}")
        return None

def test_generate_report(token, deal_id):
    """Test generating a report"""
    print("\n=== Testing Report Generation ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.post(f"{BASE_URL}/api/deals/{deal_id}/generate-report", headers=headers)
    
    if response.status_code == 200:
        report_response = response.json()
        print(f"Report generated successfully: {report_response}")
        return report_response
    else:
        print(f"Failed to generate report: {response.status_code} - {response.text}")
        return None

def test_download_report(token, download_url):
    """Test downloading a report"""
    print("\n=== Testing Report Download ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{BASE_URL}{download_url}", headers=headers)
    
    if response.status_code == 200:
        # Save the report to a file
        filename = download_url.split("/")[-1]
        with open(filename, "wb") as f:
            f.write(response.content)
        print(f"Report downloaded successfully: {filename}")
        return filename
    else:
        print(f"Failed to download report: {response.status_code} - {response.text}")
        return None

def test_delete_deal(token, deal_id):
    """Test deleting a deal"""
    print("\n=== Testing Delete Deal ===")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.delete(f"{BASE_URL}/api/deals/db/{deal_id}", headers=headers)
    
    if response.status_code == 204:
        print(f"Deal deleted successfully")
        return True
    else:
        print(f"Failed to delete deal: {response.status_code} - {response.text}")
        return False

def run_tests():
    """Run all tests"""
    # Login
    token = test_login()
    if not token:
        return
    
    # Create a deal
    deal_id = test_create_deal(token)
    if not deal_id:
        return
    
    # Generate a report
    report_response = test_generate_report(token, deal_id)
    if not report_response:
        return
    
    # Download the report
    filename = test_download_report(token, report_response["download_url"])
    
    # Delete the deal
    test_delete_deal(token, deal_id)

if __name__ == "__main__":
    run_tests()
