import yfinance as yf
from decimal import Decimal


def fetch_latest_price(symbol: str) -> Decimal | None:
    try:
        ticker = yf.Ticker(symbol)

        
        data = ticker.history(period="1d")

        if data.empty:
            print("No market data found")
            return None

        latest_price = data["Close"].iloc[-1]

        print("Live price fetched:", latest_price)

        return Decimal(str(latest_price))

    except Exception as e:
        print("Yahoo error:", e)
        return None
