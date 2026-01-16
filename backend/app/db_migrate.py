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
]

def migrate():
    with engine.connect() as conn:
        for q in queries:
            conn.execute(text(q))
            conn.commit()
    print("Migration applied")


if __name__ == '__main__':
    migrate()
