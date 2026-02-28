# Frontend (React + Vite + Tailwind)

Quick start (from the `frontend` folder):

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Open the app at `http://localhost:3000`.

Configuration:
- API base: default is `http://127.0.0.1:8000`. To override, set `VITE_API_BASE` environment variable e.g. `VITE_API_BASE=http://localhost:8000 npm run dev`.

Features:
- Register page (calls `POST /auth/register`)
- Login page (calls `POST /auth/login`, stores tokens in `localStorage`)
- Profile page (calls `GET /users/me` with `Authorization: Bearer <access_token>`)

Notes:
- After installing, run the backend (see backend/README.md) so API endpoints are available.
- The project uses Tailwind; the styling is minimal to keep the integration clear.
# Frontend (React)

I recommend scaffolding the frontend with Vite or Create React App.

Quick scaffold using Vite (recommended):

```bash
# from workspace root
cd frontend
npm create vite@latest myapp -- --template react
cd myapp
npm install
npm run dev
```

Make requests to the backend endpoints `/auth/register` and `/auth/login` to implement register/login UI.
