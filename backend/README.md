# Backend (FastAPI)

## Run locally

```bash
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Environment

- `MONGODB_URI` (required)
- `MONGODB_DB` (default `hrms_lite`)
- `CORS_ORIGINS` (comma-separated)
