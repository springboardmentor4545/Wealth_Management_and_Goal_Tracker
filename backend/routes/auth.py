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

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Check if user already exists
        cur.execute(
            "SELECT id FROM users WHERE email = %s",
            (user.email,)
        )
        existing_user = cur.fetchone()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )

        # Hash the password
        hashed_password = hash_password(user.password)

        # Insert new user
        cur.execute(
            """
            INSERT INTO users (name, email, password, risk_profile, kyc_status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, name, email, risk_profile, kyc_status, created_at
            """,
            (user.name, user.email, hashed_password, user.risk_profile.value, user.kyc_status.value)
        )
        new_user = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return new_user

    except errors.UniqueViolation:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
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

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(form_data.password, user["password"]):
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

@router.get("/me")
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT id, name, email, risk_profile, kyc_status, profile_completed, created_at FROM users WHERE email = %s",
        (email,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user
