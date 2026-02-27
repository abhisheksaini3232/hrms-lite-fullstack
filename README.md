# HRMS Lite – Full‑Stack Assignment Implementation

A lightweight Human Resource Management System (HRMS Lite) built to satisfy a full‑stack assignment brief:

- Employee management (add/view/delete employees)
- Daily attendance tracking (Present/Absent) per employee
- Clean, production‑ready UI
- Deployed frontend + backend wired to a live database

This project intentionally focuses on correctness, stability, and clarity rather than excessive features.

---

## 1. Project Overview

The goal of this application is to simulate a basic internal HR tool. In its simplest form it supports:

- Managing a directory of employees with core fields
- Recording daily attendance for each employee
- Reviewing attendance history per employee

This implementation extends the original brief slightly by introducing:

- **HR users** who manage employees and attendance within their own workspace
- A global **Admin** who can see all HR accounts and edit any employee’s attendance history

If you want to treat it as a strict “single admin, no auth” system (per the brief), you can simply:

- Create a single Admin account and use only that account in practice.

---

## 2. Problem Statement (from brief)

> Build a web-based HRMS Lite application that allows an admin to:
>
> - Manage employee records
> - Track daily attendance

This repo provides that system as a deployed, production‑ready React + FastAPI + MongoDB application.

---

## 3. Functional Requirements Mapping

### 3.1 Employee Management

**Brief requirement:**

- Add new employee with:
  - Employee ID (unique)
  - Full name
  - Email address
  - Department
- View list of all employees
- Delete an employee

**Implementation:**

- API:
  - `POST /employees`
    - Body: `{ employee_id, full_name, email, department }`
    - Validates required fields and email format.
    - Prevents duplicates per HR (unique `employee_id` + `email` within that HR’s workspace).
  - `GET /employees` – list all employees under the current HR account.
  - `DELETE /employees/{employee_id}` – delete employee and their attendance records for that HR.
- UI (HR view):
  - “Team” tab shows:
    - Add employee form
    - Employee table (ID, name, email, department, actions)
  - Supports loading state, empty state, and error messages.

 **Status:** Fully implemented.

### 3.2 Attendance Management

**Brief requirement:**

- Mark attendance for an employee with:
  - Date
  - Status (Present / Absent)
- View attendance records for each employee

**Implementation:**

- For **HR** (per‑workspace admin):
  - `POST /employees/{employee_id}/attendance`
    - HR can create or update attendance for **today or any past date**.
    - Future dates are rejected.
  - `GET /employees/{employee_id}/attendance`
    - Optional filters: `date`, `date_from`, `date_to` (inclusive range).
  - UI: “Attendance” tab for HR shows:
    - Employee dropdown, date picker, status selector, Save button
    - History table with date + status that can be filtered by a **From / To** date range.
    - Loading/empty/error states + date range filters.

- For **Admin** (global):
  - `POST /admin/hrs/{hr_id}/employees/{employee_id}/attendance`
    - Upserts attendance for **any date** for that employee.
  - `GET /admin/hrs/{hr_id}/employees/{employee_id}/attendance`
    - Full history for that employee under the selected HR, with optional `date_from` / `date_to` filters (inclusive range).
  - `DELETE /admin/hrs/{hr_id}/employees/{employee_id}`
    - Deletes an employee under the selected HR account and cleans up their attendance.
  - UI: Admin console includes:
    - An "Employees under HR" table where Admin can **select** an employee or **delete** them.
    - An “Attendance editor” panel where Admin:
    - Picks HR → picks Employee → edits any date/status.
    - Uses its own **From / To** date range controls above the history table to filter attendance.

**Status:** Fully implemented, with extra Admin tooling for corrections.

---

## 4. Architecture & Tech Stack

- **Frontend:** React (Vite)
  - Components: `Topbar`, `EmployeesTab`, `AttendanceTab`, Admin overview.
  - State management via React hooks.
  - API client in `frontend/src/api.js`.

- **Backend:** FastAPI (Python)
  - App entry: `backend/app/main.py`.
  - Routers:
    - `employees` – employee + HR attendance endpoints
    - `dashboard` – summary statistics
    - `admin` – global admin views/attendance editing
    - `auth` – registration/login for HR/Admin

- **Database:** MongoDB Atlas
  - Access via Motor (async driver).
  - Collections:
    - `users` – HR/Admin accounts
    - `employees` – employee documents
    - `attendance` – per‑employee, per‑date attendance records

- **Deployment:**
  - Frontend: Vercel
  - Backend: Render

---

## 5. Live Deployment

> These URLs must be publicly accessible and wired together.

- **Frontend (Vercel):**
  - `https://hrms-lite-fullstack-jxc6.vercel.app/`
- **Backend API (Render):**
  - `https://hrms-lite-fullstack-cqgp.onrender.com`
- **GitHub Repository:**
  - `https://github.com/abhisheksaini3232/hrms-lite-fullstack`

The frontend is configured to call the backend via `VITE_API_URL` (see `frontend/.env.example` and `frontend/src/api.js`).

**Status:** App is fully deployed; frontend talks to the live backend.

---

## 6. Running the Project Locally

### 6.0 Quick Start (Local)

1. **Clone the repo**

- `git clone https://github.com/abhisheksaini3232/hrms-lite-fullstack`
- `cd hrms-lite-fullstack`

2. **Create a MongoDB database** (Atlas or local) and copy the connection string.
3. **Start the backend**

- Follow the steps in **6.2 Backend (FastAPI)** and set `MONGODB_URI` in `backend/.env`.
- Confirm `http://localhost:8000/health` returns OK.

4. **Start the frontend**

- Follow the steps in **6.3 Frontend (React + Vite)** and set `VITE_API_URL=http://localhost:8000` in `frontend/.env`.
- Open `http://localhost:5173` in your browser.

5. **Create an account in the UI**

- Use the signup form to create an **Admin** or **HR** account.
- Log in and start adding employees and marking attendance.

### 6.1 Prerequisites

- Node.js (LTS)
- Python 3.12 (recommended)
- A MongoDB Atlas cluster (or any MongoDB instance) with a valid connection string

### 6.2 Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows PowerShell
. .\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

copy .env.example .env
# Edit .env and set MONGODB_URI

uvicorn app.main:app --reload --port 8000
```

Health check:

- http://localhost:8000/health

#### Backend environment variables

- `MONGODB_URI` (required) – Atlas connection string
- `MONGODB_DB` (optional, default `hrms_lite`)
- `CORS_ORIGINS` – comma‑separated list of allowed frontend URLs

### 6.3 Frontend (React + Vite)

```bash
cd frontend
npm install
copy .env.example .env
# In .env set VITE_API_URL=http://localhost:8000
npm run dev
```

Open:

- http://localhost:5173

**Status:** Repo contains everything needed to run locally for backend + frontend.

---

## 7. API Surface (Summary)

### 7.1 Auth

- `POST /auth/register`
  - Create a user with `{ username, email, password, role }` where `role ∈ {"HR", "Admin"}`.
  - Returns JWT access token.
- `POST /auth/login`
  - Login with `{ identifier, password }` (identifier = email or username).
  - Returns JWT access token.
- `GET /auth/me`
  - Returns current user info based on `Authorization: Bearer <token>`.

> **Note:** Original brief assumed “no authentication”. This implementation adds auth so multiple HR/Admin accounts can be tested. You can still use a single Admin in practice to match the brief.

### 7.2 Employees (HR‑scoped)

- `GET /employees`
- `POST /employees`
- `DELETE /employees/{employee_id}`
- `POST /employees/{employee_id}/attendance`
- `GET /employees/{employee_id}/attendance`

### 7.3 Dashboard

- `GET /dashboard/summary`
  - Returns counts and per‑employee aggregates (present/absent days).

### 7.4 Admin

- `GET /admin/hrs`
- `GET /admin/hrs/{hr_id}/employees`
- `GET /admin/hrs/{hr_id}/employees/{employee_id}/attendance`
- `POST /admin/hrs/{hr_id}/employees/{employee_id}/attendance`

All admin/HR endpoints enforce role‑based access using JWTs.

---

## 8. Validation, Errors, and UI States

### 8.1 Server‑side validation

- Required fields enforced via Pydantic models (`EmployeeCreate`, `AttendanceCreate`, etc.).
- Email format validated using a regex before insert.
- Duplicates:
  - Employees: checked by `employee_id` and `email` per HR, with unique indexes.
  - Attendance: unique per `employee_id + date (+ owner_id)`.

### 8.2 Error handling

- Uses `HTTPException` with appropriate status codes:
  - `400/422` for bad input (invalid ranges, missing fields, invalid email)
  - `401/403` for auth/permission issues
  - `404` for not‑found entities
  - `409` for duplicate employees / user accounts
- API client (`frontend/src/api.js`) converts error responses into user‑friendly messages.

### 8.3 Frontend UI states

- **Loading**
  - HR employee list, attendance history, admin overviews and attendance all show loading text/spinners.
- **Empty states**
  - “No employees yet”, “No attendance recorded”, “No HR accounts found” messages.
- **Error states**
  - Clear error text near forms and tables when API calls fail.

✅ **Status:** Brief’s expectations for validation, error handling, and UI states are satisfied.

---

