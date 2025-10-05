// frontend/src/services/api.js
export async function apiGet(path) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
