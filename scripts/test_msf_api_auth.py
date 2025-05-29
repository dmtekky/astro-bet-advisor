import requests
import os
from dotenv import load_dotenv
import json
import base64

# Load environment variables
load_dotenv()

# MySportsFeeds API credentials
MSF_API_KEY = os.getenv('MY_SPORTS_FEEDS_API_KEY')
MSF_PASSWORD = os.getenv('MY_SPORTS_FEEDS_PASSWORD')

if not MSF_API_KEY:
    raise ValueError("Missing required environment variable MY_SPORTS_FEEDS_API_KEY")

# Try different authentication methods
auth_methods = [
    # Basic auth with API key and password
    ("Basic", f"{MSF_API_KEY}:{MSF_PASSWORD}"),
    
    # Basic auth with API key and "MYSPORTSFEEDS" password
    ("Basic", f"{MSF_API_KEY}:MYSPORTSFEEDS"),
    
    # Basic auth with API key and empty password
    ("Basic", f"{MSF_API_KEY}:"),
    
    # Basic auth with API key and "null" password
    ("Basic", f"{MSF_API_KEY}:null"),
    
    # Token auth
    ("Bearer", MSF_API_KEY)
]

# API details
api_version = "v2.2"
league = "mlb"
api_format = "json"
season = "2024-regular"

# Test endpoint
endpoint = "team_profile"
url = f"https://api.mysportsfeeds.com/{api_version}/pull/{league}/{season}/{endpoint}.{api_format}"

print("Testing different authentication methods...")

for auth_type, auth_value in auth_methods:
    print(f"\nTesting auth method: {auth_type} with {auth_value}")
    
    # Prepare headers
    auth_header = base64.b64encode(auth_value.encode('utf-8')).decode('utf-8')
    headers = {
        "Authorization": f"{auth_type} {auth_header}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            print("\nResponse data:")
            print(json.dumps(response.json(), indent=2))
        elif response.status_code == 404:
            print("\nEndpoint not found")
        else:
            print(f"\nError: {response.text}")
            
    except Exception as e:
        print(f"Error testing auth method: {str(e)}")
