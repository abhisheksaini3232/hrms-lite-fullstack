import React from "react";

export default function Topbar({ tab, onTabChange, user, onLogout }) {
  return (
    <header className="topbarNew">
      <div className="topbarBrand">
        <div className="topbarLogo" aria-hidden="true">
          <span>HR</span>
        </div>
        <div className="topbarText">
          <strong>HR Workspace</strong>
          <span>{tab === "employees" ? "People" : "Attendance"} Console</span>
        </div>
      </div>

      <div className="topbarRight">
        <nav className="topbarNav" aria-label="Primary">
          <button
            type="button"
            className={tab === "employees" ? "topbarLink active" : "topbarLink"}
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
        </nav>

        {user ? (
          <div className="topbarUser">
            <div className="topbarUserInfo">
              <span className="topbarUserEmail">{user.email}</span>
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
