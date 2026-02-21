@echo off
echo Starting Celery Beat Scheduler (7 PM IST daily price refresh)...
cd /d "%~dp0"
call venv\Scripts\activate.bat
celery -A app.services.worker:celery_app beat --loglevel=info
pause
