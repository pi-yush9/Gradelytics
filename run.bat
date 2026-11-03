@echo off
title Gradelytics Launcher
echo ==========================================================
echo   GRADELYTICS - AI Student Performance Prediction System
echo   Predict Better. Perform Better.
echo ==========================================================
echo Starting Backend and Frontend simultaneously...

start "Gradelytics Backend" cmd /c "%~dp0run_backend.bat"
start "Gradelytics Frontend" cmd /c "%~dp0run_frontend.bat"

echo.
echo Both servers initiated!
echo Backend API:  http://127.0.0.1:5000
echo Frontend App: http://localhost:5173
echo.
echo Demo Credentials:
echo Email:    educator@gradelytics.com
echo Password: admin123
echo ==========================================================
