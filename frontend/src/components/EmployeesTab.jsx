import React from "react";

export default function EmployeesTab({
  employees,
  loading,
  error,
  dashboardLoading,
  dashboardError,
  dashboardRows,
  showAddEmployee,
  setShowAddEmployee,
  employeeId,
  setEmployeeId,
  fullName,
  setFullName,
  email,
  setEmail,
  department,
  setDepartment,
  canSubmit,
  onAdd,
  onDelete,
  goToAttendance,
}) {
  return (
    <>
      <section className="hero">
        <h1>Employees</h1>
        <p className="heroSub">Manage your team members and their records</p>
        <button
          type="button"
          className="primaryBtn"
          onClick={() => setShowAddEmployee((v) => !v)}
        >
          <span className="btnIcon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Add Employee
        </button>
      </section>

      <section className="card">
        <div className="cardHeader">
          <div className="row">
            <div className="pill">
              Employees: <strong>{employees.length}</strong>
            </div>
          </div>
        </div>

        {dashboardLoading ? (
          <p>Loading summary...</p>
        ) : dashboardError ? (
          <p className="error">{dashboardError}</p>
        ) : dashboardRows.length === 0 ? (
          <p>No attendance summary yet.</p>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Total Records</th>
                </tr>
              </thead>
              <tbody>
                {dashboardRows.map((r) => (
                  <tr key={r.employee_id}>
                    <td className="mono" data-label="Employee ID">
                      {r.employee_id}
                    </td>
                    <td data-label="Full Name">{r.full_name || "—"}</td>
                    <td data-label="Department">{r.department || "—"}</td>
                    <td className="mono" data-label="Present Days">
                      {r.present_days}
                    </td>
                    <td className="mono" data-label="Absent Days">
                      {r.absent_days}
                    </td>
                    <td className="mono" data-label="Total Records">
                      {r.total_records}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
              <button
                type="submit"
                className="primaryBtn"
                disabled={!canSubmit}
              >
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
                    <td className="mono" data-label="Employee ID">
                      {emp.employee_id}
                    </td>
                    <td data-label="Full Name">{emp.full_name}</td>
                    <td data-label="Email">{emp.email}</td>
                    <td data-label="Department">{emp.department}</td>
                    <td className="actions actionsCol" data-label="Actions">
                      <div className="actionsWrap">
                        <button
                          className="actionBtn"
                          onClick={() => goToAttendance(emp.employee_id)}
                          type="button"
                        >
                          <span className="btnIcon" aria-hidden="true">
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                                stroke="currentColor"
                                strokeWidth="2"
                              />
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
                            <svg
                              viewBox="0 0 24 24"
                              width="18"
                              height="18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3 6h18"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M8 6V4h8v2"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M6 6l1 16h10l1-16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M10 11v6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                              <path
                                d="M14 11v6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
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
  );
}
