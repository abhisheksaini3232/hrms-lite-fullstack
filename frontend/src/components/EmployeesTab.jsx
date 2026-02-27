import React, { useState } from "react";

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
  const [employeeFormAttempted, setEmployeeFormAttempted] = useState(false);

  const showIdError = employeeFormAttempted && !employeeId.trim();
  const showNameError = employeeFormAttempted && !fullName.trim();
  const showEmailError = employeeFormAttempted && !email.trim();
  const showDeptError = employeeFormAttempted && !department.trim();

  function handleSubmit(e) {
    if (!canSubmit) {
      e.preventDefault();
      setEmployeeFormAttempted(true);
      return;
    }
    setEmployeeFormAttempted(false);
    onAdd(e);
  }

  return (
    <div className="pane">
      <header className="paneHeader">
        <div>
          <h1 className="paneTitle">Team directory</h1>
          <p className="paneSubtitle">
            Create and maintain the employees for this HR account only.
          </p>
        </div>
        <button
          type="button"
          className="primaryBtn"
          onClick={() => setShowAddEmployee((v) => !v)}
        >
          {showAddEmployee ? "Close form" : "Add employee"}
        </button>
      </header>

      <section className="paneGrid">
        <div className="statCard">
          <span className="statLabel">People in this workspace</span>
          <span className="statValue">{employees.length}</span>
        </div>
        <div className="statCard">
          <span className="statLabel">Tracked employees</span>
          <span className="statValue">{dashboardRows.length}</span>
        </div>
      </section>

      <section className="surface">
        <div className="surfaceHeader">
          <h2>Attendance snapshot</h2>
        </div>
        {dashboardLoading ? (
          <p className="muted">Loading summary…</p>
        ) : dashboardError ? (
          <p className="dangerText">{dashboardError}</p>
        ) : dashboardRows.length === 0 ? (
          <p className="muted">No attendance summary yet for this workspace.</p>
        ) : (
          <div className="tableScroller">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Present days</th>
                  <th>Absent days</th>
                  <th>Total records</th>
                </tr>
              </thead>
              <tbody>
                {dashboardRows.map((r) => (
                  <tr key={r.employee_id}>
                    <td data-label="Employee">
                      <div className="cellMain">
                        <span className="mono small">{r.employee_id}</span>
                        <span>{r.full_name || "—"}</span>
                      </div>
                    </td>
                    <td data-label="Department">{r.department || "—"}</td>
                    <td className="mono" data-label="Present days">
                      {r.present_days}
                    </td>
                    <td className="mono" data-label="Absent days">
                      {r.absent_days}
                    </td>
                    <td className="mono" data-label="Total records">
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
        <section className="surface">
          <div className="surfaceHeader">
            <h2>New employee</h2>
          </div>

          <form onSubmit={handleSubmit} className="formGrid">
            <div className="fieldRow">
              <label>
                Employee ID
                <input
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-001"
                />
                {showIdError ? (
                  <span className="fieldError">Employee ID is required.</span>
                ) : null}
              </label>
              <label>
                Department
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="People Operations"
                />
                {showDeptError ? (
                  <span className="fieldError">Department is required.</span>
                ) : null}
              </label>
            </div>
            <label>
              Full name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Smith"
              />
              {showNameError ? (
                <span className="fieldError">Full name is required.</span>
              ) : null}
            </label>
            <label>
              Work email
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
              />
              {showEmailError ? (
                <span className="fieldError">Work email is required.</span>
              ) : null}
            </label>

            <div className="buttonRow">
              <button
                type="submit"
                className="primaryBtn"
                disabled={!canSubmit}
              >
                Save employee
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

          {error ? <p className="dangerText">{error}</p> : null}
        </section>
      ) : null}

      <section className="surface">
        <div className="surfaceHeader">
          <h2>Employees in this account</h2>
        </div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : employees.length === 0 ? (
          <p className="muted">
            No employees yet. Add your first person above.
          </p>
        ) : (
          <div className="tableScroller">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.employee_id}>
                    <td className="mono" data-label="Employee ID">
                      {emp.employee_id}
                    </td>
                    <td data-label="Name">{emp.full_name}</td>
                    <td data-label="Email">{emp.email}</td>
                    <td data-label="Department">{emp.department}</td>
                    <td data-label="Actions">
                      <div className="rowInline">
                        <button
                          className="linkBtn"
                          type="button"
                          onClick={() => goToAttendance(emp.employee_id)}
                        >
                          Open attendance
                        </button>
                        <button
                          className="dangerGhostBtn"
                          type="button"
                          onClick={() => onDelete(emp.employee_id)}
                        >
                          Remove
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
    </div>
  );
}
