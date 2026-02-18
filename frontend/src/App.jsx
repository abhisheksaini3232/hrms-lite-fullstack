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
    refresh();
    refreshDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="app">
      <Topbar tab={tab} onTabChange={setTab} />

      <main className="shell">
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
