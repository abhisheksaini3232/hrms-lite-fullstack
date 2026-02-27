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
  getMyProfile,
  getMyAttendance,
  markMyAttendance,
  getHrsOverview,
  getHrEmployees,
  registerUser,
  loginUser,
  getCurrentUser,
  adminGetAttendance,
  adminMarkAttendance,
  adminDeleteEmployee,
} from "./api.js";

export default function App() {
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
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
  const [adminAttendanceEmployeeId, setAdminAttendanceEmployeeId] =
    useState("");
  const [adminAttendanceDate, setAdminAttendanceDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [adminAttendanceStatus, setAdminAttendanceStatus] = useState("Present");
  const [adminAttendance, setAdminAttendance] = useState([]);
  const [adminAttendanceLoading, setAdminAttendanceLoading] = useState(false);
  const [adminAttendanceError, setAdminAttendanceError] = useState("");
  const [adminAttendanceSaved, setAdminAttendanceSaved] = useState(false);
  const [adminAttendanceFilterFrom, setAdminAttendanceFilterFrom] =
    useState("");
  const [adminAttendanceFilterTo, setAdminAttendanceFilterTo] = useState("");

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

  // Attempt to restore a session from a stored token on first load.
  useEffect(() => {
    if (isAuthenticated) return;

    async function restoreSession() {
      try {
        const me = await getCurrentUser();
        if (me.role === "Employee") {
          // Employee access is disabled in this UI: drop the token
          // and stay on the auth screen.
          try {
            window.localStorage.removeItem("hrms_token");
          } catch {
            // ignore
          }
          return;
        }

        setUser({
          id: me.id,
          username: me.username,
          email: me.email,
          role: me.role,
          createdAt: me.created_at,
        });
        if (me.role === "Admin") {
          setTab("admin");
        } else {
          setTab("employees");
        }
      } catch {
        try {
          window.localStorage.removeItem("hrms_token");
        } catch {
          // ignore
        }
      }
    }

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const trimmedEmail = authEmail.trim();
    const trimmedName = authName.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (!authPassword || authPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }

    if (authMode === "register" && !trimmedName) {
      setAuthError("Please enter your name.");
      return;
    }

    try {
      let tokenResponse;
      if (authMode === "register") {
        tokenResponse = await registerUser({
          username: trimmedName,
          email: trimmedEmail,
          password: authPassword,
          role: authRole,
        });
      } else {
        tokenResponse = await loginUser({
          identifier: trimmedEmail,
          password: authPassword,
        });
      }

      try {
        window.localStorage.setItem("hrms_token", tokenResponse.access_token);
      } catch {
        // ignore storage errors
      }

      const me = await getCurrentUser();
      if (me.role === "Employee") {
        setAuthError(
          "Employee access is no longer available. Please sign in as HR or Admin.",
        );
        try {
          window.localStorage.removeItem("hrms_token");
        } catch {
          // ignore
        }
        return;
      }

      setUser({
        id: me.id,
        username: me.username,
        email: me.email,
        role: me.role,
        createdAt: me.created_at,
      });
      if (me.role === "Admin") {
        setTab("admin");
      } else {
        setTab("employees");
      }
      setAuthPassword("");
      setAuthError("");
    } catch (err) {
      setAuthError(err?.message || "Authentication failed. Please try again.");
    }
  }

  function handleLogout() {
    setUser(null);
    setAuthPassword("");
    setAuthError("");
    try {
      window.localStorage.removeItem("hrms_token");
    } catch {
      // ignore
    }
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
    if (userRole !== "Admin") return;
    if (!adminSelectedHrId || !adminAttendanceEmployeeId) {
      setAdminAttendance([]);
      setAdminAttendanceError("");
      setAdminAttendanceSaved(false);
      return;
    }

    async function loadAdminAttendance() {
      setAdminAttendanceLoading(true);
      setAdminAttendanceError("");
      setAdminAttendance([]);
      setAdminAttendanceSaved(false);
      try {
        const records = await adminGetAttendance(
          adminSelectedHrId,
          adminAttendanceEmployeeId,
          {
            from: adminAttendanceFilterFrom || undefined,
            to: adminAttendanceFilterTo || undefined,
          },
        );
        setAdminAttendance(records);
      } catch (e) {
        setAdminAttendanceError(
          e?.message || "Failed to load attendance for this employee",
        );
      } finally {
        setAdminAttendanceLoading(false);
      }
    }

    loadAdminAttendance();
  }, [
    userRole,
    adminSelectedHrId,
    adminAttendanceEmployeeId,
    adminAttendanceFilterFrom,
    adminAttendanceFilterTo,
  ]);

  useEffect(() => {
    if (userRole !== "Admin") return;

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
  }, [userRole, adminSelectedHrId]);

  async function handleAdminDeleteEmployee(employeeId) {
    if (!adminSelectedHrId || !employeeId) return;
    const confirmed = window.confirm(
      "Delete this employee and all of their attendance records?",
    );
    if (!confirmed) return;
    setAdminError("");
    try {
      await adminDeleteEmployee(adminSelectedHrId, employeeId);
      setAdminHrEmployees((prev) =>
        prev.filter((e) => e.employee_id !== employeeId),
      );
      setAdminHrs((prev) =>
        prev.map((hr) =>
          hr.id === adminSelectedHrId
            ? {
                ...hr,
                employees_count: Math.max(0, (hr.employees_count || 1) - 1),
              }
            : hr,
        ),
      );
      if (adminAttendanceEmployeeId === employeeId) {
        setAdminAttendanceEmployeeId("");
        setAdminAttendance([]);
        setAdminAttendanceError("");
        setAdminAttendanceSaved(false);
      }
    } catch (e) {
      setAdminError(
        e?.message || "Failed to delete employee for this HR account.",
      );
    }
  }

  // When switching HRs, clear any previously selected employee and
  // their attendance to avoid showing stale data from another HR.
  useEffect(() => {
    if (userRole !== "Admin") return;
    setAdminAttendanceEmployeeId("");
    setAdminAttendance([]);
    setAdminAttendanceError("");
    setAdminAttendanceSaved(false);
    setAdminAttendanceFilterFrom("");
    setAdminAttendanceFilterTo("");
  }, [userRole, adminSelectedHrId]);

  if (!isAuthenticated) {
    return (
      <div className="app appAuth">
        <div className="authShell">
          <div className="authIntro">
            <h1>HRMS Workspace</h1>
            <p>
              Sign in or create an account to manage employees and attendance.
              Choose a role to see the app from that perspective.
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
                Login
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
                Sign Up
              </button>
            </div>
            <form className="authForm" onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <label>
                  Name
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </label>
              )}
              <label>
                Email
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
              {authMode === "register" && (
                <label>
                  Role
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value)}
                  >
                    <option value="HR">HR</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>
              )}
              {authError ? <p className="authError">{authError}</p> : null}
              <button type="submit" className="primaryBtn fullWidth">
                {authMode === "login" ? "Enter workspace" : "Create account"}
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

  if (userRole === "Admin") {
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
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminHrEmployees.map((emp) => (
                          <tr
                            key={emp.employee_id}
                            onClick={() =>
                              setAdminAttendanceEmployeeId(emp.employee_id)
                            }
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                adminAttendanceEmployeeId === emp.employee_id
                                  ? "rgba(148, 163, 184, 0.12)"
                                  : "transparent",
                            }}
                          >
                            <td>{emp.employee_id}</td>
                            <td>{emp.full_name}</td>
                            <td>{emp.email}</td>
                            <td>{emp.department}</td>
                            <td>
                              <button
                                type="button"
                                className="dangerGhostBtn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAdminDeleteEmployee(emp.employee_id);
                                }}
                              >
                                Delete
                              </button>
                            </td>
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
                    <h2>Attendance editor</h2>
                    <p>
                      As Admin you can view and update attendance for any date
                      for the selected employee.
                    </p>
                  </div>
                </div>
                {!adminSelectedHrId || !adminAttendanceEmployeeId ? (
                  <p>
                    Select an HR account and an employee to manage attendance.
                  </p>
                ) : (
                  <>
                    <form
                      className="formGrid"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setAdminAttendanceError("");
                        setAdminAttendanceSaved(false);
                        try {
                          await adminMarkAttendance(
                            adminSelectedHrId,
                            adminAttendanceEmployeeId,
                            {
                              date: adminAttendanceDate,
                              status: adminAttendanceStatus,
                            },
                          );
                          const records = await adminGetAttendance(
                            adminSelectedHrId,
                            adminAttendanceEmployeeId,
                            {
                              from: adminAttendanceFilterFrom || undefined,
                              to: adminAttendanceFilterTo || undefined,
                            },
                          );
                          setAdminAttendance(records);
                          setAdminAttendanceSaved(true);
                        } catch (err) {
                          setAdminAttendanceError(
                            err?.message ||
                              "Failed to update attendance for this employee",
                          );
                        }
                      }}
                    >
                      <div className="rowInline">
                        <div>
                          <p className="statLabel">Employee</p>
                          <p className="statValue">
                            {adminAttendanceEmployeeId}
                          </p>
                        </div>
                        <div>
                          <button
                            type="button"
                            className="dangerGhostBtn"
                            onClick={() =>
                              handleAdminDeleteEmployee(
                                adminAttendanceEmployeeId,
                              )
                            }
                          >
                            Delete employee
                          </button>
                        </div>
                      </div>
                      <div className="fieldRow">
                        <label>
                          <span className="statLabel">Date</span>
                          <input
                            type="date"
                            value={adminAttendanceDate}
                            onChange={(e) =>
                              setAdminAttendanceDate(e.target.value)
                            }
                          />
                        </label>
                        <label>
                          <span className="statLabel">Status</span>
                          <select
                            value={adminAttendanceStatus}
                            onChange={(e) =>
                              setAdminAttendanceStatus(e.target.value)
                            }
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </label>
                      </div>
                      <div className="buttonRow">
                        <button type="submit" className="ghostBtn">
                          Save
                        </button>
                      </div>
                    </form>
                    {adminAttendanceSaved && !adminAttendanceError ? (
                      <p className="muted">Attendance saved.</p>
                    ) : null}
                    {adminAttendanceError ? (
                      <p className="authError">{adminAttendanceError}</p>
                    ) : null}
                    <div className="fieldRow" style={{ marginTop: 16 }}>
                      <label>
                        <span className="statLabel">From (optional)</span>
                        <input
                          type="date"
                          value={adminAttendanceFilterFrom}
                          onChange={(e) =>
                            setAdminAttendanceFilterFrom(e.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span className="statLabel">To (optional)</span>
                        <input
                          type="date"
                          value={adminAttendanceFilterTo}
                          onChange={(e) =>
                            setAdminAttendanceFilterTo(e.target.value)
                          }
                        />
                      </label>
                    </div>
                    {(adminAttendanceFilterFrom || adminAttendanceFilterTo) && (
                      <div className="buttonRow" style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="ghostBtn"
                          onClick={() => {
                            setAdminAttendanceFilterFrom("");
                            setAdminAttendanceFilterTo("");
                          }}
                        >
                          Clear date filter
                        </button>
                      </div>
                    )}
                    <div className="tableScroller">
                      <table className="dataTable">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminAttendanceLoading ? (
                            <tr>
                              <td colSpan={2}>Loading attendance…</td>
                            </tr>
                          ) : adminAttendance.length === 0 ? (
                            <tr>
                              <td colSpan={2}>No attendance records found.</td>
                            </tr>
                          ) : (
                            adminAttendance.map((row) => (
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
        ) : (
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
        )}
      </main>
    </div>
  );
}
