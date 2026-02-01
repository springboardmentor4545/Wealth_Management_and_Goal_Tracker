from sqlalchemy import create_engine, text
from main import DATABASE_URL

engine = create_engine(DATABASE_URL)

migration_sql = [
    "ALTER TABLE users RENAME COLUMN full_name TO name;",
    "ALTER TABLE users DROP COLUMN IF EXISTS kyc_completed;",
    "ALTER TABLE users DROP COLUMN IF EXISTS kyc_status;",
    "ALTER TABLE users DROP COLUMN IF EXISTS profile_completed;",
    "ALTER TABLE users DROP COLUMN IF EXISTS risk_score;",
    "ALTER TABLE users DROP COLUMN IF EXISTS risk_level;",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kycstatustype') THEN CREATE TYPE kycstatustype AS ENUM ('unverified', 'verified'); END IF; END $$;",
    "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'riskprofiletype') THEN CREATE TYPE riskprofiletype AS ENUM ('conservative', 'moderate', 'aggressive'); END IF; END $$;",
    "ALTER TABLE users ADD COLUMN kyc_status kycstatustype DEFAULT 'unverified';",
    "ALTER TABLE users ADD COLUMN risk_profile riskprofiletype;"
]

with engine.connect() as conn:
    for sql in migration_sql:
        try:
            print(f"Executing: {sql}")
            conn.execute(text(sql))
            conn.commit()
        except Exception as e:
            print(f"Error executing {sql}: {e}")
            conn.rollback()

print("Migration completed!")
