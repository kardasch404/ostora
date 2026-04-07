@echo off
echo ========================================
echo Ostora Database Diagram Generator
echo ========================================
echo.

cd /d "%~dp0.."

echo [*] Generating class diagram with proper DEFLATE encoding...
echo.

python scripts\generate-diagram-proper.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Diagram generated!
    echo ========================================
    echo.
    echo Location: docs\database-schema-v2.png
    echo.
) else (
    echo.
    echo [ERROR] Failed to generate diagram
    echo.
    echo Make sure you have Python and requests installed:
    echo   pip install requests
    echo.
)

pause
