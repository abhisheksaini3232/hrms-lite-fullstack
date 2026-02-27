from datetime import datetime, date
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.errors import DuplicateKeyError

from ..db import get_db
from ..models import AttendanceCreate, AttendanceOut, EmployeeCreate, EmployeeOut
from ..auth import require_roles

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
async def list_employees(current_user=Depends(require_roles("HR"))):
    db = get_db()
    cursor = (
        db.employees.find({"owner_id": current_user["_id"]})
        .sort("created_at", -1)
        .limit(200)
    )
    docs = await cursor.to_list(length=200)
    return [_doc_to_employee(d) for d in docs]


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_employee(
    payload: EmployeeCreate,
    current_user=Depends(require_roles("HR")),
):
    db = get_db()

    if not _EMAIL_RE.match(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email format")

    # Friendly pre-check (unique indexes also enforce this). Currently global on
    # employee_id/email; we also scope queries by owner_id for isolation.
    existing = await db.employees.find_one(
        {
            "owner_id": current_user["_id"],
            "$or": [
                {"employee_id": payload.employee_id},
                {"email": payload.email},
            ],
        }
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Duplicate employee (employee_id or email already exists)",
        )

    doc = payload.model_dump()
    doc["owner_id"] = current_user["_id"]
    doc["created_at"] = datetime.utcnow()

    try:
        await db.employees.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Duplicate employee (employee_id or email already exists)",
        )

    created = await db.employees.find_one(
        {"employee_id": payload.employee_id, "owner_id": current_user["_id"]}
    )
    return _doc_to_employee(created)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: str,
    current_user=Depends(require_roles("HR")),
):
    db = get_db()

    result = await db.employees.delete_one(
        {"employee_id": employee_id, "owner_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Best-effort cleanup of attendance for deleted employee
    await db.attendance.delete_many(
        {"employee_id": employee_id, "owner_id": current_user["_id"]}
    )
    return None


@router.post(
    "/{employee_id}/attendance",
    response_model=AttendanceOut,
    status_code=status.HTTP_201_CREATED,
)
async def mark_attendance(
    employee_id: str,
    payload: AttendanceCreate,
    current_user=Depends(require_roles("HR")),
):
    db = get_db()

    employee = await db.employees.find_one(
        {"employee_id": employee_id, "owner_id": current_user["_id"]}
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # HR can record attendance for today or any past date, but only
    # once per day. Any subsequent changes must be done by an Admin
    # via the admin endpoints.
    today = date.today()
    if payload.date > today:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR cannot mark attendance for future dates",
        )

    date_str = _date_to_str(payload.date)
    doc_filter = {
        "employee_id": employee_id,
        "date": date_str,
        "owner_id": current_user["_id"],
    }
    now = datetime.utcnow()

    existing = await db.attendance.find_one(doc_filter)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Attendance for this date is already recorded. "
                "Only an Admin can modify existing records."
            ),
        )

    try:
        await db.attendance.insert_one(
            {
                "employee_id": employee_id,
                "date": date_str,
                "owner_id": current_user["_id"],
                "status": payload.status,
                "created_at": now,
            }
        )
    except DuplicateKeyError:
        # In case of a rare race where another writer inserted first,
        # treat it as "already recorded".
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Attendance for this date is already recorded. "
                "Only an Admin can modify existing records."
            ),
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
    current_user=Depends(require_roles("HR")),
):
    db = get_db()

    employee = await db.employees.find_one(
        {"employee_id": employee_id, "owner_id": current_user["_id"]}
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    query = {"employee_id": employee_id, "owner_id": current_user["_id"]}
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


@router.get("/me/profile", response_model=EmployeeOut)
async def get_my_profile(current_user=Depends(require_roles("Employee"))):
    """Return the employee profile linked to the logged-in Employee user.

    Prefer the explicit `user_id` link set during employee signup, and
    fall back to matching by email for any legacy records.
    """

    db = get_db()

    employee = await db.employees.find_one({"user_id": current_user["_id"]})
    if not employee:
        employee = await db.employees.find_one({"email": current_user["email"]})

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found for this account",
        )

    return _doc_to_employee(employee)


@router.get("/me/attendance", response_model=list[AttendanceOut])
async def get_my_attendance(
    date: str | None = Query(default=None, description="Filter by YYYY-MM-DD"),
    date_from: str | None = Query(
        default=None,
        description="Filter range start (YYYY-MM-DD)",
    ),
    date_to: str | None = Query(
        default=None,
        description="Filter range end (YYYY-MM-DD)",
    ),
    current_user=Depends(require_roles("Employee")),
):
    """Return attendance history for the logged-in Employee user's record.

    This mirrors list_attendance, but derives the employee from the
    authenticated user's linked employee document instead of a path
    parameter.
    """

    db = get_db()

    employee = await db.employees.find_one({"user_id": current_user["_id"]})
    if not employee:
        employee = await db.employees.find_one({"email": current_user["email"]})

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found for this account",
        )

    query: dict[str, object] = {
        "employee_id": employee["employee_id"],
    }
    owner_id = employee.get("owner_id")
    if owner_id is not None:
        query["owner_id"] = owner_id
    if date:
        query["date"] = date
    else:
        if date_from and date_to and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
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


@router.post("/me/attendance", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
async def mark_my_attendance(
    payload: AttendanceCreate,
    current_user=Depends(require_roles("Employee")),
):
    """Allow an Employee to record attendance only for today's date.

    The employee is resolved from the login email and the record is
    tied to the same owner_id as in the HR records.
    """

    today = date.today()
    if payload.date != today:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees can only mark attendance for today's date",
        )

    db = get_db()

    employee = await db.employees.find_one({"user_id": current_user["_id"]})
    if not employee:
        employee = await db.employees.find_one({"email": current_user["email"]})

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee record not found for this account",
        )

    owner_id = employee.get("owner_id")
    date_str = _date_to_str(payload.date)

    doc_filter = {
        "employee_id": employee["employee_id"],
        "date": date_str,
    }
    if owner_id is not None:
        doc_filter["owner_id"] = owner_id

    now = datetime.utcnow()

    await db.attendance.update_one(
        doc_filter,
        {"$set": {"status": payload.status, "created_at": now}},
        upsert=True,
    )

    saved = await db.attendance.find_one(doc_filter)
    return _attendance_doc_to_out(saved)
