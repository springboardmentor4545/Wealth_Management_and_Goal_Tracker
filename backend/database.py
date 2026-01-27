import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

# Load environment variables FIRST
load_dotenv()


def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        #sslmode="disable",
        cursor_factory=RealDictCursor
    )


def create_tables():
    """
    Create database tables for the Wealth Management API.
    This is for local/dev usage.
    Production DB already exists.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # Users table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        risk_profile VARCHAR(20)
            CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive'))
            DEFAULT 'moderate',
        kyc_status VARCHAR(20)
            CHECK (kyc_status IN ('unverified', 'verified'))
            DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 🔹 ADD REQUIRED NEW COLUMNS (SAFE)
    cur.execute("""
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
    """)

    # Goals table - UPDATED WITH ALL GOAL TYPES
    cur.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        goal_type VARCHAR(20)
            CHECK (goal_type IN ('retirement', 'education', 'travel', 'emergency', 'home', 'vehicle'))
            NOT NULL,
        target_amount NUMERIC NOT NULL,
        target_date DATE NOT NULL,
        monthly_contribution NUMERIC NOT NULL,
        status VARCHAR(20)
            CHECK (status IN ('active', 'paused', 'completed'))
            DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Investments table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        asset_type VARCHAR(20)
            CHECK (asset_type IN ('stock', 'etf', 'mutual_fund', 'bond', 'cash')) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        units NUMERIC NOT NULL,
        avg_buy_price NUMERIC NOT NULL,
        cost_basis NUMERIC NOT NULL,
        current_value NUMERIC,
        last_price NUMERIC,
        last_price_at TIMESTAMP
    );
    """)

    # Transactions table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20) NOT NULL,
        type VARCHAR(20)
            CHECK (type IN ('buy', 'sell', 'dividend', 'contribution', 'withdrawal')) NOT NULL,
        quantity NUMERIC NOT NULL,
        price NUMERIC NOT NULL,
        fees NUMERIC DEFAULT 0,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Recommendations table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        recommendation_text TEXT NOT NULL,
        suggested_allocation JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Simulations table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        goal_id INT REFERENCES goals(id) ON DELETE SET NULL,
        scenario_name VARCHAR(100) NOT NULL,
        assumptions JSONB NOT NULL,
        results JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Risk Questions table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS risk_questions (
        id SERIAL PRIMARY KEY,
        question VARCHAR(255) NOT NULL,
        option1 VARCHAR(100) NOT NULL,
        option2 VARCHAR(100) NOT NULL,
        option3 VARCHAR(100) NOT NULL,
        option1_score INTEGER NOT NULL,
        option2_score INTEGER NOT NULL,
        option3_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    cur.close()
    conn.close()
    
    print("✅ Database tables created successfully!")