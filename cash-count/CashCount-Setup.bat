@echo off
setlocal EnableDelayedExpansion
title CashCount System - Spring Boot Server

echo ================================================================
echo    CashCount - Personal Finance & Budget Management Prototype
echo ================================================================
echo.

:: Detect if we need to navigate to the project directory
if exist "%~dp0CashCount\cash-count\gradlew.bat" (
    cd /d "%~dp0CashCount\cash-count"
) else if exist "%~dp0gradlew.bat" (
    cd /d "%~dp0"
)

:: Check or Auto-Detect JAVA_HOME
if defined JAVA_HOME (
    :: Strip trailing slash if present to prevent quote escaping errors
    if "%JAVA_HOME:~-1%"=="\" set "JAVA_HOME=%JAVA_HOME:~0,-1%"
)

if not defined JAVA_HOME (
    echo [INFO] Locating installed Java JDK...
    for /d %%i in ("C:\Program Files\Eclipse Adoptium\jdk-21*") do (
        if exist "%%i\bin\java.exe" set "JAVA_HOME=%%i"
    )
    if not defined JAVA_HOME (
        for /d %%i in ("C:\Program Files\Java\jdk*") do (
            if exist "%%i\bin\java.exe" set "JAVA_HOME=%%i"
        )
    )
    if not defined JAVA_HOME (
        for /d %%i in ("C:\Program Files\Microsoft\jdk*") do (
            if exist "%%i\bin\java.exe" set "JAVA_HOME=%%i"
        )
    )
)

if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [OK] Using Java JDK: %JAVA_HOME%
) else (
    echo [INFO] Using default system Java from PATH...
)

echo.
echo [INFO] Starting CashCount Spring Boot backend...
echo [INFO] The dashboard will automatically open in your browser in ~7 seconds!
echo.
echo Press Ctrl+C in this window to stop the server.
echo ================================================================
echo.

:: Launch browser in background after short startup delay
start "" cmd /c "timeout /t 7 /nobreak >nul & start http://localhost:8080/login"

:: Execute Spring Boot Application
call .\gradlew.bat bootRun

if errorlevel 1 (
    echo.
    echo [ERROR] Application stopped or encountered an error.
    pause
)
