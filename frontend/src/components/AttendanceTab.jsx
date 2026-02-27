import React from "react";

export default function AttendanceTab({
  employees,
  selectedEmployeeId,
  setSelectedEmployeeId,
  attendanceDate,
  setAttendanceDate,
  attendanceStatus,
  setAttendanceStatus,
  canMarkAttendance,
  onMarkAttendance,
  attendanceError,
  attendance,
  attendanceLoading,
  presentDays,
  attendanceFilterFrom,
  setAttendanceFilterFrom,
  attendanceFilterTo,
  setAttendanceFilterTo,
}) {
  return (
    <div className="pane">
      <header className="paneHeader">
        <div>
          <h1 className="paneTitle">Attendance board</h1>
          <p className="paneSubtitle">Mark and review presence for employees in this HR workspace.</p>
        </div>
      </header>

      <section className="surface">
        <div className="surfaceHeader">
          <h2>Mark attendance</h2>
        </div>
        {employees.length === 0 ? (
          <p className="muted">Add at least one employee before marking attendance.</p>
        ) : (
          <form className="formGrid" onSubmit={onMarkAttendance}>
            <div className="fieldRow">
              <label>
                Employee
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                >
                  <option value="">Choose an employee…</option>
                  {employees.map((e) => (
                    <option key={e.employee_id} value={e.employee_id}>
                      {e.full_name} ({e.employee_id})
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
            <div className="buttonRow">
              <button
                type="submit"
                className="primaryBtn"
                disabled={!canMarkAttendance}
              >
                Save status
              </button>
            </div>
            {attendanceError ? (
              <p className="dangerText">{attendanceError}</p>
            ) : null}
          </form>
        )}
      </section>

      <section className="surface">
        <div className="surfaceHeader">
          <h2>History</h2>
          <span className="chip">Present days loaded: {presentDays}</span>
        </div>

        <div className="fieldRow" style={{ marginTop: 8 }}>
          <label>
            From (optional)
            <input
              type="date"
              value={attendanceFilterFrom}
              onChange={(e) => setAttendanceFilterFrom(e.target.value)}
            />
          </label>
          <label>
            To (optional)
            <input
              type="date"
              value={attendanceFilterTo}
              onChange={(e) => setAttendanceFilterTo(e.target.value)}
            />
          </label>
        </div>

        {attendanceFilterFrom || attendanceFilterTo ? (
          <div className="buttonRow" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="ghostBtn"
              onClick={() => {
                setAttendanceFilterFrom("");
                setAttendanceFilterTo("");
              }}
            >
              Clear date filter
            </button>
          </div>
        ) : null}

        {attendanceLoading ? (
          <p className="muted">Loading…</p>
        ) : selectedEmployeeId && attendance.length === 0 ? (
          <p className="muted">No attendance records yet for this employee.</p>
        ) : !selectedEmployeeId ? (
          <p className="muted">Select an employee to see their history.</p>
        ) : (
          <div className="tableScroller">
            <table className="dataTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={`${a.employee_id}-${a.date}`}>
                    <td className="mono" data-label="Date">
                      {a.date}
                    </td>
                    <td data-label="Status">
                      <span className={a.status === "Present" ? "pillOk" : "pillBad"}>
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
    </div>
  );
}
