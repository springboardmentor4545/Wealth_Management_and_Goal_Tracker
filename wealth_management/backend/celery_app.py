from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

celery_app = Celery(
    "wealth_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.update_prices"]  
)

celery_app.conf.timezone = "Asia/Kolkata"
celery_app.conf.enable_utc = False

from celerybeat_schedule import beat_schedule
celery_app.conf.beat_schedule = beat_schedule
