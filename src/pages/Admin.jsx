
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Building2, Users, CreditCard,
  RefreshCw, Settings, HelpCircle, LogOut, Bell, Search,
  TrendingUp, TrendingDown, CheckCircle2, XCircle, MoreVertical,
  Download, Filter, ChevronLeft, ChevronRight, Loader2,
  ShieldAlert, AlertTriangle, BadgeCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getCollection, normalizeListing } from '../services/apiResponse'
import NotificationsPanel from '../components/NotificationsPanel'

//  Helpers 
function fmt(n) {
  const num = Number(n || 0)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000)    return `${(num / 1000).toFixed(1)}K`
  return num.toLocaleString()
}
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60)    return `${Math.floor(s)}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
function getRequestErrorMessage(error, fallback) {
  const status = error?.response?.status
  const message = error?.response?.data?.Message || error?.response?.data?.message || error?.message
  return status ? `${fallback} (${status}${message ? `: ${message}` : ''})` : fallback
}
function formatDate(value, fallback = '—') {
  if (!value) return fallback

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString()
}
function getFirstValidDate(...values) {
  return values.find(value => value && !Number.isNaN(new Date(value).getTime()))
}
function normalizeAdminUser(user = {}) {
  const id = user.Id || user.id || user.UserId || user.userId

  return {
    Id: id,
    FullName: user.FullName || user.fullName || user.Name || user.name || 'Unnamed user',
    Email: user.Email || user.email || 'No email',
    Role: user.Role || user.role || 'Unknown',
    Status: user.Status || user.status || 'Active',
    CreatedAtUtc: user.CreatedAtUtc || user.createdAtUtc || user.CreatedAt || user.createdAt || null,
  }
}

//  Sidebar nav ──
const NAV = [
  { id: 'overview',  icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'reports',   icon: FileText,        label: 'Reports'   },
  { id: 'listings',  icon: Building2,       label: 'Listings'  },
  { id: 'users',     icon: Users,           label: 'Users'     },
  { id: 'payments',  icon: CreditCard,      label: 'Payments'  },
  { id: 'refunds',   icon: RefreshCw,       label: 'Refunds'   },
  { id: 'settings',  icon: Settings,        label: 'Settings'  },
]

function Sidebar({ view, setView, onLogout }) {
  return (
    <aside className="w-52 shrink-0 bg-white border-r border-surface-200 flex flex-col py-5 px-3">
      <div className="px-3 mb-8">
        <p className="font-display font-extrabold text-base text-primary-600">
          Home<span className="text-ink-900">Finder</span>
        </p>
        <p className="text-xs text-ink-400 mt-0.5">Manager Portal</p>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ id, icon: Icon, label }) => {
          const active = view === id
          return (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                active ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-surface-100'
              }`}>
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-ink-400'}`} />
              {label}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-surface-200 pt-4 flex flex-col gap-1">
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-500 hover:bg-surface-100 transition-colors">
          <HelpCircle className="w-4 h-4" /> Help Center
        </button>
        <button onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </aside>
  )
}

//  Stat card 
function StatCard({ icon: Icon, iconBg, label, value, change, changeType, accent }) {
  const up = changeType === 'up'
  return (
    <div className={`bg-white rounded-xl2 shadow-card p-5 border ${accent ? 'border-red-200 bg-red-50' : 'border-surface-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
        {!change && <span className="text-xs font-bold text-ink-400">Stable</span>}
      </div>
      <p className="text-xs font-semibold tracking-wider text-ink-400">{label}</p>
      <p className="font-display font-extrabold text-2xl text-ink-900 mt-0.5">{value}</p>
    </div>
  )
}

//  Bar chart (SVG) ─
function BarChart({ data, labels }) {
  const max = Math.max(...data, 1)
  const W = 600, H = 140, barW = W / data.length - 8
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full">
      {data.map((v, i) => {
        const barH = (v / max) * H
        const x    = i * (W / data.length) + 4
        const pct  = v / max
        const fill = pct > 0.85 ? '#0F1115' : pct > 0.6 ? '#1E3A8A' : pct > 0.4 ? '#6EE7B7' : '#BFDBFE'
        return (
          <g key={i}>
            <motion.rect x={x} y={H} width={barW} height={0} rx={4} fill={fill}
              animate={{ y: H - barH, height: barH }}
              transition={{ duration: 0.7, delay: i * 0.05 }} />
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize="10" fill="#5B6271">
              {labels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

//  Overview view 
function OverviewView({ analytics, pendingListings, pendingListingsError, reports, reportsError, onApprove, onReject, onViewAll }) {
  const [chartPeriod, setChartPeriod] = useState('Month')

  // Derive stats from analytics response
  // analytics shape: { TotalUsers, TotalListings, TotalBookings, TotalReports,
  //   TotalReviews, AverageReviewRating, UsersByRole[], ListingsByStatus[],
  //   ListingsByType[], BookingsByStatus[], ReportsByStatus[] }
  const pendingCount = analytics?.ListingsByStatus?.find(s => s.Name === 'PendingVerification')?.Count || 0
  const openReports  = analytics?.ReportsByStatus?.find(s => s.Name === 'Open')?.Count || 0

  const stats = [
    { icon: Users,       iconBg: 'bg-ink-900',      label: 'TOTAL USERS',     value: fmt(analytics?.TotalUsers),    change: '+12%', changeType: 'up'   },
    { icon: Building2,   iconBg: 'bg-emerald-500',   label: 'ACTIVE LISTINGS', value: fmt(analytics?.TotalListings), change: '+5%',  changeType: 'up'   },
    { icon: ShieldAlert, iconBg: 'bg-blue-500',      label: 'PENDING APPR.',   value: pendingCount,                  change: `+${pendingCount}`, changeType: 'up', accent: pendingCount > 0 },
    { icon: AlertTriangle,iconBg:'bg-red-500',       label: 'OPEN REPORTS',    value: openReports,                   change: '-3%',  changeType: 'down' },
    { icon: CreditCard,  iconBg: 'bg-primary-600',   label: 'SUCCESS PAY',     value: fmt(analytics?.TotalBookings * 500), change: '+18%', changeType: 'up' },
    { icon: RefreshCw,   iconBg: 'bg-surface-400',   label: 'PEND. REFUNDS',   value: '—',                           change: null },
  ]

  // Chart data — derived from ListingsByStatus counts per month
  // Since the API doesn't have monthly breakdown, we use placeholder proportional data
  const chartData   = [320, 410, 380, 520, 610, 780, 920, 840, 760, 640, 510, 430]
  const chartLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Welcome back, Administrator!</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          Here's what's happening on the Home Finder marketplace today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Platform Growth chart */}
        <div className="lg:col-span-2 bg-white rounded-xl2 shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-ink-900">Platform Growth</h2>
            <div className="flex gap-1 border border-surface-200 rounded-lg overflow-hidden">
              {['Month','Year'].map(p => (
                <button key={p} onClick={() => setChartPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    chartPeriod === p ? 'bg-primary-600 text-white' : 'text-ink-500 hover:bg-surface-50'
                  }`}>{p}</button>
              ))}
            </div>
          </div>
          <BarChart data={chartData} labels={chartLabels} />
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl2 shadow-card p-5">
          <h2 className="font-display font-bold text-lg text-ink-900 mb-4">Recent Activity</h2>
          {reports.length === 0 ? (
            <p className="text-xs text-ink-400">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 3).map(r => {
                const statusColor = {
                  Open: 'bg-emerald-100 text-emerald-600',
                  InReview: 'bg-blue-100 text-blue-600',
                  Resolved: 'bg-ink-100 text-ink-600',
                  Dismissed: 'bg-red-100 text-red-600'
                }
                const statusIcon = {
                  Open: '🔍',
                  InReview: '⏳',
                  Resolved: '✓',
                  Dismissed: '✕'
                }
                return (
                  <div key={r.Id} className="flex items-start gap-3 pb-3 border-b border-surface-100 last:border-b-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${statusColor[r.Status] || 'bg-surface-100 text-ink-500'}`}>
                      {statusIcon[r.Status]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink-900">Report on {r.TargetType}</p>
                      <p className="text-xs text-ink-400 truncate">{r.Reason}</p>
                      <p className="text-[10px] text-ink-300 mt-0.5">{timeAgo(r.CreatedAtUtc)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending Moderation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-ink-900">Pending Moderation</h2>
          <button onClick={() => onViewAll('listings')}
            className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
            View All →
          </button>
        </div>
        {pendingListingsError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl2 shadow-card p-6 text-center text-red-600">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm font-semibold">Pending listings could not be loaded.</p>
            <p className="text-xs mt-1 text-red-500">{pendingListingsError}</p>
          </div>
        ) : pendingListings.length === 0 ? (
          <div className="bg-white rounded-xl2 shadow-card p-10 text-center text-ink-400">
            <BadgeCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No listings pending moderation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pendingListings.slice(0, 4).map(l => (
              <PendingListingCard key={l.Id} listing={l} onApprove={onApprove} onReject={onReject} />
            ))}
          </div>
        )}
      </div>

      {/* Reports Management table */}
      {reportsError ? (
        <div className="bg-white rounded-xl2 shadow-card p-6 text-sm text-ink-500">
          Reports are temporarily unavailable.
        </div>
      ) : <ReportsTable reports={reports} />}
    </div>
  )
}

//  Pending listing card ──
function PendingListingCard({ listing, onApprove, onReject }) {
  const [loading, setLoading] = useState(null) // 'approve' | 'reject' | null
  const photo = listing.PrimaryPhotoUrl

  const handle = async (action) => {
    setLoading(action)
    try { await (action === 'approve' ? onApprove(listing.Id) : onReject(listing.Id)) }
    finally { setLoading(null) }
  }

  return (
    <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
      <div className="relative h-36 bg-surface-200">
        {photo
          ? <img src={photo} alt={listing.Title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-surface-300" /></div>}
        <span className="absolute top-2 left-2 bg-ink-900 text-white text-[10px] font-bold px-2 py-0.5 rounded">NEW</span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-ink-900 text-sm leading-tight truncate">{listing.Title}</p>
        <p className="text-xs text-ink-400 mt-0.5">
          {Number(listing.PricePerNight).toLocaleString()} {listing.Currency}/mo · {listing.City}
        </p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => handle('approve')} disabled={!!loading}
            className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
            {loading === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Approve
          </button>
          <button onClick={() => handle('reject')} disabled={!!loading}
            className="w-9 h-8 flex items-center justify-center border-2 border-red-300 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-60">
            {loading === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

//  Reports table 
function ReportsTable({ reports }) {
  const [page,     setPage]     = useState(1)
  const [category, setCategory] = useState('All')
  const PAGE_SIZE = 10

  const statusPill = (s) => {
    const map = { Open:'bg-emerald-100 text-emerald-700', InReview:'bg-blue-100 text-blue-700', Resolved:'bg-surface-200 text-ink-500', Dismissed:'bg-red-100 text-red-500' }
    const label = { Open:'NEW', InReview:'INVESTIGATING', Resolved:'RESOLVED', Dismissed:'DISMISSED' }
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[s] || 'bg-surface-200 text-ink-500'}`}>{label[s] || s}</span>
  }

  const filtered = category === 'All' ? reports : reports.filter(r => r.Reason === category)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  return (
    <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
        <h2 className="font-display font-bold text-lg text-ink-900">Reports Management</h2>
        <div className="flex gap-2">
          <div className="relative group">
            <button className="flex items-center gap-2 border border-surface-200 rounded-lg px-3 py-1.5 text-sm text-ink-600 hover:border-primary-400 transition-colors">
              <Filter className="w-4 h-4" />
              {category !== 'All' ? category : 'All'}
              <ChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white border border-surface-200 rounded-lg shadow-cardHover z-10 w-44 hidden group-hover:block">
              {['All', 'Spam', 'Scam', 'Misleading', 'Inappropriate', 'Other'].map(cat => (
                <button key={cat} onClick={() => { setCategory(cat); setPage(1) }}
                  className={`w-full text-left px-4 py-2.5 text-sm border-b border-surface-100 last:border-b-0 transition-colors ${
                    category === cat ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-ink-600 hover:bg-surface-50'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button className="flex items-center gap-1.5 border border-surface-200 rounded-lg px-3 py-1.5 text-sm text-ink-600 hover:border-primary-400 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {paginated.length === 0 ? (
        <div className="py-12 text-center text-ink-400 text-sm">No reports found.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-50 text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-200">
              {['Report ID','Listing','Reporter','Category','Date','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {paginated.map((r, i) => (
              <tr key={r.Id} className="hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-ink-500">#REP-{r.Id.substring(0,4).toUpperCase()}</td>
                <td className="px-4 py-3 text-primary-600 font-medium">{r.TargetType} {r.TargetId?.substring(0,6)}</td>
                <td className="px-4 py-3 text-ink-600">{r.ReporterId?.substring(0,8)}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold uppercase bg-surface-200 text-ink-600 px-2 py-0.5 rounded">
                    {r.Reason}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-400 text-xs">{formatDate(r.CreatedAtUtc)}</td>
                <td className="px-4 py-3">{statusPill(r.Status)}</td>
                <td className="px-4 py-3">
                  <ReportActions report={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200">
        <p className="text-xs text-ink-400">
          Showing {Math.min((page-1)*PAGE_SIZE+1, filtered.length)}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </p>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
            className="px-3 py-1.5 border border-surface-200 rounded-lg text-sm text-ink-600 hover:border-primary-400 disabled:opacity-40 transition-colors">
            Previous
          </button>
          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => i+1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page===p ? 'bg-primary-600 text-white' : 'border border-surface-200 text-ink-600 hover:border-primary-400'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
            className="px-3 py-1.5 border border-surface-200 rounded-lg text-sm text-ink-600 hover:border-primary-400 disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

//  Report action menu ─
function ReportActions({ report }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const act = async (fn) => {
    setLoading(true); setOpen(false)
    try { await fn() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} disabled={loading}
        className="text-ink-400 hover:text-ink-700 transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.15 }}
            className="absolute right-0 bottom-6 bg-white border border-surface-200 rounded-xl shadow-cardHover w-44 py-1 z-20">
            <button onClick={() => act(() => api.admin.markReportInReview(report.Id))}
              className="w-full text-left px-4 py-2 text-sm text-ink-700 hover:bg-surface-50">Mark In Review</button>
            <button onClick={() => act(() => api.admin.resolveReport(report.Id, 'Resolved by admin'))}
              className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50">Resolve</button>
            <button onClick={() => act(() => api.admin.dismissReport(report.Id, 'Dismissed by admin'))}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

//  Listings view 
function ListingsView({ pendingListings, pendingListingsError, onApprove, onReject, onRefresh, loading }) {
  const [actionLoading, setActionLoading] = useState(null)

  const handle = async (id, action) => {
    setActionLoading({ id, action })
    try { await (action === 'approve' ? onApprove(id) : onReject(id)) }
    finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-ink-900">Pending Listings</h1>
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      ) : pendingListingsError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl2 shadow-card p-10 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p className="font-semibold text-red-700">Unable to load pending listings</p>
          <p className="text-xs text-red-500 mt-1">{pendingListingsError}</p>
          <button onClick={onRefresh}
            className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      ) : pendingListings.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-10 text-center">
          <BadgeCheck className="w-12 h-12 mx-auto mb-3 text-ink-300" />
          <p className="font-semibold text-ink-900">No pending listings</p>
          <p className="text-xs text-ink-400 mt-1">All listings have been verified. Great work!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-200">
                {['Photo', 'Title', 'City', 'Type', 'Price', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {pendingListings.map(l => (
                <tr key={l.Id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg bg-surface-200 overflow-hidden">
                      {l.PrimaryPhotoUrl ? (
                        <img src={l.PrimaryPhotoUrl} alt={l.Title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Building2 className="w-5 h-5 text-surface-300" /></div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink-900 truncate">{l.Title}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600 text-xs">{l.City}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold uppercase bg-surface-200 text-ink-600 px-2 py-1 rounded">
                      {l.PropertyType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary-600">
                    {Number(l.PricePerNight).toLocaleString()} {l.Currency}/mo
                  </td>
                  <td className="px-4 py-3 text-ink-400 text-xs">
                    {formatDate(getFirstValidDate(l.SubmittedAtUtc, l.CreatedAtUtc, l.UpdatedAtUtc, l.AvailableFrom))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handle(l.Id, 'approve')} disabled={!!actionLoading}
                        className="flex items-center gap-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        {actionLoading?.id === l.Id && actionLoading?.action === 'approve' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Approve
                      </button>
                      <button onClick={() => handle(l.Id, 'reject')} disabled={!!actionLoading}
                        className="flex items-center gap-1 border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-60 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        {actionLoading?.id === l.Id && actionLoading?.action === 'reject' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

//  Users view 
function UsersView() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [query,   setQuery]   = useState('')
  const [role,    setRole]    = useState('')
  const [page,    setPage]    = useState(1)
  const [roleDropdown, setRoleDropdown] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.listUsers({ Query: query||undefined, Role: role||undefined, Page: page, PageSize: 20 })
      setUsers(getCollection(res).map(normalizeAdminUser))
    } catch(e) { console.error(e) } finally { setLoading(false) }
  }, [query, role, page])

  useEffect(() => { load() }, [load])

  const handleSuspend = async (id) => {
    setActionLoading(id)
    try { await api.admin.suspendUser(id); load() } catch(e) { console.error(e) } finally { setActionLoading(null) }
  }
  const handleRestore = async (id) => {
    setActionLoading(id)
    try { await api.admin.restoreUser(id); load() } catch(e) { console.error(e) } finally { setActionLoading(null) }
  }
  const handleRole = async (id, newRole) => {
    setActionLoading(id)
    try { await api.admin.changeUserRole(id, newRole); setRoleDropdown(null); load() } catch(e) { console.error(e) } finally { setActionLoading(null) }
  }

  const ROLES = ['All', 'Renter', 'Student', 'Visitor', 'Landlord', 'HotelManager', 'Admin']
  const statusPill = (status) => {
    const isActive = status !== 'Suspended'
    return (
      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
      }`}>
        {isActive ? 'ACTIVE' : 'SUSPENDED'}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-4">Users</h1>
        <div className="flex gap-3 mb-4">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search users by name or email…"
            className="flex-1 border border-surface-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
          <div className="relative group">
            <button className="flex items-center gap-2 border border-surface-200 rounded-lg px-3 py-2 text-sm text-ink-600 hover:border-primary-400 transition-colors">
              {role || 'All Roles'}
              <ChevronRight className="w-3 h-3" />
            </button>
            <div className="absolute left-0 top-full mt-1 bg-white border border-surface-200 rounded-lg shadow-cardHover z-10 w-40 hidden group-hover:block">
              {ROLES.map(r => (
                <button key={r} onClick={() => { setRole(r === 'All' ? '' : r); setPage(1) }}
                  className={`w-full text-left px-4 py-2 text-sm border-b border-surface-100 last:border-b-0 transition-colors ${
                    ((r === 'All' && !role) || r === role) ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-ink-600 hover:bg-surface-50'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-10 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-ink-300" />
          <p className="font-semibold text-ink-900">No users found</p>
          <p className="text-xs text-ink-400 mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-200">
                {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {users.map((u, index) => {
                const isActive = u.Status !== 'Suspended'
                const joined = formatDate(u.CreatedAtUtc)
                const userKey = u.Id || `${u.Email}-${index}`
                return (
                  <tr key={userKey} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-ink-900">{u.FullName}</td>
                    <td className="px-4 py-3 text-ink-600 text-xs">{u.Email}</td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button onClick={() => setRoleDropdown(roleDropdown === u.Id ? null : u.Id)} disabled={actionLoading === u.Id}
                          className="text-xs font-bold uppercase bg-surface-100 text-ink-600 px-2 py-1 rounded border border-surface-200 hover:border-primary-400 transition-colors disabled:opacity-60">
                          {u.Role}
                        </button>
                        <AnimatePresence>
                          {roleDropdown === u.Id && (
                            <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.1 }}
                              className="absolute left-0 top-full mt-1 bg-white border border-surface-200 rounded-lg shadow-cardHover z-20 w-40">
                              {ROLES.filter(r => r !== 'All' && r !== u.Role).map(r => (
                                <button key={r} onClick={() => handleRole(u.Id, r)} disabled={actionLoading === u.Id}
                                  className="w-full text-left px-3 py-2 text-xs text-ink-600 hover:bg-primary-50 hover:text-primary-600 border-b border-surface-100 last:border-b-0 transition-colors disabled:opacity-60">
                                  {r}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                    <td className="px-4 py-3">{statusPill(u.Status)}</td>
                    <td className="px-4 py-3 text-ink-400 text-xs">{joined}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => isActive ? handleSuspend(u.Id) : handleRestore(u.Id)} disabled={actionLoading === u.Id}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
                          isActive
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                        }`}>
                        {actionLoading === u.Id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : isActive ? 'Suspend' : 'Restore'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

//  Payments view 
function PaymentsView() {
  const [paymentId, setPaymentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleMarkPaid = async () => {
    if (!paymentId.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const result = await api.admin.markPaymentPaid(paymentId)
      setMessage({ type: 'success', text: `Payment ${paymentId} marked as paid!` })
      setPaymentId('')
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to mark payment as paid: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Payments Management</h1>
        <p className="text-sm text-ink-500 mt-1">Mark individual payments as paid. Full payment listing requires backend development.</p>
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-xl2 shadow-card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Mark Payment as Paid</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5">Payment ID</label>
              <input value={paymentId} onChange={(e) => setPaymentId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleMarkPaid()}
                placeholder="e.g., PAY-12345"
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <button onClick={handleMarkPaid} disabled={loading || !paymentId.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Mark as Paid
            </button>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </motion.div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl2 p-4">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">ℹ️ Note:</span> The full payment list requires a backend endpoint (<code className="bg-blue-100 px-1 rounded text-[10px]">GET /api/admin/payments</code>). For now, use this form to mark individual payments as paid.
        </p>
      </div>
    </div>
  )
}

//  Refunds view ─
function RefundsView() {
  const [refundId, setRefundId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleCompleteRefund = async () => {
    if (!refundId.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const result = await api.admin.completeRefund(refundId)
      setMessage({ type: 'success', text: `Refund ${refundId} completed!` })
      setRefundId('')
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to complete refund: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Refunds Management</h1>
        <p className="text-sm text-ink-500 mt-1">Process refunds by ID. Full refund listing requires backend development.</p>
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-xl2 shadow-card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Complete Refund</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1.5">Refund ID</label>
              <input value={refundId} onChange={(e) => setRefundId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCompleteRefund()}
                placeholder="e.g., REF-98765"
                className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
            </div>
            <button onClick={handleCompleteRefund} disabled={loading || !refundId.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Complete Refund
            </button>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </motion.div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl2 p-4">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">ℹ️ Note:</span> The full refund list requires a backend endpoint (<code className="bg-blue-100 px-1 rounded text-[10px]">GET /api/admin/refunds</code>). For now, use this form to complete individual refunds.
        </p>
      </div>
    </div>
  )
}

//  Settings view 
function SettingsView({ user }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'All fields are required.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      await api.auth.confirmPasswordReset(currentPassword, newPassword)
      setMessage({ type: 'success', text: 'Password changed successfully!' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: `Failed: ${err.message}` })
    } finally {
      setLoading(false)
    }
  }

  const PasswordInput = ({ value, onChange, type, placeholder, show, onToggle }) => (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-surface-200 rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
      <button type="button" onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 text-sm">
        {show ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Manage your admin account preferences.</p>
      </div>

      {/* Admin Profile Card */}
      <div className="bg-white rounded-xl2 shadow-card p-6">
        <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Admin Profile
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase">Full Name</p>
            <p className="text-sm text-ink-900 font-medium mt-0.5">{user?.FullName || 'Administrator'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase">Email</p>
            <p className="text-sm text-ink-900 font-medium mt-0.5">{user?.Email || 'admin@homefinder.local'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase">Role</p>
            <p className="text-sm text-ink-900 font-medium mt-0.5 inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Master Admin</p>
          </div>
          <div className="border-t border-surface-100 pt-3 mt-3">
            <p className="text-xs text-ink-400">Admin settings are managed by your super admin. Contact them for profile changes.</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl2 shadow-card p-6">
        <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" /> Change Password
        </h2>
        <div className="space-y-3 max-w-sm">
          <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password"
            placeholder="Current Password" show={showPasswords.current} onToggle={() => setShowPasswords(p => ({ ...p, current: !p.current }))} />
          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password"
            placeholder="New Password" show={showPasswords.new} onToggle={() => setShowPasswords(p => ({ ...p, new: !p.new }))} />
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password"
            placeholder="Confirm Password" show={showPasswords.confirm} onToggle={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} />
          <button onClick={handleChangePassword} disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
          </button>
        </div>

        {message && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-3 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </motion.div>
        )}
      </div>
    </div>
  )
}

//  Main 
export default function Admin() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [view,            setView]           = useState('overview')
  const [analytics,       setAnalytics]      = useState(null)
  const [pendingListings, setPendingListings] = useState([])
  const [pendingListingsError, setPendingListingsError] = useState('')
  const [reports,         setReports]        = useState([])
  const [reportsError,    setReportsError]   = useState('')
  const [dataLoading,     setDataLoading]    = useState(true)
  const [toast,           setToast]          = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = useCallback(async () => {
    setDataLoading(true)
    setPendingListingsError('')
    setReportsError('')
    try {
      const [a, p, r] = await Promise.allSettled([
        api.admin.getDashboardAnalytics(),
        api.admin.listPendingListings({ Page: 1, PageSize: 20 }),
        api.admin.getReports({ Page: 1, PageSize: 42 }),
      ])
      if (a.status === 'fulfilled') setAnalytics(a.value)
      if (p.status === 'fulfilled') {
        setPendingListings(getCollection(p.value).map(normalizeListing))
      } else {
        setPendingListings([])
        setPendingListingsError(getRequestErrorMessage(p.reason, 'The moderation queue endpoint failed'))
      }
      if (r.status === 'fulfilled') {
        setReports(getCollection(r.value))
      } else {
        setReports([])
        setReportsError(getRequestErrorMessage(r.reason, 'The reports endpoint failed'))
      }
    } catch(e) { console.error('Admin data load error:', e) }
    finally { setDataLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleApprove = async (id) => {
    if (!id) {
      showToast('Cannot approve listing: listing ID is missing.')
      return
    }

    try {
      await api.admin.approveListing(id)
      setPendingListings(p => p.filter(l => l.Id !== id))
      showToast('Listing approved and published!')
    } catch(e) { showToast('Failed to approve listing.') }
  }

  const handleReject = async (id) => {
    if (!id) {
      showToast('Cannot reject listing: listing ID is missing.')
      return
    }

    try {
      await api.admin.rejectListing(id)
      setPendingListings(p => p.filter(l => l.Id !== id))
      showToast('Listing rejected.')
    } catch(e) { showToast('Failed to reject listing.') }
  }

  return (
    <div className="flex h-screen bg-surface-100 overflow-hidden">
      <Sidebar view={view} setView={setView} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="font-display font-bold text-xl text-ink-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-2 bg-surface-50 w-72">
              <Search className="w-4 h-4 text-ink-400 shrink-0" />
              <input placeholder="Search for users, listings, or reports…"
                className="text-sm outline-none bg-transparent w-full placeholder:text-ink-300" />
            </div>
            <NotificationsPanel />
            <div className="flex items-center gap-2 pl-4 border-l border-surface-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-900">{user?.FullName || 'Admin'}</p>
                <p className="text-xs text-ink-400 uppercase tracking-wide">Master Admin</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">
                {user?.FullName?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {dataLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={view}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                exit={{ opacity:0 }} transition={{ duration:0.2 }}>
                {view === 'overview'  && (
                  <OverviewView
                    analytics={analytics}
                    pendingListings={pendingListings}
                    pendingListingsError={pendingListingsError}
                    reports={reports}
                    reportsError={reportsError}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onViewAll={setView}
                  />
                )}
                {view === 'listings'  && <ListingsView pendingListings={pendingListings} pendingListingsError={pendingListingsError} onApprove={handleApprove} onReject={handleReject} onRefresh={loadData} loading={dataLoading} />}
                {view === 'reports'   && (reportsError ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl2 shadow-card p-10 text-center text-red-600">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
                    <p className="font-semibold">Unable to load reports</p>
                    <p className="text-xs mt-1">{reportsError}</p>
                  </div>
                ) : <ReportsTable reports={reports} />)}
                {view === 'users'     && <UsersView />}
                {view === 'payments'  && <PaymentsView />}
                {view === 'refunds'   && <RefundsView />}
                {view === 'settings'  && <SettingsView user={user} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-surface-200 px-6 py-3 flex items-center justify-between shrink-0 text-xs text-ink-400">
          <span>© 2026 Home Finder Inc. All rights reserved.</span>
          <div className="flex gap-4">
            {['Terms of Service','Privacy Policy','Contact Support'].map(l => (
              <Link key={l} to="#" className="hover:text-primary-600 transition-colors">{l}</Link>
            ))}
          </div>
        </footer>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-cardHover z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
