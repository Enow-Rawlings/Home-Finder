
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LandlordDashboard from './LandlordDashboard'
import SeekerDashboard from './SeekerDashboard'
import { isAdminRole, isLandlordRole, isSeekerRole, normalizeRole } from '../lib/roles'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAdminRole(user?.Role)) navigate('/admin', { replace: true })
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        <p className="text-sm text-ink-400">Loading your dashboard…</p>
      </div>
    )
  }

  if (!user) return null

  const role = normalizeRole(user.Role)

  if (isLandlordRole(role)) return <LandlordDashboard />
  if (!isSeekerRole(role)) console.warn('[Dashboard] Unknown role, using seeker dashboard:', role)
  return <SeekerDashboard />
}
