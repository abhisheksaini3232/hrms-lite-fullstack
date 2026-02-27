import React, { useEffect, useMemo, useState } from "react";
import Topbar from "./components/Topbar.jsx";
import EmployeesTab from "./components/EmployeesTab.jsx";
import AttendanceTab from "./components/AttendanceTab.jsx";
import {
  createEmployee,
  deleteEmployee,
  getDashboardSummary,
  getAttendance,
  getEmployees,
  markAttendance,
  registerUser,
  loginUser,
  getCurrentUser,
  getMyProfile,
  getMyAttendance,
  markMyAttendance,
  getHrsOverview,
  getHrEmployees,
} from "./api.js";

export default function App() {
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authRole, setAuthRole] = useState("HR");
  const [user, setUser] = useState(null);

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
    new Date().toISOString().slice(0, 10),
  );
  const [attendanceStatus, setAttendanceStatus] = useState("Present");
  const [attendanceFilterFrom, setAttendanceFilterFrom] = useState("");
  const [attendanceFilterTo, setAttendanceFilterTo] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // Employee self-service data
  const [selfProfile, setSelfProfile] = useState(null);
  const [selfAttendance, setSelfAttendance] = useState([]);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState("");

  const [selfTodayStatus, setSelfTodayStatus] = useState("Present");
  const [selfTodaySubmitting, setSelfTodaySubmitting] = useState(false);
  const [selfTodayError, setSelfTodayError] = useState("");

  // Admin overview data
  const [adminHrs, setAdminHrs] = useState([]);
  const [adminSelectedHrId, setAdminSelectedHrId] = useState("");
  const [adminSelectedHr, setAdminSelectedHr] = useState(null);
  const [adminHrEmployees, setAdminHrEmployees] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  const isAuthenticated = !!user;
  const userRole = user?.role || "HR";

  const canSubmit = useMemo(() => {
    return (
      employeeId.trim().length > 0 &&
      fullName.trim().length > 0 &&
      email.trim().length > 0 &&
      department.trim().length > 0
    );
  }, [employeeId, fullName, email, department]);

  const canMarkAttendance = useMemo(() => {
    return (
      selectedEmployeeId.trim().length > 0 && attendanceDate.trim().length > 0
    );
  }, [selectedEmployeeId, attendanceDate]);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const token = window.localStorage.getItem("hrms_token");
        if (!token) return;
        const me = await getCurrentUser();
        setUser(me);
      } catch {
        window.localStorage.removeItem("hrms_token");
        setUser(null);
      }
    }
    bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || userRole !== "Employee") return;

    async function loadSelf() {
      setSelfLoading(true);
      setSelfError("");
      try {
        const profile = await getMyProfile();
        setSelfProfile(profile);

        const today = new Date();
        const to = today.toISOString().slice(0, 10);
        const fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 29);
        const from = fromDate.toISOString().slice(0, 10);

        const attendanceData = await getMyAttendance({ from, to });
        setSelfAttendance(attendanceData);
      } catch (e) {
        setSelfError(e?.message || "Failed to load your workspace");
      } finally {
        setSelfLoading(false);
      }
    }

    loadSelf();
  }, [isAuthenticated, userRole]);

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

  async function refreshDashboard() {
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const data = await getDashboardSummary();
      setDashboard(data);
    } catch (e) {
      setDashboardError(e?.message || "Failed to load dashboard");
    } finally {
      setDashboardLoading(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return;
    if (userRole === "Employee") return;
    refresh();
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userRole]);

  async function refreshAttendance(
    nextEmployeeId = selectedEmployeeId,
    filters,
  ) {
    if (!nextEmployeeId) {
      setAttendance([]);
      return;
    }
    setAttendanceLoading(true);
    setAttendanceError("");
    try {
      const data = await getAttendance(nextEmployeeId, filters);
      setAttendance(data);
    } catch (e) {
      setAttendanceError(e?.message || "Failed to load attendance");
    } finally {
      setAttendanceLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "attendance") return;
    refreshAttendance(selectedEmployeeId, {
      from: attendanceFilterFrom || undefined,
      to: attendanceFilterTo || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedEmployeeId, attendanceFilterFrom, attendanceFilterTo]);

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");

    const trimmedName = authName.trim();
    const trimmedEmail = authEmail.trim();
    if (!trimmedName) {
      setAuthError("Please enter your name.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setAuthError("Please enter a valid work email.");
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      let result;
      if (authMode === "register") {
        result = await registerUser({
          username: trimmedName,
          email: trimmedEmail,
          password: authPassword,
          role: authRole,
        });
      } else {
        result = await loginUser({
          email: trimmedEmail,
          password: authPassword,
        });
      }
      window.localStorage.setItem("hrms_token", result.access_token);
      const me = await getCurrentUser();
      setUser(me);
      setAuthPassword("");
      setAuthError("");
    } catch (e2) {
      setAuthError(e2?.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem("hrms_token");
    setUser(null);
    setEmployees([]);
    setDashboard(null);
    setAttendance([]);
  }

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
      refreshDashboard();
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
      refreshDashboard();
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
      await refreshAttendance(selectedEmployeeId, {
        from: attendanceFilterFrom || undefined,
        to: attendanceFilterTo || undefined,
      });
      refreshDashboard();
    } catch (e) {
      setAttendanceError(e?.message || "Failed to mark attendance");
    }
  }

  async function handleSelfTodaySubmit(e) {
    e.preventDefault();
    setSelfTodayError("");

    try {
      setSelfTodaySubmitting(true);
      await markMyAttendance({
        date: todayStr,
        status: selfTodayStatus,
      });

      const today = new Date();
      const to = today.toISOString().slice(0, 10);
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 29);
      const from = fromDate.toISOString().slice(0, 10);

      const attendanceData = await getMyAttendance({ from, to });
      setSelfAttendance(attendanceData);
    } catch (e) {
      setSelfTodayError(e?.message || "Failed to update today's attendance");
    } finally {
      setSelfTodaySubmitting(false);
    }
  }

  const presentDays = useMemo(() => {
    return attendance.filter((a) => a.status === "Present").length;
  }, [attendance]);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const selfTodayRecord = useMemo(
    () => selfAttendance.find((a) => a.date === todayStr) || null,
    [selfAttendance, todayStr],
  );

  useEffect(() => {
    if (selfTodayRecord) {
      setSelfTodayStatus(selfTodayRecord.status);
    }
  }, [selfTodayRecord]);

  const selfPresentDays = useMemo(() => {
    return selfAttendance.filter((a) => a.status === "Present").length;
  }, [selfAttendance]);

  const selfAbsentDays = useMemo(() => {
    return selfAttendance.filter((a) => a.status === "Absent").length;
  }, [selfAttendance]);

  const dashboardRows = useMemo(() => {
    if (!dashboard?.per_employee) return [];
    return dashboard.per_employee;
  }, [dashboard]);

  useEffect(() => {
    if (userRole !== "Admin" || tab !== "admin") return;

    async function loadAdmin() {
      setAdminLoading(true);
      setAdminError("");
      try {
        const hrs = await getHrsOverview();
        setAdminHrs(hrs);

        if (hrs.length === 0) {
          setAdminSelectedHrId("");
          setAdminSelectedHr(null);
          setAdminHrEmployees([]);
          return;
        }

        let targetId = adminSelectedHrId || hrs[0].id;
        const match = hrs.find((h) => h.id === targetId) || hrs[0];
        targetId = match.id;

        setAdminSelectedHrId(targetId);
        setAdminSelectedHr(match);

        const detail = await getHrEmployees(targetId);
        setAdminHrEmployees(detail.employees || []);
      } catch (e) {
        setAdminError(e?.message || "Failed to load admin overview");
      } finally {
        setAdminLoading(false);
      }
    }

    loadAdmin();
  }, [userRole, tab, adminSelectedHrId]);

  if (!isAuthenticated) {
    return (
      <div className="app appAuth">
        <div className="authShell">
          <div className="authIntro">
            <h1>HR Workspace</h1>
            <p>
              Sign in or create an HR account to manage your own employees and
              attendance data in an isolated workspace.
            </p>
          </div>
          <div className="authCard">
            <div className="authTabs">
              <button
                type="button"
                className={authMode === "login" ? "authTab active" : "authTab"}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={
                  authMode === "register" ? "authTab active" : "authTab"
                }
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                Create Account
              </button>
            </div>
            <form className="authForm" onSubmit={handleAuthSubmit}>
              <label>
                Name
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Alex Johnson"
                />
              </label>
              <label>
                Work Email
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <label>
                Role
                <select
                  value={authRole}
                  onChange={(e) => setAuthRole(e.target.value)}
                >
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </label>
              {authError ? <p className="authError">{authError}</p> : null}
              <button
                type="submit"
                className="primaryBtn fullWidth"
                disabled={authLoading}
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign In"
                    : "Create HR Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Employee role: show a limited portal instead of the management console.
  if (userRole === "Employee") {
    return (
      <div className="app appDashboard">
        <Topbar
          tab={tab}
          onTabChange={setTab}
          user={user}
          onLogout={handleLogout}
        />

        <main className="layoutShell">
          <section className="pane">
            <header className="paneHeader">
              <div>
                <h1 className="paneTitle">Employee Portal</h1>
                <p className="paneSubtitle">
                  You are signed in as an employee. Review your profile and
                  recent attendance activity below.
                </p>
              </div>
            </header>
            <div className="paneGrid">
              <article className="surface">
                <div className="surfaceHeader">
                  <div>
                    <h2>My Profile</h2>
                    <p>Your employment details as recorded by HR.</p>
                  </div>
                </div>
                {selfLoading ? (
                  <p>Loading your workspace…</p>
                ) : selfError ? (
                  <p className="authError">{selfError}</p>
                ) : selfProfile ? (
                  <div className="paneGrid">
                    <div className="statCard">
                      <p className="statLabel">Name</p>
                      <p className="statValue">{selfProfile.full_name}</p>
                    </div>
                    <div className="statCard">
                      <p className="statLabel">Employee ID</p>
                      <p className="statValue">{selfProfile.employee_id}</p>
                    </div>
                    <div className="statCard">
                      <p className="statLabel">Department</p>
                      <p className="statValue">{selfProfile.department}</p>
                    </div>
                    <div className="statCard">
                      <p className="statLabel">Work Email</p>
                      <p className="statValue">{selfProfile.email}</p>
                    </div>
                  </div>
                ) : (
                  <p>
                    No employee record is linked to this account yet. Please
                    contact your HR or Admin if you believe this is an error.
                  </p>
                )}
              </article>
              <article className="surface">
                <div className="surfaceHeader">
                  <div>
                    <h2>My Attendance (last 30 days)</h2>
                    <p>A quick view of your recent presence and absences.</p>
                  </div>
                </div>
                {selfLoading ? (
                  <p>Loading attendance…</p>
                ) : selfError ? (
                  <p className="authError">{selfError}</p>
                ) : (
                  <>
                    <form
                      className="rowInline"
                      onSubmit={handleSelfTodaySubmit}
                    >
                      <div>
                        <p className="statLabel">Today</p>
                        <p className="statValue">{todayStr}</p>
                      </div>
                      <div className="rowInline">
                        <label>
                          <span className="statLabel">Status</span>
                          <select
                            value={selfTodayStatus}
                            onChange={(e) => setSelfTodayStatus(e.target.value)}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </label>
                        <button
                          type="submit"
                          className="primaryBtn"
                          disabled={selfTodaySubmitting}
                        >
                          {selfTodaySubmitting
                            ? "Saving…"
                            : "Save today's attendance"}
                        </button>
                      </div>
                    </form>
                    {selfTodayError ? (
                      <p className="authError">{selfTodayError}</p>
                    ) : null}
                    <div className="paneGrid">
                      <div className="statCard">
                        <p className="statLabel">Recorded Days</p>
                        <p className="statValue">{selfAttendance.length}</p>
                      </div>
                      <div className="statCard">
                        <p className="statLabel">Present</p>
                        <p className="statValue">{selfPresentDays}</p>
                      </div>
                      <div className="statCard">
                        <p className="statLabel">Absent</p>
                        <p className="statValue">{selfAbsentDays}</p>
                      </div>
                    </div>
                    <div className="tableScroller">
                      <table className="dataTable">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selfAttendance.length === 0 ? (
                            <tr>
                              <td colSpan={2}>No attendance recorded.</td>
                            </tr>
                          ) : (
                            selfAttendance.map((row) => (
                              <tr key={`${row.employee_id}-${row.date}`}>
                                <td>{row.date}</td>
                                <td>
                                  <span
                                    className={
                                      row.status === "Present"
                                        ? "pillOk"
                                        : "pillBad"
                                    }
                                  >
                                    {row.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </article>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app appDashboard">
      <Topbar
        tab={tab}
        onTabChange={setTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="layoutShell">
        {tab === "employees" ? (
          <EmployeesTab
            employees={employees}
            loading={loading}
            error={error}
            dashboardLoading={dashboardLoading}
            dashboardError={dashboardError}
            dashboardRows={dashboardRows}
            showAddEmployee={showAddEmployee}
            setShowAddEmployee={setShowAddEmployee}
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            department={department}
            setDepartment={setDepartment}
            canSubmit={canSubmit}
            onAdd={onAdd}
            onDelete={onDelete}
            goToAttendance={goToAttendance}
          />
        ) : tab === "attendance" ? (
          <AttendanceTab
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            attendanceDate={attendanceDate}
            setAttendanceDate={setAttendanceDate}
            attendanceStatus={attendanceStatus}
            setAttendanceStatus={setAttendanceStatus}
            canMarkAttendance={canMarkAttendance}
            onMarkAttendance={onMarkAttendance}
            attendanceError={attendanceError}
            attendance={attendance}
            attendanceLoading={attendanceLoading}
            presentDays={presentDays}
            attendanceFilterFrom={attendanceFilterFrom}
            setAttendanceFilterFrom={setAttendanceFilterFrom}
            attendanceFilterTo={attendanceFilterTo}
            setAttendanceFilterTo={setAttendanceFilterTo}
          />
        ) : userRole === "Admin" ? (
          <section className="pane">
            <header className="paneHeader">
              <div>
                <h1 className="paneTitle">Admin Overview</h1>
                <p className="paneSubtitle">
                  Review all HR accounts and the employees managed under each
                  HR.
                </p>
              </div>
            </header>
            <div className="paneGrid">
              <article className="surface">
                <div className="surfaceHeader">
                  <div>
                    <h2>HR Accounts</h2>
                    <p>Select an HR account to see its employee list.</p>
                  </div>
                </div>
                {adminLoading ? (
                  <p>Loading HR accounts…</p>
                ) : adminError ? (
                  <p className="authError">{adminError}</p>
                ) : adminHrs.length === 0 ? (
                  <p>No HR accounts found.</p>
                ) : (
                  <div className="tableScroller">
                    <table className="dataTable">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>Email</th>
                          <th>Employees</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminHrs.map((hr) => (
                          <tr
                            key={hr.id}
                            onClick={() => setAdminSelectedHrId(hr.id)}
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                adminSelectedHrId === hr.id
                                  ? "rgba(148, 163, 184, 0.12)"
                                  : "transparent",
                            }}
                          >
                            <td>{hr.username || "(no name)"}</td>
                            <td>{hr.email}</td>
                            <td>{hr.employees_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
              <article className="surface">
                <div className="surfaceHeader">
                  <div>
                    <h2>Employees under {adminSelectedHr?.username || "—"}</h2>
                    <p>All employees that belong to the selected HR account.</p>
                  </div>
                </div>
                {adminLoading ? (
                  <p>Loading employees…</p>
                ) : adminError ? (
                  <p className="authError">{adminError}</p>
                ) : adminHrEmployees.length === 0 ? (
                  <p>No employees found for this HR.</p>
                ) : (
                  <div className="tableScroller">
                    <table className="dataTable">
                      <thead>
                        <tr>
                          <th>Employee ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminHrEmployees.map((emp) => (
                          <tr key={emp.employee_id}>
                            <td>{emp.employee_id}</td>
                            <td>{emp.full_name}</td>
                            <td>{emp.email}</td>
                            <td>{emp.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
