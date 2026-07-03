// src/lib/apiClient.js
// Minimal fetch wrapper for the app. Respects Vite env `VITE_API_BASE_URL`.

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '/api'

function getAuthToken() {
  try {
    const raw = localStorage.getItem('hf_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.accessToken || parsed?.AccessToken || null
  } catch (e) {
    return null
  }
}

async function request(path, options = {}) {
  const token = getAuthToken()
  const url = path.startsWith('/') ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.message || body.error || body.detail || `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    err.body = body
    throw err
  }

  if (res.status === 204) return null
  return res.json()
}

export const apiClient = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
