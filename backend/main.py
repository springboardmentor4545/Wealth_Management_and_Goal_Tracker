from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.auth import router as auth_router
from routes.risk_routes import router as risk_router
from database import get_db_connection

load_dotenv()

print("🚀 MAIN FILE LOADED")

app = FastAPI()

app.include_router(auth_router)
app.include_router(risk_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to Wealth Management API"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/users")
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()
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
    cur.close()
    conn.close()
    return {"users": users}
