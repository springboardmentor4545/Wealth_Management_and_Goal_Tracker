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
        sslmode="require",   
        cursor_factory=RealDictCursor
    )

def create_tables():
    """
    Create database tables for the Wealth Management API.
    Note: This function is for development/testing purposes.
    Cloud database is already created and managed separately.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # Users table with authentication fields
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        risk_profile VARCHAR(20) DEFAULT 'moderate',
        kyc_status VARCHAR(20) DEFAULT 'unverified',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Goals table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        goal_name VARCHAR(100) NOT NULL,
        target_amount NUMERIC NOT NULL,
        target_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    cur.close()
    conn.close()
