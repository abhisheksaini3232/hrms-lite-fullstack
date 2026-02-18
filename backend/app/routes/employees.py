from datetime import datetime
import re

from fastapi import APIRouter, HTTPException, Query, status
from pymongo.errors import DuplicateKeyError

from ..db import get_db
from ..models import AttendanceCreate, AttendanceOut, EmployeeCreate, EmployeeOut

router = APIRouter(prefix="/employees", tags=["employees"])


def _doc_to_employee(doc) -> EmployeeOut:
    return EmployeeOut(
        employee_id=doc["employee_id"],
        full_name=doc["full_name"],
        email=doc["email"],
        department=doc["department"],
        created_at=doc["created_at"],
    )


def _date_to_str(d) -> str:
    return d.isoformat()


def _attendance_doc_to_out(doc) -> AttendanceOut:
    # stored as ISO string in Mongo
    return AttendanceOut(
        employee_id=doc["employee_id"],
        date=datetime.fromisoformat(doc["date"]).date(),
        status=doc["status"],
        created_at=doc["created_at"],
    )


_EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@router.get("", response_model=list[EmployeeOut])
async def list_employees():
    db = get_db()
    cursor = db.employees.find({}).sort("created_at", -1).limit(200)
    docs = await cursor.to_list(length=200)
    return [_doc_to_employee(d) for d in docs]


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(payload: EmployeeCreate):
    db = get_db()

    if not _EMAIL_RE.match(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email format")

    # Friendly pre-check (unique indexes also enforce this)
    existing = await db.employees.find_one(
        {"$or": [{"employee_id": payload.employee_id}, {"email": payload.email}]}
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Duplicate employee (employee_id or email already exists)",
        )

    doc = payload.model_dump()
    doc["created_at"] = datetime.utcnow()

    try:
        await db.employees.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Duplicate employee (employee_id or email already exists)",
        )

    created = await db.employees.find_one({"employee_id": payload.employee_id})
    return _doc_to_employee(created)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(employee_id: str):
    db = get_db()

    result = await db.employees.delete_one({"employee_id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Best-effort cleanup of attendance for deleted employee
    await db.attendance.delete_many({"employee_id": employee_id})
    return None


@router.post(
    "/{employee_id}/attendance",
    response_model=AttendanceOut,
    status_code=status.HTTP_201_CREATED,
)
async def mark_attendance(employee_id: str, payload: AttendanceCreate):
    db = get_db()

    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    date_str = _date_to_str(payload.date)
    doc_filter = {"employee_id": employee_id, "date": date_str}
    now = datetime.utcnow()

    # Marking attendance should be idempotent for same date: update if exists, insert if not.
    await db.attendance.update_one(
        doc_filter,
        {"$set": {"status": payload.status, "created_at": now}},
        upsert=True,
    )

    saved = await db.attendance.find_one(doc_filter)
    return _attendance_doc_to_out(saved)


@router.get("/{employee_id}/attendance", response_model=list[AttendanceOut])
async def list_attendance(
    employee_id: str,
    date: str | None = Query(default=None, description="Filter by YYYY-MM-DD"),
    date_from: str | None = Query(
        default=None,
        description="Filter range start (YYYY-MM-DD)",
    ),
    date_to: str | None = Query(
        default=None,
        description="Filter range end (YYYY-MM-DD)",
    ),
):
    db = get_db()

    employee = await db.employees.find_one({"employee_id": employee_id})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    query = {"employee_id": employee_id}
    if date:
        query["date"] = date
    else:
        if date_from and date_to and date_from > date_to:
            raise HTTPException(
                status_code=422,
                detail="Invalid date range: date_from must be <= date_to",
            )

        date_range: dict[str, str] = {}
        if date_from:
            date_range["$gte"] = date_from
        if date_to:
            date_range["$lte"] = date_to
        if date_range:
            query["date"] = date_range

    cursor = db.attendance.find(query).sort("date", -1).limit(366)
    docs = await cursor.to_list(length=366)
    return [_attendance_doc_to_out(d) for d in docs]
