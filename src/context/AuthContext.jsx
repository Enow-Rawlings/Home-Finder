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
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const auth = tokenStore.get()

    if (!auth?.accessToken) {
      setLoading(false)
      return () => { cancelled = true }
    }

    api.auth.me()
      .then((me) => {
        if (cancelled) return

        const normalizedUser = authUserFrom(me, auth.user)
        setUser(normalizedUser)
        tokenStore.set({ ...auth, user: normalizedUser })
      })
      .catch((err) => {
        if (cancelled) return

        console.warn('Could not verify session with server. Please sign in again.', err.response?.status)
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const login = async (email, password) => {
    const data = await api.auth.login({ Email: email, Password: password })
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
