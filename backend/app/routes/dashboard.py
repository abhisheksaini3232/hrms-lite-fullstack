from __future__ import annotations

from fastapi import APIRouter

from ..db import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary():
    db = get_db()

    employees_total = await db.employees.count_documents({})
    attendance_total = await db.attendance.count_documents({})
    present_total = await db.attendance.count_documents({"status": "Present"})
    absent_total = await db.attendance.count_documents({"status": "Absent"})

    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$limit": 200},
        {
            "$lookup": {
                "from": "attendance",
                "let": {"eid": "$employee_id"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$employee_id", "$$eid"]}}},
                    {
                        "$group": {
                            "_id": None,
                            "total_records": {"$sum": 1},
                            "present_days": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": ["$status", "Present"]},
                                        1,
                                        0,
                                    ]
                                }
                            },
                            "absent_days": {
                                "$sum": {
                                    "$cond": [
                                        {"$eq": ["$status", "Absent"]},
                                        1,
                                        0,
                                    ]
                                }
                            },
                        }
                    },
                ],
                "as": "att",
            }
        },
        {
            "$addFields": {
                "att": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$att", 0]},
                        {"total_records": 0, "present_days": 0, "absent_days": 0},
                    ]
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "employee_id": 1,
                "full_name": 1,
                "department": 1,
                "present_days": "$att.present_days",
                "absent_days": "$att.absent_days",
                "total_records": "$att.total_records",
            }
        },
        {"$sort": {"present_days": -1, "employee_id": 1}},
    ]

    per_employee = await db.employees.aggregate(pipeline).to_list(length=200)

    return {
        "employees_total": employees_total,
        "attendance_total": attendance_total,
        "present_total": present_total,
        "absent_total": absent_total,
        "per_employee": per_employee,
    }
