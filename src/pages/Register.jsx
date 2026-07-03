import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Phone, Lock, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const stats = [
  { value: '12k+', label: 'Listings' },
  { value: '98%',  label: 'Success'  },
  { value: '24h',  label: 'Response' },
]

const roles = [
  { label: 'House Seeker', api: 'Renter'   },
  { label: 'Landlord',     api: 'Landlord' },
]

function InputField({ label, icon: Icon, error, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-ink-700">{label}</label>
      )}
      <div className={`flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors focus-within:border-surface-200 focus-within:ring-0 ${
        error ? 'border-red-400 bg-red-50' : 'border-surface-200'
      }`}>
        {Icon && <Icon className="w-4 h-4 text-ink-400 mr-2.5 shrink-0" />}
        <input
          className="flex-1 text-sm outline-none bg-transparent text-ink-900 placeholder:text-ink-300 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function Register() {
  const navigate  = useNavigate()
  const { register } = useAuth()

  const [role, setRole] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [agreed,   setAgreed]   = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [showCf,   setShowCf]   = useState(false)
  const [errors,   setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading,  setLoading]  = useState(false)

  const validate = () => {
    const e = {}
    if (!fullName.trim())           e.fullName = 'Full name is required.'
    if (!email.includes('@'))       e.email    = 'Enter a valid email address.'
    if (password.length < 8)        e.password = 'Password must be at least 8 characters.'
    if (password !== confirm)       e.confirm  = 'Passwords do not match.'
    if (!agreed)                    e.agreed   = 'You must agree to the terms.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        FullName: fullName.trim(),
        Email:    email.trim(),
        Password: password,
        Role:     roles[role].api,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.Message || err.response?.data?.errors
      if (err.response?.status === 409) {
        setApiError('An account with this email already exists.')
      } else {
        setApiError(msg || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=1200&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <span className="text-xs font-bold tracking-widest bg-primary-600 text-white px-3 py-1 rounded-full w-fit mb-6">
            PREMIUM SERVICE
          </span>
          <h2 className="font-display font-extrabold text-4xl leading-tight mb-3">
            Home Finder
          </h2>
          <p className="text-surface-200 text-sm leading-relaxed max-w-sm mb-10">
            Join Cameroon's most trusted rental platform. Verified listings,
            direct landlord contact, no démarcheurs.
          </p>
          <div className="flex items-center gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display font-extrabold text-2xl text-primary-400">{s.value}</p>
                <p className="text-xs text-surface-300">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-cardHover p-8"
        >
          <h1 className="font-display font-bold text-3xl text-ink-900 mb-1">
            Create Your Account
          </h1>
          <p className="text-sm text-ink-500 mb-7">
            Join thousands of users finding their perfect home
          </p>

          {/* Role toggle */}
          <div className="mb-5">
            <p className="text-sm font-medium text-ink-700 mb-2">I am a:</p>
            <div className="flex rounded-xl overflow-hidden border-2 border-surface-200">
              {roles.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRole(i)}
                  className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                    role === i
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-ink-600 hover:bg-surface-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <InputField
              label="Full Name"
              icon={User}
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />

            <InputField
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <InputField
              label="Phone Number"
              icon={Phone}
              type="tel"
              placeholder="+237 6X XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            {/* Password row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink-700">Password</label>
                <div className={`flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors focus-within:border-surface-200 focus-within:ring-0 ${
                  errors.password ? 'border-red-400' : 'border-surface-200'
                }`}>
                  <Lock className="w-4 h-4 text-ink-400 mr-2 shrink-0" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-ink-300 w-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)} className="ml-1">
                    {showPw
                      ? <EyeOff className="w-3.5 h-3.5 text-ink-400" />
                      : <Eye className="w-3.5 h-3.5 text-ink-400" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-ink-700">Confirm Password</label>
                <div className={`flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors focus-within:border-surface-200 focus-within:ring-0 ${
                  errors.confirm ? 'border-red-400' : 'border-surface-200'
                }`}>
                  <RefreshCw className="w-4 h-4 text-ink-400 mr-2 shrink-0" />
                  <input
                    type={showCf ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="flex-1 text-sm outline-none bg-transparent placeholder:text-ink-300 w-0 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                  />
                  <button type="button" onClick={() => setShowCf(v => !v)} className="ml-1">
                    {showCf
                      ? <EyeOff className="w-3.5 h-3.5 text-ink-400" />
                      : <Eye className="w-3.5 h-3.5 text-ink-400" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-xs text-red-500">{errors.confirm}</p>}
              </div>
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-primary-600 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-ink-600 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-600 font-medium hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.agreed && <p className="text-xs text-red-500 mt-1">{errors.agreed}</p>}
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
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Creating Account…</>
                : 'Create Account'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-surface-200" />
              <span className="text-xs text-ink-400">or</span>
              <div className="flex-1 h-px bg-surface-200" />
            </div>

            <p className="text-center text-sm text-ink-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-bold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}