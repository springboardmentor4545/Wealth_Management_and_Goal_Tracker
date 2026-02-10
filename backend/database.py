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
        cursor_factory=RealDictCursor
    )


def create_tables():
    """
    Create database tables for the Wealth Management API.
    This is for local/dev usage.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # USERS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        risk_profile VARCHAR(20)
            CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
        kyc_status VARCHAR(20)
            CHECK (kyc_status IN ('unverified', 'verified'))
            DEFAULT 'unverified',
        risk_score INTEGER DEFAULT 0,
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # GOALS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        goal_type VARCHAR(20)
            CHECK (goal_type IN ('retirement', 'home', 'education', 'custom')) NOT NULL,
        target_amount NUMERIC NOT NULL,
        target_date DATE NOT NULL,
        monthly_contribution NUMERIC,
        status VARCHAR(20)
            CHECK (status IN ('active', 'paused', 'completed'))
            DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # INVESTMENTS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        asset_type VARCHAR(20)
            CHECK (asset_type IN ('stock', 'etf', 'mutual_fund', 'bond', 'cash')) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        units NUMERIC,
        avg_buy_price NUMERIC,
        cost_basis NUMERIC,
        current_value NUMERIC,
        last_price NUMERIC,
        last_price_at TIMESTAMP,
        UNIQUE (user_id, symbol)
    );
    """)

    # TRANSACTIONS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(20),
        type VARCHAR(20)
            CHECK (type IN ('buy', 'sell', 'dividend', 'contribution', 'withdrawal')) NOT NULL,
        quantity NUMERIC,
        price NUMERIC,
        fees NUMERIC,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # RECOMMENDATIONS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(150),
        recommendation_text TEXT,
        suggested_allocation JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # SIMULATIONS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        goal_id INT REFERENCES goals(id) ON DELETE SET NULL,
        scenario_name VARCHAR(100),
        assumptions JSONB,
        results JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # RISK QUESTIONS
    cur.execute("""
    CREATE TABLE IF NOT EXISTS risk_questions (
        id SERIAL PRIMARY KEY,
        question TEXT UNIQUE NOT NULL,
        option1 TEXT NOT NULL,
        option2 TEXT NOT NULL,
        option3 TEXT NOT NULL,
        option1_score INT NOT NULL,
        option2_score INT NOT NULL,
        option3_score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    cur.close()
    conn.close()
