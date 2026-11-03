@echo off
title Gradelytics Backend Server
echo ===================================================
echo Starting Gradelytics Flask Backend on port 5000...
echo ===================================================
cd /d "%~dp0backend"
python app.py
pause
