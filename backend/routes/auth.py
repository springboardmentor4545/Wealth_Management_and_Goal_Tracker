from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta
from database import get_db_connection
from security import verify_password, create_access_token, hash_password
from schema import UserCreate, UserResponse, TokenResponse
from psycopg2 import errors
from jose import JWTError, jwt
import os

router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("ALGORITHM", "HS256")


# =========================
# SIGNUP
# =========================
@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if user exists
        cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
        if cur.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        hashed_password = hash_password(user.password)

        # ✅ LOCAL DB SAFE DEFAULTS
        risk_profile = user.risk_profile or "moderate"
        kyc_status = user.kyc_status or "unverified"

        cur.execute(
            """
            INSERT INTO users (name, email, password, risk_profile, kyc_status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, email, risk_profile, kyc_status, created_at
            """,
            (user.name, user.email, hashed_password, risk_profile, kyc_status)
        )

        new_user = cur.fetchone()
        conn.commit()

        return new_user

    except errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

    finally:
        cur.close()
        conn.close()


# =========================
# LOGIN
# =========================
@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, email, password FROM users WHERE email = %s",
        (form_data.username,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=timedelta(minutes=45)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# =========================
# CURRENT USER
# =========================
@router.get("/me")
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, name, email, risk_profile, kyc_status,
               profile_completed, created_at
        FROM users
        WHERE email = %s
        """,
        (email,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
