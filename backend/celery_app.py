from celery import Celery

celery_app = Celery(
    "market_tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["tasks"]   # 👈 THIS IS THE FIX
)
