import requests

url = "http://127.0.0.1:5500/register"
data = {
    "email": "test123@gmail.com",
    "password": "pass123",
    "role": "admin"
}

res = requests.post(url, json=data)

print("Status:", res.status_code)
print("Headers:", res.headers)
print("Raw Body:", res.text)

# Only try to parse if it's JSON
if res.headers.get("Content-Type") == "application/json":
    print("Parsed JSON:", res.json())
else:
    print("Not JSON response!")

