// src/context/AuthContext.jsx — REPLACE ENTIRELY
// Fixed: role is now read from BOTH the API response AND localStorage on mount
// so page refreshes don't lose role info causing wrong dashboard.

import { createContext, useContext, useEffect, useState } from 'react'
import api, { tokenStore } from '../services/api'
import { normalizeRole } from '../lib/roles'

const AuthContext = createContext(null)

function authUserFrom(data, fallback = {}) {
  const user = data?.user || data?.User || data || {}
  return {
    Id: user.Id || user.UserId || data?.UserId || fallback.Id,
    FullName: user.FullName || user.fullName || data?.FullName || fallback.FullName,
    Email: user.Email || user.email || data?.Email || fallback.Email,
    Role: normalizeRole(user.Role || user.role || data?.Role || data?.role || fallback.Role),
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = tokenStore.get()
    if (auth?.accessToken) {
      // First set user from cache so role-based routing works immediately
      if (auth.user) setUser(authUserFrom(auth.user))
      // Then verify token is still valid with the server
      api.auth.me()
        .then(me => {
          // me = { Id, FullName, Email, Role } from GET /api/auth/me
          const normalizedUser = authUserFrom(me, auth.user)
          setUser(normalizedUser)
          // Keep cache in sync
          tokenStore.set({ ...auth, user: normalizedUser })
        })
        .catch(() => {
          // Token expired/invalid — clear and send to login
          tokenStore.clear()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await api.auth.login({ Email: email, Password: password })
    // data.Role comes directly from the API — trust it
    const me = authUserFrom(data)
    const auth = tokenStore.get()
    if (auth) tokenStore.set({ ...auth, user: me })
    setUser(me)
    return data
  }

  const register = async (body) => {
    const data = await api.auth.register(body)
    const me = authUserFrom(data, {
      FullName: body.FullName,
      Email: body.Email,
      Role: body.Role,
    })
    const auth = tokenStore.get()
    if (auth) tokenStore.set({ ...auth, user: me })
    setUser(me)
    return data
  }

  const logout = () => {
    api.auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
