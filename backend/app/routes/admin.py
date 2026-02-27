from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..db import get_db
from ..auth import require_roles


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
