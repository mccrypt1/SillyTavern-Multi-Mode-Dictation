@echo off
REM ============================================================
REM  Multi-Mode Dictation - Installer for SillyTavern
REM  Target path hard-coded: C:\AI\SillyTavern
REM ============================================================

set "ST_PATH=C:\AI\SillyTavern"
set "TARGET=%ST_PATH%\public\scripts\extensions\third-party\multi-dictation"
set "SOURCE=%~dp0"

echo.
echo  Multi-Mode Dictation - Installation
echo  ====================================
echo.
echo  Source: %SOURCE%
echo  Target: %TARGET%
echo.

REM Check whether the SillyTavern folder exists
if not exist "%ST_PATH%\public\scripts\extensions" (
    echo  [ERROR] SillyTavern was not found at C:\AI\SillyTavern.
    echo          Please adjust the path at the top of this file.
    echo.
    pause
    exit /b 1
)

REM Create the third-party folder if missing
if not exist "%ST_PATH%\public\scripts\extensions\third-party" (
    echo  Creating third-party folder...
    mkdir "%ST_PATH%\public\scripts\extensions\third-party"
)

REM Create the target folder
if not exist "%TARGET%" (
    mkdir "%TARGET%"
)

echo  Copying files...
copy /Y "%SOURCE%manifest.json" "%TARGET%\" >nul
copy /Y "%SOURCE%index.js"      "%TARGET%\" >nul
copy /Y "%SOURCE%style.css"     "%TARGET%\" >nul
copy /Y "%SOURCE%README.md"     "%TARGET%\" >nul

echo.
echo  [OK] Installation complete.
echo.
echo  Next steps:
echo    1. Reload SillyTavern in the browser (F5)
echo    2. Open the Extensions menu -^> "Multi-Mode Dictation"
echo    3. Clear any built-in Speech Recognition hotkey that
echo       collides (e.g. Numpad0) to avoid conflicts
echo    4. Test: press Numpad0, speak, press Numpad0 again
echo.
pause
