from celery_app import celery_app
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal

from app.database import SessionLocal
from app.models import Investment
from app.services.market_data import fetch_latest_price


@celery_app.task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 3, "countdown": 30},
)
def update_all_investment_prices(self):
    db: Session = SessionLocal()

    try:
        investments = db.query(Investment).all()

        for inv in investments:
            price = fetch_latest_price(inv.symbol)
            if price is None:
                continue

            inv.last_price = price
            inv.last_price_updated_at = datetime.utcnow()
            inv.current_value = Decimal(inv.units) * price

        db.commit()

    finally:
        db.close()
