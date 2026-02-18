from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class EmployeeCreate(BaseModel):
    employee_id: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=200)
    department: str = Field(min_length=1, max_length=100)


class EmployeeOut(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str
    created_at: datetime


AttendanceStatus = Literal["Present", "Absent"]


class AttendanceCreate(BaseModel):
    date: date
    status: AttendanceStatus


class AttendanceOut(BaseModel):
    employee_id: str
    date: date
    status: AttendanceStatus
    created_at: datetime
