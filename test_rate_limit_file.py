import requests
import time
import json

# Test endpoint with rate limit of 5/minute
url = "http://127.0.0.1:8002/api/analyze-lease"

# Data for the request
data = {
    "lease_text": "This is a sample lease text for testing rate limiting."
}

# File to save results
output_file = "rate_limit_results.txt"

# Make 10 requests in quick succession
with open(output_file, "w") as f:
    f.write("Rate Limit Test Results\n")
    f.write("======================\n\n")
    
    for i in range(10):
        f.write(f"Making request {i+1}...\n")
        try:
            response = requests.post(url, json=data)
            f.write(f"Status code: {response.status_code}\n")
            if response.status_code != 200:
                f.write(f"Response: {response.text}\n")
        except Exception as e:
            f.write(f"Error: {e}\n")
        
        f.write("\n")
        time.sleep(0.5)  # Small delay between requests

print(f"Results saved to {output_file}")
