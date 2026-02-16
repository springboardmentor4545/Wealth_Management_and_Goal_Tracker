from celery import Celery
import os
from dotenv import load_dotenv
from celerybeat_schedule import beat_schedule

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

celery_app = Celery(
    "wealth_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# celery_app.conf.timezone = "UTC"
celery_app.conf.timezone = "Asia/Kolkata"
celery_app.conf.enable_utc = False
celery_app.conf.beat_schedule = beat_schedule
