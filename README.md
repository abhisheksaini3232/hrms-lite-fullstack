# HRMS Lite (React + FastAPI + MongoDB Atlas)

A lightweight HRMS app with:

- Employees CRUD (create, list, delete)
- Attendance marking (Present/Absent) + per-employee records
- Attendance records filtering by date
- Dashboard summary (`/dashboard/summary`) with per-employee totals

## Tech Stack

- Frontend: React (Vite)
- Backend: FastAPI (Python)
- Database: MongoDB (Atlas) via Motor (async driver)
- Deployment: Vercel (frontend) + Render (backend)

## Assumptions / Limitations

- Single admin user; no authentication/authorization.
- Scope intentionally limited to employee CRUD + attendance (no payroll/leave/etc).
- Attendance is tracked per employee per date (marking the same date again updates the status).

## Folder Structure

- `frontend/` React (Vite)
- `backend/` FastAPI

---

## Local Setup

### 1) Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env
# Edit .env and set MONGODB_URI

uvicorn app.main:app --reload --port 8000
```

Health check:

- http://localhost:8000/health

### 2) Frontend (React)

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open:

- http://localhost:5173

---

## MongoDB Atlas

1. Create an Atlas cluster.
2. Create a DB user.
3. Add your IP to **Network Access** (or allow from anywhere for testing).
4. Get the connection string and set it as `MONGODB_URI` in backend `.env` (local) or Render env var (production).

---

## Deployment

### Your Production URLs (current)

- Backend (Render): https://hrms-lite-fullstack-cqgp.onrender.com
- Frontend (Vercel): https://hrms-lite-fullstack-1gk4-oqawjuct6.vercel.app

### Frontend → Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project** → import the repo.
3. Set **Root Directory** to `frontend`.
4. Environment Variables:
   - `VITE_API_URL` = `https://hrms-lite-fullstack-cqgp.onrender.com`
5. Deploy.

### Backend → Render

Option A (recommended): Blueprint using `render.yaml`

1. In Render: **New** → **Blueprint** → connect the repo.
2. Set env vars:
   - `MONGODB_URI` (from Atlas)
   - `CORS_ORIGINS` = `https://hrms-lite-fullstack-1gk4-oqawjuct6.vercel.app`
3. Deploy.

Option B: Manual Web Service

- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Notes:

- Python is pinned to `3.12.8` via `.python-version` and `render.yaml`.
- If you use multiple Vercel domains (preview + production), add both to `CORS_ORIGINS` (comma-separated).

---

## API Endpoints

- `GET /health`
- `GET /employees`
- `POST /employees` body: `{ "employee_id": "...", "full_name": "...", "email": "...", "department": "..." }`
- `DELETE /employees/{employee_id}`
- `POST /employees/{employee_id}/attendance` body: `{ "date": "YYYY-MM-DD", "status": "Present" | "Absent" }`
- `GET /employees/{employee_id}/attendance` (optional query: `?date=YYYY-MM-DD`)
- `GET /dashboard/summary`
