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
} from "./api.js";

export default function App() {
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
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

  const isAuthenticated = !!user;

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
    refresh();
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
    setAuthLoading(true);
    try {
      const payload = { email: authEmail.trim(), password: authPassword };
      let result;
      if (authMode === "register") {
        result = await registerUser(payload);
      } else {
        result = await loginUser(payload);
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

  const presentDays = useMemo(() => {
    return attendance.filter((a) => a.status === "Present").length;
  }, [attendance]);

  const dashboardRows = useMemo(() => {
    if (!dashboard?.per_employee) return [];
    return dashboard.per_employee;
  }, [dashboard]);
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
                Work Email
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
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
