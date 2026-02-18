# backend/app/tasks.py
from celery import Celery
from decimal import Decimal
from datetime import datetime

from .database import SessionLocal
from .models import Investment
from .market_data import get_current_price

celery = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

@celery.task
def update_user_prices(user_id: int):
    db = SessionLocal()
    try:
        investments = db.query(Investment).filter(
            Investment.user_id == user_id,
            Investment.symbol.isnot(None)
        ).all()

        for inv in investments:
            price = get_current_price(inv.symbol)
            if price:
                inv.last_price = price
                inv.current_value = price * inv.total_quantity
                inv.last_price_updated_at = datetime.utcnow()

        db.commit()
    finally:
        db.close()
