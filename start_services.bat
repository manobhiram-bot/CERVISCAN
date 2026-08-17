@echo off
echo ===================================================
echo   CerviScan Services Startup Script
echo ===================================================

:: 1. Start XAMPP Apache and MySQL
echo Starting Apache and MySQL via XAMPP...
cd /d C:\xampp
start "" mysql_start.bat
start "" apache_start.bat

:: 2. Start Flask AI Service
echo Starting Python Flask AI service...
cd /d C:\xampp\htdocs\cerviscan-backend\ai_service
start "" python app.py

:: 3. Run ADB Reverse commands if device is connected
echo Configuring ADB port forwarding for connected devices...
set ADB="C:\Users\Manobhiram\AppData\Local\Android\Sdk\platform-tools\adb.exe"
if exist %ADB% (
    %ADB% reverse tcp:8080 tcp:8080
    %ADB% reverse tcp:5000 tcp:5000
    echo ADB reverse configured successfully!
) else (
    echo ADB not found at standard location, skipping port reverse.
)

echo All services initiated! Feel free to run your app now.
echo ===================================================
pause
