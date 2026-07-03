// src/components/ProtectedRoute.jsx
// NEW FILE — wraps any route that requires authentication.
// Usage in App.jsx:
//   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//
// Optional role guard:
//   <Route path="/admin" element={<ProtectedRoute roles={['Admin']}><Admin /></ProtectedRoute>} />

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { normalizeRole } from '../lib/roles'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Still checking token on mount — show nothing (or a spinner)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      </div>
    )
  }

  // Not logged in → send to /login, preserving the intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but wrong role (e.g. non-admin hitting /admin)
  if (roles.length > 0 && !roles.includes(normalizeRole(user.Role))) {
    return <Navigate to="/" replace />
  }

  return children
}
