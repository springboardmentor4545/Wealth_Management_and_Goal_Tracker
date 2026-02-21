import os
from celery import Celery
from celery.schedules import crontab
from datetime import datetime
from sqlalchemy.orm import Session
from .market_data import fetch_prices_batch
import logging
import yfinance as yf

# Handle yfinance cache issues on Windows
try:
    import tempfile
    cache_dir = os.path.join(tempfile.gettempdir(), "yfinance_cache")
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir, exist_ok=True)
    # yfinance cache location can sometimes cause WinError 183
except Exception:
    pass

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery
celery_app = Celery(
    "wealth_tracker_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL
)

# Celery configuration (Windows-compatible)
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',
    enable_utc=True,           # Keep UTC internally, schedule in IST via crontab
    worker_pool_restarts=True, # Needed for Windows stability
    broker_connection_retry_on_startup=True,
)

logger = logging.getLogger(__name__)

# Note: We'll import models inside the task to avoid circular imports
# since main.py usually contains the engine and models in a single-file setup like this one

@celery_app.task(name="update_all_investment_prices")
def update_all_investment_prices():
    """
    Background task to update market prices for all unique symbols in the database.
    """
    import sys
    import os
    # Add the backend directory to sys.path to allow importing from main
    backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    if backend_path not in sys.path:
        sys.path.append(backend_path)
        
    from main import SessionLocal, Investment
    
    db = SessionLocal()
    try:
        # 1. Get all unique symbols
        investments = db.query(Investment).all()
        symbols = list(set([inv.symbol for inv in investments if inv.symbol]))
        
        if not symbols:
            logger.info("No symbols to update.")
            return "No symbols found"

        # 2. Fetch prices in batches
        logger.info(f"Fetching prices for {len(symbols)} symbols...")
        price_data = fetch_prices_batch(symbols)
        
        # 3. Update the database
        updates_count = 0
        for inv in investments:
            if inv.symbol in price_data:
                price, timestamp, change = price_data[inv.symbol]
                if price is not None:
                    inv.last_price = price
                    inv.last_price_at = timestamp
                    inv.current_value = float(inv.units) * price
                    inv.daily_change = change
                    updates_count += 1
        
        db.commit()
        logger.info(f"Updated {updates_count} investments.")
        return f"Successfully updated {updates_count} investments"
        
    except Exception as e:
        logger.error(f"Error in background task: {e}")
        db.rollback()
        return f"Error: {str(e)}"
    finally:
        db.close()

# Schedule price updates daily at 7 PM IST (19:00 IST = 13:30 UTC)
# Since enable_utc=True, we use UTC time: 19:00 IST = 13:30 UTC
celery_app.conf.beat_schedule = {
    'daily-price-update-7pm-ist': {
        'task': 'update_all_investment_prices',
        'schedule': crontab(hour=13, minute=30),  # 13:30 UTC = 19:00 IST
    },
}
