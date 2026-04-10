@echo off
echo ========================================
echo   Importing Database Schema to MySQL
echo ========================================
echo.

REM Path to MySQL in Laragon (adjust if needed)
set MYSQL_PATH=C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe

REM Check if MySQL exists
if not exist "%MYSQL_PATH%" (
    echo ERROR: MySQL not found at %MYSQL_PATH%
    echo.
    echo Please update MYSQL_PATH in this script to match your Laragon MySQL path
    echo Common paths:
    echo   - C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe
    echo   - C:\laragon\bin\mysql\mysql-5.7.24-winx64\bin\mysql.exe
    echo.
    pause
    exit /b 1
)

echo MySQL found: %MYSQL_PATH%
echo.
echo Importing schema...
echo.

"%MYSQL_PATH%" -u root < "..\database\schema-mysql.sql"

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Database imported
    echo ========================================
    echo.
    echo Next step: Run 'npm run test:db'
    echo.
) else (
    echo.
    echo ========================================
    echo   ERROR! Import failed
    echo ========================================
    echo.
    echo Please check:
    echo   1. MySQL is running in Laragon
    echo   2. MySQL path is correct in this script
    echo   3. schema-mysql.sql file exists
    echo.
)

pause
