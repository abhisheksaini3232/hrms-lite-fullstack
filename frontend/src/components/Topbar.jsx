import React from "react";

export default function Topbar({ tab, onTabChange }) {
  return (
    <header className="topbar">
      <div className="topbarInner">
        <div className="brand">
          <div className="brandIcon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 11c1.656 0 3-1.567 3-3.5S17.656 4 16 4s-3 1.567-3 3.5S14.344 11 16 11Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M8 11c1.656 0 3-1.567 3-3.5S9.656 4 8 4 5 5.567 5 7.5 6.344 11 8 11Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M3 20c0-3.314 2.686-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M21 20c0-3.314-2.686-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 20c0-3.314 1.791-6 4-6s4 2.686 4 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="brandTitle">HRMS Lite</div>
            <div className="brandSub">
              {tab === "employees" ? "Employee Management" : "Mark Attendance"}
            </div>
          </div>
        </div>

        <nav className="navPills" aria-label="Primary">
          <button
            type="button"
            className={tab === "employees" ? "pillBtn active" : "pillBtn"}
            onClick={() => onTabChange("employees")}
          >
            <span className="pillIcon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 11c1.656 0 3-1.567 3-3.5S17.656 4 16 4s-3 1.567-3 3.5S14.344 11 16 11Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 11c1.656 0 3-1.567 3-3.5S9.656 4 8 4 5 5.567 5 7.5 6.344 11 8 11Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M3 20c0-3.314 2.686-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 20c0-3.314-2.686-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            Employees
          </button>
          <button
            type="button"
            className={tab === "attendance" ? "pillBtn active" : "pillBtn"}
            onClick={() => onTabChange("attendance")}
          >
            <span className="pillIcon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 7v5l3 2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Mark Attendance
          </button>
        </nav>
      </div>
    </header>
  );
}
