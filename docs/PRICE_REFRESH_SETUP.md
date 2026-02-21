# Automatic Price Refresh Setup Guide

## Overview
The WealthTracker application automatically refreshes portfolio prices daily at **7:00 PM IST (19:00 in 24-hour format)** using Celery beat scheduler with Redis as the message broker.

## Architecture

```
┌─────────────────┐
│  Celery Beat    │  (Scheduler - runs in separate process)
│  Scheduler      │
├─────────────────┤
│  Redis Broker   │  (Message queue)
├─────────────────┤
│  Celery Worker  │  (Executes tasks)
└──────┬──────────┘
       │
       ▼
┌──────────────────────┐
│  Price Update Task   │
│  - Fetch prices      │
│  - Update DB         │
│  - Store timestamps  │
└──────────────────────┘
```

## Prerequisites

### 1. Redis Installation

**Windows (Using WSL or Direct Installation):**
```bash
# Option 1: Using WSL (Windows Subsystem for Linux)
wsl
sudo apt-get install redis-server

# Option 2: Download Windows build
# https://github.com/microsoftarchive/redis/releases
# Extract and run redis-server.exe
```

**macOS:**
```bash
brew install redis
```

**Linux:**
```bash
sudo apt-get install redis-server
```

### 2. Python Dependencies
All required packages are in `requirements.txt`:
```
celery
redis
python-dotenv
yfinance
```

## Setup Instructions

### Step 1: Start Redis Server

**Windows (with WSL):**
```bash
wsl
redis-server
```

**Windows (Direct installation):**
```bash
redis-server.exe
```

**macOS/Linux:**
```bash
redis-server
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Step 2: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables

Create or update `.env` file in the backend directory:

```env
# Celery Configuration
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Database
DATABASE_URL=postgresql://user:password@localhost/wealthtracker

# JWT
SECRET_KEY=your-secret-key-here

# Other configs
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Step 4: Run the Application

**Terminal 1 - FastAPI Backend:**
```bash
cd backend
python main.py
# Or using uvicorn directly:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Celery Worker:**
```bash
cd backend
celery -A app.services.worker:celery_app worker --loglevel=info
```

**Terminal 3 - Celery Beat Scheduler:**
```bash
cd backend
celery -A app.services.worker:celery_app beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
# Or simpler (in-memory scheduler):
celery -A app.services.worker:celery_app beat --loglevel=info
```

**Terminal 4 - Frontend (Optional):**
```bash
cd frontend
npm run dev
```

## How It Works

-### Automatic Daily Refresh
- **Time**: 7:00 PM IST (19:00 in 24-hour format)
- **Frequency**: Every day
- **Timezone**: Asia/Kolkata (IST = UTC+5:30)
- **Task**: Updates current market prices for all investments in the database

### Configuration Location
`backend/app/services/worker.py` - Lines 96-102:

```python
celery_app.conf.beat_schedule = {
  'daily-price-update-7pm-ist': {
    'task': 'update_all_investment_prices',
    'schedule': crontab(hour=19, minute=0),
    'options': {'queue': 'default'}
  },
}
```

### What Gets Updated
- **last_price**: Current market price
- **last_price_at**: Timestamp of the update  
- **current_value**: Units × Current Price
- **daily_change**: Daily percentage change

## Manual Price Refresh

Users can also manually trigger price updates anytime:

**Via API Endpoint:**
```bash
curl -X POST http://127.0.0.1:8000/api/v1/portfolio/update-prices \
  -H "Authorization: Bearer <access_token>"
```

**Via Frontend:**
Click the "Refresh Prices" button in the Portfolio page

## Monitoring

### Check Celery Worker Status
```bash
celery -A app.services.worker:celery_app inspect active
celery -A app.services.worker:celery_app inspect registered
```

### View Active Tasks
```bash
celery -A app.services.worker:celery_app inspect active
```

### Check Beat Schedule
The Celery Beat process logs will show:
```
Scheduler: Sending due task daily-price-update-7pm-ist (update_all_investment_prices)
```

### Verify Last Refresh in Frontend
- Navigate to Portfolio page
- Look for "Last Price Refresh" timestamp
- "Next Scheduled Refresh" shows 7:00 PM IST (Daily)

## Troubleshooting

### Issue: "Failed to connect to Redis"
**Solution:**
- Ensure Redis server is running: `redis-cli ping`
- Check REDIS_URL in `.env` file
- Verify Redis is accessible on the configured host:port

### Issue: "Celery worker not processing tasks"
**Solution:**
- Check if Celery worker is running in another terminal
- Verify worker logs for errors
- Ensure Redis connection is active

### Issue: "Schedule not executing at 4 PM"
**Solution:**
- Verify Celery Beat scheduler is running
- Check system timezone is correct
- Celery Beat logs should show task scheduling

### Issue: "No symbols to update"
**Solution:**
- Ensure you have added investments/transactions to the portfolio
- Check that transactions have valid symbols

## Advanced Configuration

### Modify Refresh Time
Edit `backend/app/services/worker.py`:

```python
# For 7 PM IST daily:
'schedule': crontab(hour=19, minute=0),

# For 4 AM and 7 PM IST:
'schedule': crontab(hour="4,19", minute=0),

# For every 6 hours:
'schedule': crontab(minute=0, hour="*/6"),
```

### Scale to Multiple Workers
```bash
# Worker 1
celery -A app.services.worker:celery_app worker --loglevel=info --concurrency=4

# Worker 2
celery -A app.services.worker:celery_app worker --loglevel=info --concurrency=4
```

### Use Persistent Scheduler
Install django-celery-beat for database-backed scheduling:
```bash
pip install django-celery-beat
```

## API Endpoints

### Get Last Refresh Information
```
GET /api/v1/portfolio/last-refresh
Headers: Authorization: Bearer <access_token>

Response:
{
  "last_refresh_at": "2026-02-16T19:00:45.123456",
  "next_scheduled_refresh": "19:00 IST (Every Day)"
}
```

### Trigger Manual Refresh
```
POST /api/v1/portfolio/update-prices
Headers: Authorization: Bearer <access_token>

Response:
{
  "message": "Price update completed",
  "detail": "Successfully updated X investments"
}
```

### Get Portfolio Investments
```
GET /api/v1/portfolio/investments
Headers: Authorization: Bearer <access_token>

Returns: List of investments with last_price and last_price_at
```

## Frontend Integration

The Portfolio page displays:
- **Last Price Refresh**: Shows the most recent timestamp when prices were updated
- **Next Scheduled Refresh**: Shows "4:00 PM IST (Every Day)"
- **Refresh Button**: Allows manual immediate refresh
- **Individual Stock Updates**: Each holding shows when its price was last updated

## Database Schema

```sql
-- Investment table has these relevant columns:
- last_price (Numeric): Current market price
- last_price_at (DateTime): When the price was last updated
- current_value (Numeric): Calculated as units × last_price
- daily_change (Numeric): Daily percentage change
```

## Performance Considerations

- **Batch Price Fetching**: yfinance downloads data for all symbols efficiently
- **Database Update**: Single transaction for all prices
- **Timezone**: Asia/Kolkata (IST) ensures consistent scheduling across regions
- **Error Handling**: Failed price updates are logged without stopping other updates

## Support

For issues or questions:
1. Check logs in the Celery Beat and Worker terminals
2. Verify Redis connection: `redis-cli PING`
3. Test manual refresh via API or frontend button
4. Check database for investment symbols and data

