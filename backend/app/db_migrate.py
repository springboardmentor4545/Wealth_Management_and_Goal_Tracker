"""Simple DB migration helper for local dev.
Adds new columns to `users` if they don't exist.
Run: python -m app.db_migrate
"""
from sqlalchemy import text
from .database import engine

queries = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR DEFAULT 'unverified';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS allocation TEXT;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_category VARCHAR DEFAULT 'unknown';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_notes TEXT;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR;",
    
    # Create Goals Table
    """
    CREATE TABLE IF NOT EXISTS goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR NOT NULL,
        target_amount INTEGER NOT NULL,
        target_date TIMESTAMP WITH TIME ZONE NOT NULL,
        monthly_contribution INTEGER DEFAULT 0,
        current_amount INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    # Create Investments Table
    """
    CREATE TABLE IF NOT EXISTS investments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        symbol VARCHAR NOT NULL,
        asset_type VARCHAR DEFAULT 'Stock',
        quantity FLOAT DEFAULT 0,
        average_buy_price FLOAT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    # Update Investments table
    "ALTER TABLE investments ADD COLUMN IF NOT EXISTS last_price FLOAT DEFAULT 0;",
    "ALTER TABLE investments ADD COLUMN IF NOT EXISTS last_price_updated_at TIMESTAMP WITH TIME ZONE;",
    "ALTER TABLE investments ADD COLUMN IF NOT EXISTS current_value FLOAT DEFAULT 0;",

    # Create Transactions Table
    """
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        symbol VARCHAR NOT NULL,
        transaction_type VARCHAR NOT NULL,
        quantity FLOAT NOT NULL,
        price_per_unit FLOAT NOT NULL,
        total_amount FLOAT NOT NULL,
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    # Create Simulations Table
    """
    CREATE TABLE IF NOT EXISTS simulations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR NOT NULL,
        assumptions TEXT NOT NULL,
        results TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """
]

def migrate():
    with engine.connect() as conn:
        for q in queries:
            conn.execute(text(q))
            conn.commit()
    print("Migration applied")


if __name__ == '__main__':
    migrate()
