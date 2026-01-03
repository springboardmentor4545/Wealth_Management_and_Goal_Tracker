from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from auth import router as auth_router
from database import get_db_connection

load_dotenv()

app = FastAPI()
app.include_router(auth_router)

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

@app.get("/users")
def get_users():
    # created to see the user table and test auth route
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, email, risk_profile, kyc_status, created_at FROM users")
    users = cur.fetchall()  
    cur.close()
    conn.close()
    return {"users": users}
