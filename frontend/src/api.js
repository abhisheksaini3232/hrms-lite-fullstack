const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://hrms-lite-fullstack-cqgp.onrender.com"
)
  .toString()
  .trim()
  .replace(/\/+$/, "");

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
  const res = await fetch(`${API_URL}/employees`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function createEmployee(payload) {
  const res = await fetch(`${API_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  });
  if (!res.ok) throw new Error(await readError(res));
}

export async function markAttendance(employeeId, payload) {
  const res = await fetch(`${API_URL}/employees/${employeeId}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getAttendance(employeeId, date) {
  const url = new URL(`${API_URL}/employees/${employeeId}/attendance`);
  if (date) url.searchParams.set("date", date);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

export async function getDashboardSummary() {
  const res = await fetch(`${API_URL}/dashboard/summary`);
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}
