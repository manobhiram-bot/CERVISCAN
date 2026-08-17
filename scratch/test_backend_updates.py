import urllib.request
import json

base_url = "http://127.0.0.1:8080/cerviscan-backend/api/"
headers = {"Content-Type": "application/json"}

# 1. Test send_otp.php with unregistered email
print("--- Test send_otp.php with unregistered email ---")
data = {"email": "nonexistent@example.com"}
req = urllib.request.Request(base_url + "send_otp.php", data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as res:
        print("Response:", res.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)

# 2. Test send_otp.php with registered email
print("\n--- Test send_otp.php with registered email ---")
data = {"email": "manodoradla7@gmail.com"}
req = urllib.request.Request(base_url + "send_otp.php", data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as res:
        print("Response:", res.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)

# 3. Test reset_password.php with registered email
print("\n--- Test reset_password.php with registered email ---")
data = {"email": "manodoradla7@gmail.com", "password": "mano_new_password_123"}
req = urllib.request.Request(base_url + "reset_password.php", data=json.dumps(data).encode('utf-8'), headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as res:
        print("Response:", res.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
