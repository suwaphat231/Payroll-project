import { AUTH_STORAGE_KEY } from "../constants";

const API_BASE = (
  process.env.REACT_APP_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");

function resolvePath(path) {
  if (!path) return API_BASE;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function getToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token || null;
  } catch {
    return null;
  }
}

async function request(
  path,
  { method = "GET", body, headers = {}, auth = true } = {},
) {
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  if (auth) {
    const token = getToken();
    if (token) {
      init.headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(resolvePath(path), init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function apiGet(path, options) {
  return request(path, { method: "GET", ...(options || {}) });
}

export function apiPost(path, body, options) {
  return request(path, { method: "POST", body, ...(options || {}) });
}

export function apiPut(path, body, options) {
  return request(path, { method: "PUT", body, ...(options || {}) });
}

export function apiDelete(path, options) {
  return request(path, { method: "DELETE", ...(options || {}) });
}
