
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isAdminRole } from '../lib/roles'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()

  const fallbackDestination = '/dashboard'
  const from = location.state?.from?.pathname || fallbackDestination

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)

  const validate = () => {
    const e = {}
    if (!email.includes('@')) e.email    = 'Enter a valid email address.'
    if (!password)            e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      const data = await login(email.trim(), password)
      const role = data?.Role || data?.role || data?.user?.Role || data?.user?.role
      const target = isAdminRole(role) ? '/admin' : from || fallbackDestination
      navigate(target, { replace: true })
    } catch (err) {
      const backendMessage = err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail
      if (err.response?.status === 401) {
        setApiError('Invalid email or password.')
      } else if (err.response?.status >= 500) {
        setApiError('The authentication service returned a server error. Please retry shortly or check the backend logs.')
      } else if (backendMessage) {
        setApiError(backendMessage)
      } else {
        setApiError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit() }

  return (
    <div className="min-h-screen flex">
      {/*  Left panel  */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <span className="text-xs font-bold tracking-widest bg-primary-600 text-white px-3 py-1 rounded-full w-fit mb-6">
            TRUSTED PLATFORM
          </span>
          <h2 className="font-display font-extrabold text-4xl leading-tight mb-3">
            Welcome Back
          </h2>
          <p className="text-surface-200 text-sm leading-relaxed max-w-sm mb-10">
            Access your verified listings, messages, and landlord contacts —
            all in one place.
          </p>
          <div className="flex items-center gap-10">
            {[['48h', 'Auto-expiry'], ['500 CFA', 'Unlock fee'], ['0', 'Middlemen']].map(([v, l]) => (
              <div key={l}>
                <p className="font-display font-extrabold text-2xl text-primary-400">{v}</p>
                <p className="text-xs text-surface-300">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/*  Right panel  */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-cardHover p-8"
        >
          {/* Logo mark */}
          <Link to="/" className="block mb-8">
            <span className="font-display font-extrabold text-xl text-primary-600">
              Home<span className="text-ink-900">Finder</span>
            </span>
          </Link>

          <h1 className="font-display font-bold text-3xl text-ink-900 mb-1">
            Sign In
          </h1>
          <p className="text-sm text-ink-500 mb-8">
            Welcome back — let's find your next home.
          </p>

          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-ink-700">Email Address</label>
              <div className={`flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors ${
                errors.email ? 'border-red-400' : 'border-surface-200 focus-within:border-primary-500'
              }`}>
                <Mail className="w-4 h-4 text-ink-400 mr-2.5 shrink-0" />
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({...p, email: ''})) }}
                  onKeyDown={handleKey}
                  className="flex-1 text-sm outline-none bg-transparent text-ink-900 placeholder:text-ink-300"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className={`flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors ${
                errors.password ? 'border-red-400' : 'border-surface-200 focus-within:border-primary-500'
              }`}>
                <Lock className="w-4 h-4 text-ink-400 mr-2.5 shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({...p, password: ''})) }}
                  onKeyDown={handleKey}
                  className="flex-1 text-sm outline-none bg-transparent placeholder:text-ink-300"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="ml-2">
                  {showPw
                    ? <EyeOff className="w-4 h-4 text-ink-400" />
                    : <Eye className="w-4 h-4 text-ink-400" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* API error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {apiError}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
                : 'Sign In'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-200" />
              <span className="text-xs text-ink-400">or</span>
              <div className="flex-1 h-px bg-surface-200" />
            </div>

            <p className="text-center text-sm text-ink-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
