@echo off
set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"
echo Current Directory: %CD%

echo Starting Wealth Management System...

:: Start Redis (if not already running)
echo Checking Redis on port 6379...
netstat -ano | findstr :6379 > nul
if %errorlevel% neq 0 (
    echo Starting Redis...
    start "Redis Server" /b "C:\Program Files\Redis\redis-server.exe" "C:\Program Files\Redis\redis.windows.conf"
) else (
    echo Redis is already running.
)

:: Start Backend API
echo Launching Backend...
start "Backend API" cmd /k "cd /d %PROJECT_ROOT%backend && venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload"

:: Start Celery Worker
echo Launching Celery Worker...
start "Celery Worker" cmd /k "cd /d %PROJECT_ROOT%backend && venv\Scripts\activate.bat && celery -A app.celery_app worker --loglevel=info -P solo"

:: Start Celery Beat
echo Launching Celery Beat...
start "Celery Beat" cmd /k "cd /d %PROJECT_ROOT%backend && venv\Scripts\activate.bat && celery -A app.celery_app beat --loglevel=info"

:: Start Frontend
echo Launching Frontend...
start "Frontend Dev" cmd /k "cd /d %PROJECT_ROOT%frontend && npm run dev"

echo.
echo ==========================================
echo All services triggered. Check individual windows.
echo ==========================================
pause
