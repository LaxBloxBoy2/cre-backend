import requests
import time

# Test endpoint with rate limit of 5/minute
url = "http://127.0.0.1:8003/api/risk-score"

# Data for the request
data = {
    "project_name": "Office Building",
    "property_type": "Office",
    "location": "New York, NY",
    "acquisition_price": 5000000,
    "construction_cost": 1000000,
    "square_footage": 20000,
    "projected_rent_per_sf": 50,
    "operating_expenses_per_sf": 20,
    "purchase_price": 5000000,
    "annual_income": 400000,
    "annual_expenses": 150000,
    "vacancy_rate": 5,
    "cap_rate": 5.0,
    "exit_cap_rate": 6.0,
    "loan_amount": 3500000,
    "loan_term_years": 30,
    "interest_rate": 4.5,
    "market_conditions": "Stable market with moderate growth potential."
}

# Make 10 requests in quick succession
for i in range(10):
    print(f"Making request {i+1}...")
    try:
        response = requests.post(url, json=data)
        print(f"Status code: {response.status_code}")
        if response.status_code != 200:
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

    # Small delay between requests
    time.sleep(0.5)
