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


# ✅ DEPENDENCY FUNCTION (NOT A ROUTE)
def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency to get current authenticated user"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication failed. Please log in.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """SELECT id, name, email, risk_profile, kyc_status, 
           COALESCE(profile_completed, FALSE) as profile_completed, 
           created_at 
           FROM users WHERE email = %s""",
        (email,)
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please log in again."
        )

    return user


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate):
    """
    Sign up a new user with default values.
    User must complete risk assessment before accessing features.
    """
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
                detail="Email already registered. Please login instead."
            )

        # Hash the password
        hashed_password = hash_password(user.password)

        # ✅ Create user with DEFAULT values - they MUST complete assessment
        cur.execute(
            """
            INSERT INTO users (
                name, 
                email, 
                password, 
                risk_profile, 
                kyc_status,
                profile_completed
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, name, email, risk_profile, kyc_status, 
                      COALESCE(profile_completed, FALSE) as profile_completed, 
                      created_at
            """,
            (user.name, user.email, hashed_password, "moderate", "unverified", False)
        )
        new_user = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return {
            "message": "Account created successfully! Please complete your risk assessment.",
            "user": dict(new_user),
            "requires_assessment": True
        }

    except errors.UniqueViolation:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login instead."
        )
    except ValueError as ve:
        conn.rollback()
        cur.close()
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        conn.rollback()
        cur.close()
        conn.close()
        print(f"❌ SIGNUP ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during signup: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token with user info"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """SELECT id, name, email, password, risk_profile, kyc_status, 
               COALESCE(profile_completed, FALSE) as profile_completed,
               created_at
               FROM users WHERE email = %s""",
            (form_data.username,)
        )
        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not found. Please check or sign up."
            )

        if not verify_password(form_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password. Please try again."
            )

        # Create access token
        access_token = create_access_token(
            data={"sub": user["email"]},
            expires_delta=timedelta(minutes=45)
        )

        # Return token with user data
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "risk_profile": user["risk_profile"],
                "kyc_status": user["kyc_status"],
                "profile_completed": user["profile_completed"],
                "created_at": user["created_at"].isoformat()
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ LOGIN ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me", response_model=UserResponse)
def get_me(user=Depends(get_current_user)):
    """Get current user info"""
    return user