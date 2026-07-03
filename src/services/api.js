// src/services/api.js — REPLACE ENTIRELY
// Fixed: added request/response logging to debug API issues,
// better error handling, and correct token storage keys.

import axios from 'axios'

// Use `VITE_API_BASE` if provided. In dev, default to the Vite proxy (empty string)
// so requests to `/api/*` are proxied to the backend and avoid CORS preflight errors.
const BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '' : 'https://home-finder-api.onrender.com')

export const tokenStore = {
  get:   ()     => JSON.parse(localStorage.getItem('hf_auth') || 'null'),
  set:   (data) => localStorage.setItem('hf_auth', JSON.stringify(data)),
  clear: ()     => localStorage.removeItem('hf_auth'),
}

const http = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────────────────────
http.interceptors.request.use((config) => {
  const auth = tokenStore.get()
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  // DEV LOGGING — remove before production
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '')
  return config
})

// ── Response interceptor ─────────────────────────────────────────────────────
let isRefreshing = false
let queue = []
const flush = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = [] }

http.interceptors.response.use(
  (res) => {
    console.log(`[API] ✓ ${res.status} ${res.config.url}`, res.data)
    return res
  },
  async (error) => {
    const { config: orig, response } = error
    console.error(`[API] ✗ ${response?.status} ${orig?.url}`, response?.data)

    if (response?.status === 401 && !orig._retry) {
      const auth = tokenStore.get()
      if (!auth?.refreshToken) { tokenStore.clear(); window.location.href = '/login'; return Promise.reject(error) }

      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => { orig.headers.Authorization = `Bearer ${token}`; orig._retry = true; return http(orig) })
      }

      orig._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(`${BASE}/api/auth/refresh`, { RefreshToken: auth.refreshToken })
        const updated = { ...auth, accessToken: data.AccessToken, refreshToken: data.RefreshToken }
        tokenStore.set(updated)
        http.defaults.headers.common.Authorization = `Bearer ${data.AccessToken}`
        flush(null, data.AccessToken)
        orig.headers.Authorization = `Bearer ${data.AccessToken}`
        return http(orig)
      } catch (e) {
        flush(e, null)
        tokenStore.clear()
        window.location.href = '/login'
        return Promise.reject(e)
      } finally { isRefreshing = false }
    }
    return Promise.reject(error)
  }
)

const get   = (url, params) => http.get(url, { params }).then(r => r.data)
const post  = (url, body)   => http.post(url, body).then(r => r.data)
const put   = (url, body)   => http.put(url, body).then(r => r.data)
const patch = (url, body)   => http.patch(url, body).then(r => r.data)
const del   = (url)         => http.delete(url).then(r => r.data)

// ── Auth ─────────────────────────────────────────────────────────────────────
const auth = {
  register: async (body) => {
    const data = await post('/api/auth/register', body)
    tokenStore.set({ accessToken: data.AccessToken, refreshToken: data.RefreshToken, user: { Id: data.UserId, FullName: data.FullName, Email: data.Email, Role: data.Role } })
    return data
  },
  login: async (body) => {
    const data = await post('/api/auth/login', body)
    tokenStore.set({ accessToken: data.AccessToken, refreshToken: data.RefreshToken, user: { Id: data.UserId, FullName: data.FullName, Email: data.Email, Role: data.Role } })
    return data
  },
  me: () => get('/api/auth/me'),
  refresh: (refreshToken) => post('/api/auth/refresh', { RefreshToken: refreshToken }),
  revokeRefresh: (refreshToken) => post('/api/auth/refresh/revoke', { RefreshToken: refreshToken }),
  requestEmailVerification: () => post('/api/auth/email-verification/request'),
  confirmEmailVerification: (token) => post('/api/auth/email-verification/confirm', { Token: token }),
  requestPasswordReset: (email) => post('/api/auth/password-reset/request', { Email: email }),
  confirmPasswordReset: (token, newPassword) => post('/api/auth/password-reset/confirm', { Token: token, NewPassword: newPassword }),
  logout: () => {
    const a = tokenStore.get()
    if (a?.refreshToken) post('/api/auth/refresh/revoke', { RefreshToken: a.refreshToken }).catch(() => {})
    tokenStore.clear()
    window.location.href = '/login'
  },
}

// ── Listings ─────────────────────────────────────────────────────────────────
const listings = {
  browse: (params) => get('/api/listings', params),
  getById: (id) => get(`/api/listings/${id}`),
  mine: () => get('/api/listings/mine'),
  create: (body) => post('/api/listings', body),
  update: (id, body) => put(`/api/listings/${id}`, body),
  submitForVerification: (id) => post(`/api/listings/${id}/submit-for-verification`),
}

// ── Search ───────────────────────────────────────────────────────────────────
const search = {
  listings: (params) => get('/api/search/listings', params),
}

// ── Photos ───────────────────────────────────────────────────────────────────
const photos = {
  getAll: (listingId) => get(`/api/listings/${listingId}/photos`),
  upload: (listingId, formData) =>
    http.post(`/api/listings/${listingId}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  setPrimary: (listingId, photoId) => post(`/api/listings/${listingId}/photos/${photoId}/primary`),
  delete: (listingId, photoId) => del(`/api/listings/${listingId}/photos/${photoId}`),
}

// ── Reviews ──────────────────────────────────────────────────────────────────
const reviews = {
  getForListing: (listingId) => get(`/api/listings/${listingId}/reviews`),
  create: (body) => post('/api/reviews', body),
}

// ── Bookings ─────────────────────────────────────────────────────────────────
const bookings = {
  mine: () => get('/api/bookings/mine'),
  forListing: (listingId) => get(`/api/listings/${listingId}/bookings`),
  request: (body) => post('/api/bookings', body),
  approve: (id) => post(`/api/bookings/${id}/approve`),
  reject: (id) => post(`/api/bookings/${id}/reject`),
  cancel: (id) => post(`/api/bookings/${id}/cancel`),
}

// ── Payments ─────────────────────────────────────────────────────────────────
const payments = {
  initiate: (bookingId) => post('/api/payments', { BookingId: bookingId }),
  requestRefund: (paymentId, reason) => post(`/api/payments/${paymentId}/refunds`, { Reason: reason }),
}

// ── Enquiries ────────────────────────────────────────────────────────────────
const enquiries = {
  mine: () => get('/api/enquiries/mine'),
  getThread: (threadId) => get(`/api/enquiries/${threadId}`),
  start: (body) => post('/api/enquiries', body),
  reply: (threadId, message) => post(`/api/enquiries/${threadId}/messages`, { Message: message }),
  close: (threadId) => post(`/api/enquiries/${threadId}/close`),
}

// ── Notifications ────────────────────────────────────────────────────────────
const notifications = {
  getAll: (params) => get('/api/notifications', params),
  unreadCount: () => get('/api/notifications/unread-count'),
  markRead: (id) => post(`/api/notifications/${id}/mark-read`),
  archive: (id) => post(`/api/notifications/${id}/archive`),
}

// ── Reports ──────────────────────────────────────────────────────────────────
const reports = {
  create: (body) => post('/api/reports', body),
}

// ── Admin ────────────────────────────────────────────────────────────────────
const admin = {
  getDashboardAnalytics: () => get('/api/admin/analytics/dashboard'),
  listUsers: (params) => get('/api/admin/users', params),
  getUser: (id) => get(`/api/admin/users/${id}`),
  suspendUser: (id) => post(`/api/admin/users/${id}/suspend`),
  restoreUser: (id) => post(`/api/admin/users/${id}/restore`),
  changeUserRole: (id, role) => patch(`/api/admin/users/${id}/role`, { Role: role }),
  listPendingListings: (params) => get('/api/admin/listings/pending', params),
  approveListing: (id) => post(`/api/admin/listings/${id}/approve`),
  rejectListing: (id) => post(`/api/admin/listings/${id}/reject`),
  suspendListing: (id) => post(`/api/admin/listings/${id}/suspend`),
  markPaymentPaid: (id) => post(`/api/admin/payments/${id}/mark-paid`),
  completeRefund: (id) => post(`/api/admin/refunds/${id}/complete`),
  listReports: (params) => get('/api/admin/reports', params),
  markReportInReview: (id) => post(`/api/admin/reports/${id}/mark-in-review`),
  resolveReport: (id, note) => post(`/api/admin/reports/${id}/resolve`, { ResolutionNote: note }),
  dismissReport: (id, note) => post(`/api/admin/reports/${id}/dismiss`, { ResolutionNote: note }),
}

const api = { auth, listings, search, photos, reviews, bookings, payments, enquiries, notifications, reports, admin }
export default api