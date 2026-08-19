import sys, json
sys.path.insert(0, '.')
import urllib.request

# Login
body = json.dumps({"username": "hriday", "pin": "123456"}).encode()
req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=body, headers={"Content-Type": "application/json"}, method="POST")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

token = data.get("data", {}).get("access_token")
print("Login SUCCESS - token:", token[:40] + "...")

# Journey analyze
body2 = json.dumps({"query": "I want to study masters in Australia", "domicileState": "Rajasthan"}).encode()
req2 = urllib.request.Request("http://localhost:8000/api/v1/journey/analyze", data=body2, 
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
with urllib.request.urlopen(req2) as resp2:
    data2 = json.loads(resp2.read())

journey_data = data2.get("data", {})
print("Journey SUCCESS")
print("  journeyId:", journey_data.get("journeyId"))
print("  goal:", journey_data.get("goal", {}).get("title"))
print("  docs have:", len(journey_data.get("documents", {}).get("have", [])))
print("  docs need:", len(journey_data.get("documents", {}).get("need", [])))
print("  central schemes:", len(journey_data.get("schemes", {}).get("central", [])))
print("  state schemes:", len(journey_data.get("schemes", {}).get("state", [])))

# Test business journey
body3 = json.dumps({"query": "I want to start a restaurant in Bangalore", "domicileState": "Rajasthan"}).encode()
req3 = urllib.request.Request("http://localhost:8000/api/v1/journey/analyze", data=body3,
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"}, method="POST")
with urllib.request.urlopen(req3) as resp3:
    data3 = json.loads(resp3.read())

j3 = data3.get("data", {})
print("\nRestaurant Journey SUCCESS")
print("  goal:", j3.get("goal", {}).get("title"))
print("  docs need:", len(j3.get("documents", {}).get("need", [])))
print("  central schemes:", len(j3.get("schemes", {}).get("central", [])))
print("  state schemes:", len(j3.get("schemes", {}).get("state", [])))
