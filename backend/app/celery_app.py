"""
Celery configuration for background jobs.
"""
from celery import Celery
from celery.schedules import crontab
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "wealth_management",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks"],
)

celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=False,
    task_track_started=True,
)

celery_app.conf.beat_schedule = {
    "nightly-update-investment-prices": {
        "task": "app.tasks.update_all_prices",
        "schedule": crontab(hour=21, minute=0),
    },
}
