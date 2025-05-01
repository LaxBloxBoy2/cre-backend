@echo off
echo Starting QAPT Platform...

echo Starting Frontend Server...
start cmd /k "npm run dev"

echo Starting Backend Server...
cd cre_platform_backend
start cmd /k "call venv\Scripts\activate && uvicorn main:app --reload"

echo Servers are starting...
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:8000
echo.
echo Press any key to open the frontend in your browser...
pause > nul
start http://localhost:3000
