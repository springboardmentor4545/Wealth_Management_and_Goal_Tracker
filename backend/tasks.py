import yfinance as yf
import redis
from celery_app import celery_app

r = redis.Redis(host="localhost", port=6379, decode_responses=True)

@celery_app.task
def sync_market_price(symbol):
    price = float(yf.Ticker(symbol).history(period="1d")["Close"].iloc[-1])
    r.hset("LATEST_PRICES", symbol, price)
    return price
