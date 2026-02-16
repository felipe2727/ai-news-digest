@echo off
REM Creates a Windows Task Scheduler task to run AI News Digest every 2 days at 8:00 AM
REM Run this script as Administrator

schtasks /create /tn "AI News Digest" /tr "python C:\Users\Felipe\ai-news-digest\main.py --force" /sc daily /mo 2 /st 08:00 /f

if %errorlevel% equ 0 (
    echo.
    echo Task created successfully!
    echo   Name: AI News Digest
    echo   Schedule: Every 2 days at 8:00 AM
    echo   Command: python C:\Users\Felipe\ai-news-digest\main.py --force
    echo.
    echo To verify: schtasks /query /tn "AI News Digest"
    echo To delete: schtasks /delete /tn "AI News Digest" /f
) else (
    echo.
    echo Failed to create task. Make sure you run this as Administrator.
)
pause
