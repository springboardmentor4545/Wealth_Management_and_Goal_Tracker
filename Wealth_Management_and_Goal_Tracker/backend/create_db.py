#!/usr/bin/env python
"""Create the `springboard` database using psycopg2.

Usage:
  - Set environment variable PGPASSWORD, or
  - Pass password as first argument.

Example:
  (venv) python create_db.py mypassword
"""
import os
import sys
import psycopg2

DB_NAME = os.environ.get("DB_NAME", "springboard")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")


def get_password():
    if len(sys.argv) > 1:
        return sys.argv[1]
    pw = os.environ.get("PGPASSWORD")
    if pw:
        return pw
    # fallback to prompt
    try:
        import getpass
        return getpass.getpass("Postgres password: ")
    except Exception:
        return None


def main():
    pw = get_password()
    if not pw:
        print("No Postgres password provided (arg or PGPASSWORD). Exiting.")
        sys.exit(1)

    conn = None
    try:
        conn = psycopg2.connect(dbname='postgres', user=DB_USER, password=pw, host=DB_HOST, port=DB_PORT)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("SELECT 1 FROM pg_database WHERE datname=%s", (DB_NAME,))
        if cur.fetchone() is None:
            cur.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"Database '{DB_NAME}' created.")
        else:
            print(f"Database '{DB_NAME}' already exists.")
        cur.close()
    except Exception as e:
        print("Error while creating database:", e)
        sys.exit(2)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
