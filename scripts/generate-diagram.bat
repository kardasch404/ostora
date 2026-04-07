@echo off
echo ========================================
echo Ostora Database Diagram Generator
echo ========================================
echo.

cd /d "%~dp0.."

echo Checking for PlantUML...
where plantuml >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PlantUML not found!
    echo.
    echo Please install PlantUML:
    echo   - Download: https://plantuml.com/download
    echo   - Or use Chocolatey: choco install plantuml
    echo   - Or use Scoop: scoop install plantuml
    echo.
    echo Alternative: Use online generator
    echo   https://www.plantuml.com/plantuml/uml/
    echo.
    pause
    exit /b 1
)

echo [OK] PlantUML found!
echo.
echo Generating diagram...
plantuml -tpng docs\database-schema.puml

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Diagram generated!
    echo ========================================
    echo.
    echo Location: docs\database-schema.png
    echo.
    echo Opening diagram...
    start docs\database-schema.png
) else (
    echo.
    echo [ERROR] Failed to generate diagram
    echo.
)

pause
