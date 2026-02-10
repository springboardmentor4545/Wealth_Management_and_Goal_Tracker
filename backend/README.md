# Backend (FastAPI)

Quick start:

1. Create a virtual environment and install dependencies:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.

3. Create a PostgreSQL database (example):

```bash
# using psql
createdb mydatabase
# or create user and database as needed
```

4. Run the app:

```bash
uvicorn app.main:app --reload --port 8000
```

## Milestone 3: Market Sync & Simulations (Weeks 5-6)

New Features:
- **Live Market Data**: Prices updated via Yahoo Finance (`yfinance`).
- **Portfolio Valuation**: Real-time value and P&L calculations.
- **Background Jobs**: Automated nightly price updates using Celery + Redis.
- **Financial Simulations**: "What-If" projections for future wealth with charts.

### Setup Milestone 3
1. **Migrations**: Ensure new columns and tables are created.
   ```bash
   $env:PYTHONPATH="."
   .\venv\Scripts\python -m app.db_migrate
   ```

2. **Run Redis**: (Required for background jobs)
   - Ensure Redis is running on `localhost:6379`.
   - On Windows, you can use WSL `sudo service redis-server start` or a Windows port of Redis.

3. **Run Celery Worker**: (In a new terminal)
   ```bash
   $env:PYTHONPATH="."
   .\venv\Scripts\python -m celery -A app.celery_app.celery_app worker --loglevel=info -P solo
   ```
   *(Note: `-P solo` is required for Celery on Windows)*

4. **Run Celery Beat**: (For Scheduled Jobs - optional for dev)
   ```bash
   $env:PYTHONPATH="."
   .\venv\Scripts\python -m celery -A app.celery_app.celery_app beat --loglevel=info
   ```

### New Endpoints:
- `GET /portfolio/holdings` — Returns holdings with `last_price` and `current_value`.
- `GET /simulations/` — List all user simulations.
- `POST /simulations/` — Create a new future value projection.
- `DELETE /simulations/{id}` — Remove a simulation scenario.

---

Endpoints:
- `POST /auth/register` — register a user (JSON `email`, `password`, optional risk fields)
- `POST /auth/login` — login and receive `access_token` and `refresh_token`
- `POST /auth/refresh` — exchange refresh token for new tokens

Testing with curl:

```bash
curl -X POST http://localhost:8000/auth/register -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"secret"}'
curl -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"you@example.com","password":"secret"}'
```

Postman quick steps:

- Create a new request `POST http://localhost:8000/auth/register` with JSON body:
	```json
	{"email":"you@example.com","password":"secret"}
	```
- Send; you should get user data (without password). Then `POST /auth/login` with same JSON to receive tokens.

If you want to use the provided simple frontend, open [frontend/index.html](../frontend/index.html) in your browser and point the forms to `http://localhost:8000`.

Create the database locally (example using psql):

```bash
# create database
createdb springboard
# OR inside psql run:
-- CREATE DATABASE springboard;
```

When `.env` is set and the DB is reachable, start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Using tokens / protecting routes
- After `POST /auth/login` you'll receive `access_token` and `refresh_token`.
- To call protected endpoints (example: `GET /users/me`) include header:

	`Authorization: Bearer <access_token>`

Postman tips:
- Use the `Authorization` tab -> `Bearer Token` and paste the `access_token`.

PostgreSQL setup (Windows quick guide)

1. Install PostgreSQL:
	 - Option A: Download the installer from the PostgreSQL website and run it.
	 - Option B: If you have Chocolatey: `choco install postgresql` (run PowerShell as admin).

2. Initialize / start the server: the installer typically sets up a service you can start from Services or `pg_ctl`.

3. Create a database and user (PowerShell / cmd):

```powershell
# open psql (you may need to add psql to PATH or run from the installation folder)
psql -U postgres
# inside psql:
CREATE DATABASE springboard;
\q
```

4. Set `DATABASE_URL` in `.env` (example):

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/springboard
JWT_SECRET=replace-with-secret
```

5. Start the app and test endpoints (see curl/Postman examples above).
