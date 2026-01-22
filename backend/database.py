# DB connection + table creation functions for Wealth Management API. 
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

    # Goals table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        goal_type VARCHAR(20)
            CHECK (goal_type IN ('retirement', 'home', 'education', 'custom')) NOT NULL,
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

def seed_risk_questions():
    """
    Seed sample risk questions for testing.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # Check if already seeded
    cur.execute("SELECT COUNT(*) FROM risk_questions")
    if cur.fetchone()[0] > 0:
        print("Risk questions already seeded.")
        cur.close()
        conn.close()
        return

    questions = [
        {
            "question": "How long do you plan to invest your money?",
            "option1": "Less than 3 years",
            "option2": "3-7 years",
            "option3": "More than 7 years",
            "option1_score": 1,
            "option2_score": 3,
            "option3_score": 5
        },
        {
            "question": "What is your investment experience?",
            "option1": "None",
            "option2": "Some",
            "option3": "Extensive",
            "option1_score": 1,
            "option2_score": 3,
            "option3_score": 5
        },
        {
            "question": "How comfortable are you with market fluctuations?",
            "option1": "Not comfortable",
            "option2": "Somewhat comfortable",
            "option3": "Very comfortable",
            "option1_score": 1,
            "option2_score": 3,
            "option3_score": 5
        }
    ]

    for q in questions:
        cur.execute("""
            INSERT INTO risk_questions (question, option1, option2, option3, option1_score, option2_score, option3_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (q["question"], q["option1"], q["option2"], q["option3"], q["option1_score"], q["option2_score"], q["option3_score"]))

    conn.commit()
    cur.close()
    conn.close()
    print("Risk questions seeded successfully.")
