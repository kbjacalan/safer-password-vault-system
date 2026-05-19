import { getToken } from "../../utils/api";

const API_BASE = "http://localhost:8080";

function adminHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// GET /api/admin/users — returns array of User objects
export async function fetchAllUsers() {
  const res = await fetch(`${API_BASE}/api/admin/users`, {
    headers: adminHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch users");
  return json;
}

// DELETE /api/admin/users/:id
export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete user");
  return json;
}
