import React, { useEffect, useMemo, useState } from "react";
import {
  createEmployee,
  deleteEmployee,
  getAttendance,
  getEmployees,
  markAttendance,
} from "./api.js";

export default function App() {
  const [tab, setTab] = useState("employees");
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceStatus, setAttendanceStatus] = useState("Present");
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      employeeId.trim().length > 0 &&
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      department.trim().length > 0
    );
  }, [employeeId, fullName, email, department]);

  const canMarkAttendance = useMemo(() => {
    return selectedEmployeeId.trim().length > 0 && attendanceDate.trim().length > 0;
  }, [selectedEmployeeId, attendanceDate]);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await getEmployees();
      setEmployees(data);
      if (!selectedEmployeeId && data.length > 0) {
        setSelectedEmployeeId(data[0].employee_id);
      }
    } catch (e) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function refreshAttendance(nextEmployeeId = selectedEmployeeId, date = "") {
    if (!nextEmployeeId) {
      setAttendance([]);
      return;
    }
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const data = await getAttendance(nextEmployeeId, date || undefined);
      setAttendance(data);
    } catch (e) {
      setAttendanceError(e?.message || "Failed to load attendance");
    } finally {
      setAttendanceLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "attendance") return;
    refreshAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedEmployeeId]);

  async function onAdd(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    try {
      const created = await createEmployee({
        employee_id: employeeId.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        department: department.trim(),
      });
      setEmployees((prev) => [created, ...prev]);
      setEmployeeId("");
      setFullName("");
      setEmail("");
      setDepartment("");
      setShowAddEmployee(false);
    } catch (e) {
      setError(e?.message || "Failed to add employee");
    }
  }

  async function onDelete(empId) {
    setError("");
    try {
      await deleteEmployee(empId);
      setEmployees((prev) => prev.filter((x) => x.employee_id !== empId));
      if (selectedEmployeeId === empId) {
        setSelectedEmployeeId("");
        setAttendance([]);
      }
    } catch (e) {
      setError(e?.message || "Failed to delete employee");
    }
  }

  function goToAttendance(empId) {
    setSelectedEmployeeId(empId);
    setTab("attendance");
  }

  async function onMarkAttendance(e) {
    e.preventDefault();
    if (!canMarkAttendance) return;
    setAttendanceError("");
    try {
      await markAttendance(selectedEmployeeId, {
        date: attendanceDate,
        status: attendanceStatus,
      });
      await refreshAttendance(selectedEmployeeId);
    } catch (e) {
      setAttendanceError(e?.message || "Failed to mark attendance");
    }
  }

  const presentDays = useMemo(() => {
    return attendance.filter((a) => a.status === "Present").length;
  }, [attendance]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbarInner">
          <div className="brand">
            <div className="brandIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 11c1.656 0 3-1.567 3-3.5S17.656 4 16 4s-3 1.567-3 3.5S14.344 11 16 11Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 11c1.656 0 3-1.567 3-3.5S9.656 4 8 4 5 5.567 5 7.5 6.344 11 8 11Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 20c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 20c0-3.314-2.686-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 20c0-3.314 1.791-6 4-6s4 2.686 4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="brandTitle">HRMS Lite</div>
              <div className="brandSub">
                {tab === "employees" ? "Employee Management" : "Mark Attendance"}
              </div>
            </div>
          </div>

          <nav className="navPills" aria-label="Primary">
            <button
              type="button"
              className={tab === "employees" ? "pillBtn active" : "pillBtn"}
              onClick={() => setTab("employees")}
            >
              <span className="pillIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 11c1.656 0 3-1.567 3-3.5S17.656 4 16 4s-3 1.567-3 3.5S14.344 11 16 11Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 11c1.656 0 3-1.567 3-3.5S9.656 4 8 4 5 5.567 5 7.5 6.344 11 8 11Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 20c0-3.314 2.686-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M21 20c0-3.314-2.686-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              Employees
            </button>
            <button
              type="button"
              className={tab === "attendance" ? "pillBtn active" : "pillBtn"}
              onClick={() => setTab("attendance")}
            >
              <span className="pillIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              Mark Attendance
            </button>
          </nav>
        </div>
      </header>

      <main className="shell">
        {tab === "employees" ? (
          <section className="hero">
            <h1>Employees</h1>
            <p className="heroSub">Manage your team members and their records</p>
            <button
              type="button"
              className="primaryBtn"
              onClick={() => setShowAddEmployee((v) => !v)}
            >
              <span className="btnIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              Add Employee
            </button>
          </section>
        ) : (
          <section className="hero">
            <h1>Mark Attendance</h1>
            <p className="heroSub">Track daily presence with simple status updates</p>
          </section>
        )}

      {tab === "employees" ? (
        <>
          {showAddEmployee ? (
            <section className="card">
              <div className="cardHeader">
                <h2>Add Employee</h2>
              </div>

              <form onSubmit={onAdd} className="form">
                <div className="grid2">
                  <label>
                    Employee ID
                    <input
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP001"
                    />
                  </label>
                  <label>
                    Department
                    <input
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering"
                    />
                  </label>
                </div>
                <label>
                  Full Name
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </label>
                <label>
                  Email Address
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </label>

                <div className="row">
                  <button type="submit" className="primaryBtn" disabled={!canSubmit}>
                    Save Employee
                  </button>
                  <button
                    type="button"
                    className="ghostBtn"
                    onClick={() => setShowAddEmployee(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {error ? <p className="error">{error}</p> : null}
            </section>
          ) : null}

          <section className="card">
            <div className="cardHeader">
              <h2>All Employees ({employees.length})</h2>
            </div>
            {loading ? (
              <p>Loading...</p>
            ) : employees.length === 0 ? (
              <p>No employees yet. Add your first employee above.</p>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th className="actionsCol">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.employee_id}>
                        <td className="mono">{emp.employee_id}</td>
                        <td>{emp.full_name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.department}</td>
                        <td className="actions actionsCol">
                          <div className="actionsWrap">
                            <button
                              className="actionBtn"
                              onClick={() => goToAttendance(emp.employee_id)}
                              type="button"
                            >
                              <span className="btnIcon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/>
                                </svg>
                              </span>
                              Attendance
                            </button>
                            <button
                              className="dangerBtn"
                              onClick={() => onDelete(emp.employee_id)}
                              type="button"
                            >
                              <span className="btnIcon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                  <path d="M6 6l1 16h10l1-16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                  <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </span>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="card">
            <h2>Attendance Management</h2>
            {employees.length === 0 ? (
              <p>Add at least one employee to mark attendance.</p>
            ) : (
              <form className="form" onSubmit={onMarkAttendance}>
                <div className="grid2">
                  <label>
                    Employee
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                      {employees.map((e) => (
                        <option key={e.employee_id} value={e.employee_id}>
                          {e.employee_id} — {e.full_name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </label>
                </div>
                <label>
                  Status
                  <select
                    value={attendanceStatus}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </label>
                <div className="row">
                  <button type="submit" className="primaryBtn" disabled={!canMarkAttendance}>
                    Mark Attendance
                  </button>
                </div>
                {attendanceError ? <p className="error">{attendanceError}</p> : null}
              </form>
            )}
          </section>

          <section className="card">
            <div className="cardHeader">
              <h2>Attendance Records</h2>
              <div className="pill">
                Total Present Days: <strong>{presentDays}</strong>
              </div>
            </div>

            {attendanceLoading ? (
              <p>Loading...</p>
            ) : selectedEmployeeId && attendance.length === 0 ? (
              <p>No attendance records yet.</p>
            ) : !selectedEmployeeId ? (
              <p>Select an employee to view attendance.</p>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a) => (
                      <tr key={`${a.employee_id}-${a.date}`}>
                        <td className="mono">{a.date}</td>
                        <td>
                          <span className={a.status === "Present" ? "badge ok" : "badge bad"}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      </main>
    </div>
  );
}
