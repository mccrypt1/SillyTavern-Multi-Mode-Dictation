@echo off
REM ============================================================
REM  STT Server - start script (Windows)
REM  First run: creates a local virtual environment and installs
REM  the dependencies. Every run: starts the server.
REM ============================================================
cd /d "%~dp0"

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo.
        echo [ERROR] Could not create the virtual environment.
        echo         Is Python installed and on PATH?  Check with: python --version
        echo.
        pause
        exit /b 1
    )
    echo Installing dependencies ^(this can take a few minutes the first time^)...
    ".venv\Scripts\python.exe" -m pip install --upgrade pip
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo [ERROR] Installing dependencies failed.
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Starting STT server...  (first start downloads the Whisper model)
echo Leave this window open while you use dictation. Press Ctrl+C to stop.
echo.
".venv\Scripts\python.exe" stt_server.py
pause
