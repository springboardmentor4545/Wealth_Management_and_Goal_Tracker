@echo off
echo Starting Celery Worker...
cd /d "%~dp0"
call venv\Scripts\activate.bat
celery -A app.services.worker:celery_app worker --loglevel=info --pool=solo
pause
