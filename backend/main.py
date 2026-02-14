# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import redis   # ✅ ADD THIS

from routes.auth import router as auth_router
from routes.risk_routes import router as risk_router
from routes.goal import router as goal_router
from routes.portfolio import router as portfolio_router
from database import get_db_connection
from routes.simulations import router as simulation_router
from routes.recommendations import router as recommendations_router


load_dotenv()

print("🚀 MAIN FILE LOADED")

# -----------------------------
# Create FastAPI app
# -----------------------------
app = FastAPI(title="WealthIQ API")

# -----------------------------
# Redis connection (shared storage)
# -----------------------------
r = redis.Redis(host="localhost", port=6379, decode_responses=True)

# -----------------------------
# Include Routers
# -----------------------------
app.include_router(auth_router)
app.include_router(risk_router)
app.include_router(goal_router)
app.include_router(portfolio_router)
app.include_router(simulation_router)
app.include_router(recommendations_router)

# -----------------------------
# CORS Middleware
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Root & Health Endpoints
# -----------------------------
@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to Wealth Management API"}

@app.get("/health", tags=["Root"])
def health():
    return {"status": "ok"}

# -----------------------------
# ✅ MARKET DATA API (FROM REDIS)
# -----------------------------
@app.get("/market/latest", tags=["Market"])
def get_latest_market_prices():
    """
    Returns latest market prices stored in Redis
    (updated nightly via Celery background job)
    """
    return r.hgetall("LATEST_PRICES")

# -----------------------------
# Get all users (admin/testing)
# -----------------------------
@app.get("/users", tags=["Admin"])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                id,
                name,
                email,
                risk_profile,
                kyc_status,
                risk_score,
                profile_completed,
                created_at
            FROM users
        """)
        users = cur.fetchall()
        return {"users": users}
    finally:
        cur.close()
        conn.close()
