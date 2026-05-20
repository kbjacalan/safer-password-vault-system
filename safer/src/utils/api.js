const API_BASE = "http://localhost:8080";

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signup(data) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Signup failed");
  return json;
}

export async function signin(data) {
  const res = await fetch(`${API_BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Sign in failed");
  return json;
}

export function saveSession({ token, user }) {
  localStorage.setItem("safer_token", token);
  localStorage.setItem("safer_user", JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem("safer_token");
}

export function clearSession() {
  localStorage.removeItem("safer_token");
  localStorage.removeItem("safer_user");
}

// ── Vault ─────────────────────────────────────────────────────────────────────

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export async function fetchVaultEntries() {
  const res = await fetch(`${API_BASE}/api/vault`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch vault");
  return json;
}

export async function createVaultEntry(data) {
  const res = await fetch(`${API_BASE}/api/vault`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to save entry");
  return json;
}

export async function deleteVaultEntry(id) {
  const res = await fetch(`${API_BASE}/api/vault/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete entry");
  return json;
}

export async function toggleFavorite(id) {
  const res = await fetch(`${API_BASE}/api/vault/${id}/favorite`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update favorite");
  return json;
}

export async function updateVaultPassword(id, { password, strength_score }) {
  const res = await fetch(`${API_BASE}/api/vault/${id}/password`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ password, strength_score }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update password");
  return json;
}

export async function fetchTrashedEntries() {
  const res = await fetch(`${API_BASE}/api/vault/trash`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to fetch trash");
  return json;
}

export async function restoreVaultEntry(id) {
  const res = await fetch(`${API_BASE}/api/vault/${id}/restore`, {
    method: "PATCH",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to restore entry");
  return json;
}

export async function purgeVaultEntry(id) {
  const res = await fetch(`${API_BASE}/api/vault/${id}/purge`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to purge entry");
  return json;
}
