const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://hrms-lite-fullstack-cqgp.onrender.com"
)
  .toString()
  .trim()
  .replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("hrms_token");
  } catch {
    return null;
  }
}

function withAuth(headers = {}) {
  const token = getToken();
  if (!token) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

async function readError(res) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    return JSON.stringify(data);
  } catch {
    try {
      return await res.text();
    } catch {
      return "Request failed";
    }
  }
}

export async function getEmployees() {
  const res = await fetch(`${API_URL}/employees`, {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createEmployee(payload) {
  const res = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await readError(res));
  }
  return res.json();
}

export async function deleteEmployee(employeeId) {
  const res = await fetch(`${API_URL}/employees/${employeeId}`, {
    method: "DELETE",
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function markAttendance(employeeId, payload) {
  const res = await fetch(`${API_URL}/employees/${employeeId}/attendance`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getAttendance(employeeId, filters) {
  const url = new URL(`${API_URL}/employees/${employeeId}/attendance`);

  if (typeof filters === "string") {
    if (filters) url.searchParams.set("date", filters);
  } else {
    const date = filters?.date;
    const dateFrom = filters?.from;
    const dateTo = filters?.to;

    if (date) url.searchParams.set("date", date);
    if (dateFrom) url.searchParams.set("date_from", dateFrom);
    if (dateTo) url.searchParams.set("date_to", dateTo);
  }

  const res = await fetch(url.toString(), {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getDashboardSummary() {
  const res = await fetch(`${API_URL}/dashboard/summary`, {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getMyProfile() {
  const res = await fetch(`${API_URL}/employees/me/profile`, {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getMyAttendance(filters) {
  const url = new URL(`${API_URL}/employees/me/attendance`);

  if (typeof filters === "string") {
    if (filters) url.searchParams.set("date", filters);
  } else if (filters) {
    const date = filters.date;
    const dateFrom = filters.from;
    const dateTo = filters.to;

    if (date) url.searchParams.set("date", date);
    if (dateFrom) url.searchParams.set("date_from", dateFrom);
    if (dateTo) url.searchParams.set("date_to", dateTo);
  }

  const res = await fetch(url.toString(), {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function markMyAttendance(payload) {
  const res = await fetch(`${API_URL}/employees/me/attendance`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function registerUser(payload) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function loginUser(payload) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getHrsOverview() {
  const res = await fetch(`${API_URL}/admin/hrs`, {
    headers: withAuth(),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getHrEmployees(hrId) {
  const res = await fetch(
    `${API_URL}/admin/hrs/${encodeURIComponent(hrId)}/employees`,
    {
      headers: withAuth(),
    },
  );
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
