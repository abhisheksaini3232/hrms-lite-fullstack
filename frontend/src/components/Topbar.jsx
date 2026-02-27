import React from "react";

export default function Topbar({ tab, onTabChange, user, onLogout }) {
  const role = user?.role || "HR";
  return (
    <header className="topbarNew">
      <div className="topbarBrand">
        <div className="topbarLogo" aria-hidden="true">
          <span>HR</span>
        </div>
        <div className="topbarText">
          <strong>HR Workspace</strong>
          <span>
            {role === "Admin"
              ? tab === "admin"
                ? "Admin Overview"
                : tab === "employees"
                  ? "People Console"
                  : "Attendance Console"
              : tab === "employees"
                ? "People Console"
                : "Attendance Console"}
          </span>
        </div>
      </div>

      <div className="topbarRight">
        {role !== "Employee" ? (
          <nav className="topbarNav" aria-label="Primary">
            <button
              type="button"
              className={
                tab === "employees" ? "topbarLink active" : "topbarLink"
              }
              onClick={() => onTabChange("employees")}
            >
              Team
            </button>
            <button
              type="button"
              className={
                tab === "attendance" ? "topbarLink active" : "topbarLink"
              }
              onClick={() => onTabChange("attendance")}
            >
              Attendance
            </button>
            {role === "Admin" ? (
              <button
                type="button"
                className={tab === "admin" ? "topbarLink active" : "topbarLink"}
                onClick={() => onTabChange("admin")}
              >
                Admin
              </button>
            ) : null}
          </nav>
        ) : null}

        {user ? (
          <div className="topbarUser">
            <div className="topbarUserInfo">
              <span className="topbarUserEmail">{user.email}</span>
              {user.role ? (
                <span className="topbarRole">{user.role}</span>
              ) : null}
              <button type="button" className="topbarLogout" onClick={onLogout}>
                Log out
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
