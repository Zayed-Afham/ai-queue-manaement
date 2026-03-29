import requests

try:
    print("Testing /batch-tickets/ endpoint...")
    res = requests.post("http://localhost:8000/api/batch-tickets/", json={"count": 2})
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(f"Connection failed: {e}")
