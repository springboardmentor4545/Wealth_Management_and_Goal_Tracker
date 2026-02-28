import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

# Get Redis URL from environment or use default
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Configuration for Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Automated Daily Task (Nightly at midnight)
celery_app.conf.beat_schedule = {
    "update-prices-every-night": {
        "task": "app.celery_app.scheduled_update_prices",
        "schedule": crontab(minute=0, hour=0),
    },
}

@celery_app.task
def scheduled_update_prices():
    """
    Background job to update all investment prices.
    """
    from .database import SessionLocal
    from .market_data import update_investment_prices
    
    db = SessionLocal()
    try:
        update_investment_prices(db)
        print("Nightly price update completed successfully.")
    except Exception as e:
        print(f"Error in nightly price update: {e}")
    finally:
        db.close()

@celery_app.task
def update_user_prices_async(user_id: int):
    """
    Background job to update prices for a specific user.
    Useful when they log in to show live data without blocking the request.
    """
    from .database import SessionLocal
    from .market_data import update_investment_prices
    
    db = SessionLocal()
    try:
        update_investment_prices(db, user_id=user_id)
    finally:
        db.close()
