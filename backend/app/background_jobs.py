from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Investment
from .market_data import fetch_latest_price


def update_market_prices():
    print("🔄 Updating market prices...")

    db: Session = SessionLocal()
    try:
        investments = db.query(Investment).all()

        for inv in investments:
            price = fetch_latest_price(inv.asset_name)
            if price:
                inv.latest_price = price

        db.commit()
        print("✅ Market prices updated")

    except Exception as e:
        print("❌ Price update failed:", e)
        db.rollback()

    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_market_prices, "interval", minutes=15)
    scheduler.start()
