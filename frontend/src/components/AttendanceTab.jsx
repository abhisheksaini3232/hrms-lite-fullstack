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
    <>
      <section className="hero">
        <h1>Mark Attendance</h1>
        <p className="heroSub">
          Track daily presence with simple status updates
        </p>
      </section>

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
              <button
                type="submit"
                className="primaryBtn"
                disabled={!canMarkAttendance}
              >
                Mark Attendance
              </button>
            </div>
            {attendanceError ? (
              <p className="error">{attendanceError}</p>
            ) : null}
          </form>
        )}
      </section>

      <section className="card">
        <div className="cardHeader">
          <h2>Attendance Records</h2>
          <div className="pill">
            Present Days (loaded): <strong>{presentDays}</strong>
          </div>
        </div>

        <div className="grid2" style={{ marginTop: 12 }}>
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
          <div className="row" style={{ marginTop: 8 }}>
            <button
              type="button"
              className="ghostBtn"
              onClick={() => {
                setAttendanceFilterFrom("");
                setAttendanceFilterTo("");
              }}
            >
              Remove Filter
            </button>
          </div>
        ) : null}

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
                    <td className="mono" data-label="Date">
                      {a.date}
                    </td>
                    <td data-label="Status">
                      <span
                        className={
                          a.status === "Present" ? "badge ok" : "badge bad"
                        }
                      >
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
  );
}
