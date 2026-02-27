from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .db import get_db
from .routes.dashboard import router as dashboard_router
from .routes.employees import router as employees_router
from .routes.admin import router as admin_router
from .auth import router as auth_router
from .settings import settings

app = FastAPI(title="HRMS Lite API")

logger = logging.getLogger("hrms_lite")

# For this SPA deployment we always allow all origins so that
# the Vercel frontend can talk to the Render backend regardless
# of host name. Credentials (cookies) are not used, only
# Authorization headers, so this is safe for our use case.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True}


@app.on_event("startup")
async def _startup_indexes():
    db = get_db()

    try:
        await db.employees.create_index("employee_id", unique=True)
        await db.employees.create_index("email", unique=True)
        await db.attendance.create_index(
            [("employee_id", 1), ("date", 1)],
            unique=True,
        )
    except Exception as exc:
        logger.exception("MongoDB index creation failed during startup: %s", exc)


app.include_router(employees_router)
app.include_router(dashboard_router)
app.include_router(admin_router)
app.include_router(auth_router)
