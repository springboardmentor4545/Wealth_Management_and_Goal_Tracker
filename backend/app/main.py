from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

app = FastAPI(
    title="Wealth Management API",
    description="Personalized Wealth Management & Goal Tracker",
    version="1.0.0"
)

# Add CORS middleware (allows React frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, change to specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Wealth Management API",
        "status": "active",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "wealth-management-api"}

@app.get("/api/info")
def api_info():
    return {
        "project": "Personalized Wealth Management & Goal Tracker",
        "week": 1,
        "tasks_completed": [
            "PostgreSQL Database Created",
            "Project Structure Setup",
            "FastAPI Installed",
            "Ready for Week 2"
        ]
    }

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Test database connection
        result = db.execute(text("SELECT version()"))
        db_version = result.fetchone()
        return {
            "status": "success",
            "message": "Database connected successfully",
            "database_version": db_version[0]
        }
    except Exception as e:
        return {
            "status": "error",
            "message": "Database connection failed",
            "error": str(e)
        }