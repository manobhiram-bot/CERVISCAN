import urllib.request
import json

url = "http://127.0.0.1:8080/cerviscan-backend/api/verify_otp.php"
headers = {"Content-Type": "application/json"}

# 1. Test incorrect OTP
data_incorrect = {"email": "manodoradla7@gmail.com", "otp": "000000"}
req1 = urllib.request.Request(url, data=json.dumps(data_incorrect).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req1) as response:
        print("Incorrect OTP response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error with incorrect OTP:", e)

# 2. Test correct OTP (which we fetched from DB: 243464)
# Note: we need to find what OTP is currently in DB first or we can just hardcode the one we saw if it hasn't expired.
data_correct = {"email": "manodoradla7@gmail.com", "otp": "243464"}
req2 = urllib.request.Request(url, data=json.dumps(data_correct).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req2) as response:
        print("Correct OTP response:", response.read().decode('utf-8'))
except Exception as e:
    print("Error with correct OTP:", e)
