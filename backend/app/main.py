from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import get_db
from .routes.employees import router as employees_router
from .settings import settings

app = FastAPI(title="HRMS Lite API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True}


@app.on_event("startup")
async def _startup_indexes():
    db = get_db()

    await db.employees.create_index("employee_id", unique=True)
    await db.employees.create_index("email", unique=True)
    await db.attendance.create_index([("employee_id", 1), ("date", 1)], unique=True)


app.include_router(employees_router)
