const API_BASE = import.meta.env.VITE_API_URL || '';

async function api(path, options = {}) {
  const token = localStorage.getItem('gov_token');
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.blockers = data.blockers;
    throw err;
  }
  return data;
}

export default api;
