import requests
import time

# Test endpoint with rate limit
url = "http://127.0.0.1:8002/api/deals-crud/deals"

# Make 25 requests in quick succession
for i in range(25):
    print(f"Making request {i+1}...")
    try:
        response = requests.get(url)
        print(f"Status code: {response.status_code}")
        if response.status_code != 200 and response.status_code != 429:
            print(f"Response: {response.text}")
        elif response.status_code == 429:
            print("Rate limit exceeded!")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

    # Small delay between requests
    time.sleep(0.2)
