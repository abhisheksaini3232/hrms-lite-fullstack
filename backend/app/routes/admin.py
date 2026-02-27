from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..db import get_db
from ..auth import require_roles
from ..models import AttendanceCreate, AttendanceOut


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/hrs")
async def list_hrs(current_user=Depends(require_roles("Admin"))):
  """List all HR accounts with basic info and employee counts."""

  db = get_db()

  hr_docs = await db.users.find({"role": "HR"}).sort("created_at", -1).to_list(length=1000)
  results: list[dict] = []
  for hr in hr_docs:
      employees_count = await db.employees.count_documents({"owner_id": hr["_id"]})
      results.append(
          {
              "id": hr["_id"],
              "username": hr.get("username", ""),
              "email": hr["email"],
              "created_at": hr["created_at"],
              "employees_count": employees_count,
          }
      )

  return results


@router.get("/hrs/{hr_id}/employees")
async def list_hr_employees(hr_id: str, current_user=Depends(require_roles("Admin"))):
  """Return details of a specific HR and all employees under that HR account."""

  db = get_db()

  hr = await db.users.find_one({"_id": hr_id, "role": "HR"})
  if not hr:
      raise HTTPException(
          status_code=status.HTTP_404_NOT_FOUND,
          detail="HR account not found",
      )

  cursor = db.employees.find({"owner_id": hr_id}).sort("created_at", -1)
  docs = await cursor.to_list(length=2000)

  employees: list[dict] = []
  for d in docs:
      employees.append(
          {
              "employee_id": d["employee_id"],
              "full_name": d["full_name"],
              "email": d["email"],
              "department": d["department"],
              "created_at": d["created_at"],
          }
      )

  return {
      "hr": {
          "id": hr["_id"],
          "username": hr.get("username", ""),
          "email": hr["email"],
          "created_at": hr["created_at"],
      },
      "employees": employees,
  }


def _attendance_doc_to_out(doc) -> AttendanceOut:
    return AttendanceOut(
        employee_id=doc["employee_id"],
        date=datetime.fromisoformat(doc["date"]).date(),
        status=doc["status"],
        created_at=doc["created_at"],
    )


@router.get(
    "/hrs/{hr_id}/employees/{employee_id}/attendance",
    response_model=list[AttendanceOut],
)
async def admin_list_attendance(
    hr_id: str,
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
    current_user=Depends(require_roles("Admin")),
):
    """View attendance history for an employee under a specific HR.

    This mirrors the HR view but lets an Admin inspect records across HR
    accounts without being tied to `owner_id` of the logged-in user.
    """

    db = get_db()

    hr = await db.users.find_one({"_id": hr_id, "role": "HR"})
    if not hr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="HR account not found",
        )

    employee = await db.employees.find_one(
        {"employee_id": employee_id, "owner_id": hr_id}
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found for this HR account",
        )

    query: dict[str, object] = {
        "employee_id": employee_id,
        "owner_id": hr_id,
    }
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


@router.post(
    "/hrs/{hr_id}/employees/{employee_id}/attendance",
    response_model=AttendanceOut,
    status_code=status.HTTP_201_CREATED,
)
async def admin_mark_attendance(
    hr_id: str,
    employee_id: str,
    payload: AttendanceCreate,
    current_user=Depends(require_roles("Admin")),
):
    """Allow an Admin to upsert attendance for any date for an employee.

    Unlike the employee self-service endpoint, this does not restrict the
    date to today. The record is stored under the given HR account's
    `owner_id` so that HR and Employee views remain consistent.
    """

    db = get_db()

    hr = await db.users.find_one({"_id": hr_id, "role": "HR"})
    if not hr:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="HR account not found",
        )

    employee = await db.employees.find_one(
        {"employee_id": employee_id, "owner_id": hr_id}
    )
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found for this HR account",
        )

    date_str = payload.date.isoformat()
    doc_filter = {
        "employee_id": employee_id,
        "owner_id": hr_id,
        "date": date_str,
    }

    now = datetime.utcnow()
    await db.attendance.update_one(
        doc_filter,
        {"$set": {"status": payload.status, "created_at": now}},
        upsert=True,
    )

    saved = await db.attendance.find_one(doc_filter)
    return _attendance_doc_to_out(saved)
