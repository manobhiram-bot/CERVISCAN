import urllib.request
import json

url = "http://127.0.0.1:8080/cerviscan-backend/api/send_otp.php"
data = {"email": "manodoradla7@gmail.com"}
headers = {"Content-Type": "application/json"}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print("Response:", html)
except Exception as e:
    print("Error:", e)
