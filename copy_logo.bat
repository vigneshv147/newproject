@echo off
echo Copying TN Police Cyber Crime Wing Logo...
copy /Y "C:\Users\Sreyas\.gemini\antigravity\brain\16180345-8e3b-4cc3-ac85-32231156b760\uploaded_image_1766383536990.jpg" "%~dp0public\logo.jpg"
if exist "%~dp0public\logo.jpg" (
    echo SUCCESS! Logo copied to public folder.
    echo Please refresh the browser to see the logo.
) else (
    echo FAILED! Please manually copy the logo.
)
pause
