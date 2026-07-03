
import axios from 'axios'

const getAuthData = (data = {}) => {
  const accessToken = data.AccessToken || data.accessToken || null
  const refreshToken = data.RefreshToken || data.refreshToken || null
  const user = data.user || data.User || {}

  return {
    accessToken,
    refreshToken,
    user: {
      Id: user.Id || user.UserId || data.UserId || null,
      FullName: user.FullName || user.fullName || data.FullName || null,
      Email: user.Email || user.email || data.Email || null,
      Role: user.Role || user.role || data.Role || data.role || null,
    },
  }
}


const rawBase = import.meta.env.VITE_API_URL?.trim()
const normalizedBase = rawBase ? rawBase.replace(/\/+$/, '') : ''
const BASE = normalizedBase
  ? (normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`)
  : '/api'

export const tokenStore = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem('hf_auth') || 'null')
    } catch (error) {
      localStorage.removeItem('hf_auth')
      return null
    }
  },
  set:   (data) => localStorage.setItem('hf_auth', JSON.stringify(data)),
  clear: ()     => localStorage.removeItem('hf_auth'),
}

const http = axios.create({
  baseURL: BASE,
})

//  Request interceptor 
http.interceptors.request.use((config) => {
  const auth = tokenStore.get()
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  // DEV LOGGING — remove before production
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '')
  return config
})

//  Response interceptor 
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
        const refreshToken = auth.refreshToken || auth.RefreshToken
        const refreshUrl = `${BASE}/auth/refresh`
        const { data } = await axios.post(refreshUrl, { RefreshToken: refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = getAuthData(data)
        const updated = { ...auth, accessToken, refreshToken: newRefreshToken }
        tokenStore.set(updated)
        http.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        flush(null, accessToken)
        if (orig.headers) orig.headers.Authorization = `Bearer ${accessToken}`
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

const normalizeEndpoint = (url) => url.startsWith('/') ? url.slice(1) : url
const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
)
const getEndpointUrl = (url) => {
  const endpoint = normalizeEndpoint(url)
  return BASE.startsWith('http') ? `${BASE}/${endpoint}` : `${BASE}/${endpoint}`
}
const jsonHeaders = { 'Content-Type': 'application/json' }
const get   = (url, params) => http.get(normalizeEndpoint(url), { params: cleanParams(params) }).then(r => r.data)
const post  = (url, body)   => http.post(normalizeEndpoint(url), body, { headers: jsonHeaders }).then(r => r.data)
const postEmpty = async (url) => {
  const headers = {}
  const auth = tokenStore.get()
  if (auth?.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`

  const response = await fetch(getEndpointUrl(url), {
    method: 'POST',
    headers,
  })

  const text = await response.text()
  const contentType = response.headers.get('content-type') || ''
  const data = text && contentType.includes('application/json') ? JSON.parse(text) : text || null

  if (!response.ok) {
    const error = new Error(data?.message || data?.Message || `Request failed with status ${response.status}`)
    error.response = { status: response.status, data }
    throw error
  }

  return data
}
const put   = (url, body)   => http.put(normalizeEndpoint(url), body, { headers: jsonHeaders }).then(r => r.data)
const patch = (url, body)   => http.patch(normalizeEndpoint(url), body, { headers: jsonHeaders }).then(r => r.data)
const del   = (url)         => http.delete(normalizeEndpoint(url)).then(r => r.data)
const postForm = (url, formData) => {
  return http.post(normalizeEndpoint(url), formData).then(r => r.data)
}

//  Auth 
const auth = {
  register: async (body) => {
    const data = await post('/auth/register', body)
    const { accessToken, refreshToken, user } = getAuthData(data)
    tokenStore.set({ accessToken, refreshToken, user })
    return data
  },
  login: async (body) => {
    const data = await post('/auth/login', body)
    const { accessToken, refreshToken, user } = getAuthData(data)
    tokenStore.set({ accessToken, refreshToken, user })
    return data
  },
  me: () => get('/auth/me'),
  refresh: (refreshToken) => post('/auth/refresh', { RefreshToken: refreshToken }),
  revokeRefresh: (refreshToken) => post('/auth/refresh/revoke', { RefreshToken: refreshToken }),
  requestEmailVerification: () => post('/auth/email-verification/request'),
  confirmEmailVerification: (token) => post('/auth/email-verification/confirm', { Token: token }),
  requestPasswordReset: (email) => post('/auth/password-reset/request', { Email: email }),
  confirmPasswordReset: (token, newPassword) => post('/auth/password-reset/confirm', { Token: token, NewPassword: newPassword }),
  logout: () => {
    const a = tokenStore.get()
    if (a?.refreshToken) post('/auth/refresh/revoke', { RefreshToken: a.refreshToken }).catch(() => {})
    tokenStore.clear()
    window.location.href = '/login'
  },
}

//  Listings 
const listings = {
  browse: async (params) => {
    try {
      return await get('/listings', params)
    } catch (error) {
      if (error?.response?.status === 400 && Object.keys(cleanParams(params)).length > 0) {
        return get('/listings')
      }
      throw error
    }
  },
  getById: (id) => get(`/listings/${id}`),
  mine: () => get('/listings/mine'),
  create: (body) => post('/listings', body),
  update: (id, body) => put(`/listings/${id}`, body),
  submitForVerification: (id) => postEmpty(`/listings/${id}/submit-for-verification`),
}

//  Search 
const search = {
  listings: (params) => get('/search/listings', params),
}

//  Photos 
const photos = {
  getAll: (listingId) => get(`/listings/${listingId}/photos`),
  upload: (listingId, { file, isPrimary = false, altText = '' }) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('isPrimary', String(Boolean(isPrimary)))
    if (altText) formData.append('altText', altText)

    return postForm(`/listings/${listingId}/photos`, formData)
  },
  setPrimary: (listingId, photoId) => post(`/listings/${listingId}/photos/${photoId}/primary`),
  delete: (listingId, photoId) => del(`/listings/${listingId}/photos/${photoId}`),
}
//  Reviews 
const reviews = {
  getForListing: (listingId) => get(`/listings/${listingId}/reviews`),
  create: (body) => post('/reviews', body),
}

//  Bookings 
const bookings = {
  mine: () => get('/bookings/mine'),
  forListing: (listingId) => get(`/listings/${listingId}/bookings`),
  request: (body) => post('/bookings', body),
  approve: (id) => postEmpty(`/bookings/${id}/approve`),
  reject: (id) => postEmpty(`/bookings/${id}/reject`),
  cancel: (id) => postEmpty(`/bookings/${id}/cancel`),
}

//  Payments 
const payments = {
  initiate: (bookingId) => post('/payments', { BookingId: bookingId }),
  requestRefund: (paymentId, reason) => post(`/payments/${paymentId}/refunds`, { Reason: reason }),
}

//  Enquiries 
const enquiries = {
  mine: () => get('/enquiries/mine'),
  getThread: (threadId) => get(`/enquiries/${threadId}`),
  start: (body) => post('/enquiries', body),
  reply: (threadId, message) => post(`/enquiries/${threadId}/messages`, { Message: message }),
  close: (threadId) => post(`/enquiries/${threadId}/close`),
}

//  Notifications 
const notifications = {
  getAll: (params) => get('/notifications', params),
  unreadCount: () => get('/notifications/unread-count'),
  markRead: (id) => postEmpty(`/notifications/${id}/mark-read`),
  archive: (id) => postEmpty(`/notifications/${id}/archive`),
}

//  Reports 
const reports = {
  create: (body) => post('/reports', body),
}

//  Admin 
const admin = {
  getDashboardAnalytics: () => get('/admin/analytics/dashboard'),
  listUsers: (params) => get('/admin/users', params),
  getUser: (id) => get(`/admin/users/${id}`),
  suspendUser: (id) => postEmpty(`/admin/users/${id}/suspend`),
  restoreUser: (id) => postEmpty(`/admin/users/${id}/restore`),
  changeUserRole: (id, role) => patch(`/admin/users/${id}/role`, { Role: role }),
  listPendingListings: (params) => get('/admin/listings/pending', params),
  approveListing: (id) => post(`/admin/listings/${id}/approve`, { Id: id }),
  rejectListing: (id) => post(`/admin/listings/${id}/reject`, { Id: id }),
  suspendListing: (id) => post(`/admin/listings/${id}/suspend`, { Id: id }),
  markPaymentPaid: (id) => postEmpty(`/admin/payments/${id}/mark-paid`),
  completeRefund: (id) => postEmpty(`/admin/refunds/${id}/complete`),
  getReports: (params) => get('/admin/reports', params),
  listReports: (params) => get('/admin/reports', params),
  markReportInReview: (id) => postEmpty(`/admin/reports/${id}/mark-in-review`),
  resolveReport: (id, note) => post(`/admin/reports/${id}/resolve`, { ResolutionNote: note }),
  dismissReport: (id, note) => post(`/admin/reports/${id}/dismiss`, { ResolutionNote: note }),
}

const api = { auth, listings, search, photos, reviews, bookings, payments, enquiries, notifications, reports, admin }
export default api
