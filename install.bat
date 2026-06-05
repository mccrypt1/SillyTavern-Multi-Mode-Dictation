@echo off
REM ============================================================
REM  Multi-Mode Dictation - Installer fuer SillyTavern
REM  Zielpfad fest eingetragen: C:\AI\SillyTavern
REM ============================================================

set "ST_PATH=C:\AI\SillyTavern"
set "TARGET=%ST_PATH%\public\scripts\extensions\third-party\multi-dictation"
set "SOURCE=%~dp0"

echo.
echo  Multi-Mode Dictation - Installation
echo  ====================================
echo.
echo  Quelle: %SOURCE%
echo  Ziel  : %TARGET%
echo.

REM Pruefen, ob der SillyTavern-Ordner existiert
if not exist "%ST_PATH%\public\scripts\extensions" (
    echo  [FEHLER] SillyTavern wurde unter C:\AI\SillyTavern nicht gefunden.
    echo           Bitte den Pfad oben in dieser Datei anpassen.
    echo.
    pause
    exit /b 1
)

REM third-party-Ordner anlegen, falls nicht vorhanden
if not exist "%ST_PATH%\public\scripts\extensions\third-party" (
    echo  Erstelle third-party-Ordner...
    mkdir "%ST_PATH%\public\scripts\extensions\third-party"
)

REM Zielordner anlegen
if not exist "%TARGET%" (
    mkdir "%TARGET%"
)

echo  Kopiere Dateien...
copy /Y "%SOURCE%manifest.json" "%TARGET%\" >nul
copy /Y "%SOURCE%index.js"      "%TARGET%\" >nul
copy /Y "%SOURCE%style.css"     "%TARGET%\" >nul
copy /Y "%SOURCE%README.md"     "%TARGET%\" >nul

echo.
echo  [OK] Installation abgeschlossen.
echo.
echo  Naechste Schritte:
echo    1. SillyTavern im Browser neu laden (F5)
echo    2. Extensions-Menue oeffnen -^> "Multi-Mode Dictation"
echo    3. Alte Numpad0-Belegung in der eingebauten
echo       Speech-Recognition leeren (Konflikt vermeiden)
echo    4. Test: Numpad0 druecken, sprechen, Numpad0 erneut druecken
echo.
pause
