from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

load_dotenv()

# Redis configuration
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Create Celery app
celery_app = Celery(
    'wealth_management',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks.market_tasks']  # Import task modules
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',
    enable_utc=True,
    
    # Task settings
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max
    task_soft_time_limit=20 * 60,  # 20 minutes soft limit
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Scheduled tasks (Beat schedule)
celery_app.conf.beat_schedule = {
    # Update market prices every 15 minutes during market hours
    'update-prices-15min': {
        'task': 'tasks.market_tasks.update_all_prices',
        'schedule': crontab(minute='*/15'),  # Every 15 minutes
    },
    
    # Update market prices nightly
    'update-prices-nightly': {
        'task': 'tasks.market_tasks.update_all_prices',
        'schedule': crontab(hour=22, minute=0),  # 10 PM IST
    },
    
    # Clean up old price cache daily
    'cleanup-cache-daily': {
        'task': 'tasks.market_tasks.cleanup_old_data',
        'schedule': crontab(hour=1, minute=0),  # 1 AM IST
    },
}

if __name__ == '__main__':
    celery_app.start()