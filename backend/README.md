# Backend (FastAPI)

## Run locally

```bash
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health check:

- http://localhost:8000/health

Python:

- Recommended: Python `3.12.8` (matches the repo `.python-version` and Render blueprint)

## Environment

- `MONGODB_URI` (required)
- `MONGODB_DB` (default `hrms_lite`)
- `CORS_ORIGINS` (comma-separated list of allowed frontend origins)

Examples:

- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `CORS_ORIGINS=https://<your-app>.vercel.app`

## Routes

- `GET /health`
- `GET /employees`, `POST /employees`, `DELETE /employees/{employee_id}`
- `POST /employees/{employee_id}/attendance`
- `GET /employees/{employee_id}/attendance?date=YYYY-MM-DD`
- `GET /dashboard/summary`
