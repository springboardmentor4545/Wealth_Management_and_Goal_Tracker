from celery.schedules import crontab

beat_schedule = {
    "nightly-alpha-vantage-update": {
        "task": "app.tasks.update_prices.update_all_investment_prices",
        "schedule": crontab(hour=0, minute=0),
    }
}
