import NotificationsPanel from '../components/NotificationsPanel'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, ShieldCheck, MessageSquare,
  BarChart2, CreditCard, Star, Plus, HelpCircle, LogOut,
  Search, Settings, ChevronRight, MoreVertical,
  CheckCircle2, Clock, AlertCircle, XCircle, Send,
  MapPin, BedDouble, Bath, Users, Eye, RefreshCw,
  TrendingUp, ArrowRight, X, Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'


function statusPill(status) {
  const map = {
    Published:           'bg-emerald-100 text-emerald-700',
    PendingVerification: 'bg-yellow-100 text-yellow-700',
    Draft:               'bg-surface-200 text-ink-500',
    Rejected:            'bg-red-100 text-red-600',
    Suspended:           'bg-orange-100 text-orange-700',
  }
  const label = {
    Published:           'Active',
    PendingVerification: 'Pending Verif.',
    Draft:               'Draft',
    Rejected:            'Rejected',
    Suspended:           'Suspended',
  }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || 'bg-surface-200 text-ink-500'}`}>
      {label[status] || status}
    </span>
  )
}

function fmt(n) { return Number(n || 0).toLocaleString() }

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)   return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}


function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(0)
  useEffect(() => {
    if (!targetDate) return
    const tick = () => setRemaining(Math.max(0, new Date(targetDate) - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])
  const h  = String(Math.floor(remaining / 3600000)).padStart(2, '0')
  const m  = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0')
  const s  = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  return { display: `${h} : ${m} : ${s}`, expired: remaining === 0 }
}


function LineChart({ data = [], color = '#1E3A8A', labels = [] }) {
  if (!data.length) return null
  const w = 300, h = 100
  const max = Math.max(...data, 1)
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - (v / max) * (h - 10),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ')
  const fill = `${d} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#lg)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={pts[i]?.[0]} y={h + 18} textAnchor="middle" fontSize="9" fill="#5B6271">{l}</text>
      ))}
    </svg>
  )
}

function BarChart({ data = [], color = '#1E3A8A', labels = [] }) {
  if (!data.length) return null
  const w = 300, h = 100
  const max = Math.max(...data, 1)
  const barW = w / data.length - 6
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full">
      {data.map((v, i) => {
        const barH = (v / max) * h
        const x = i * (w / data.length) + 3
        return (
          <g key={i}>
            <motion.rect
              x={x} y={h} width={barW} height={0} rx={3} fill={color}
              animate={{ y: h - barH, height: barH }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            />
            <text x={x + barW / 2} y={h + 18} textAnchor="middle" fontSize="9" fill="#5B6271">
              {labels[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}


const NAV = [
  { id: 'overview',      icon: LayoutDashboard, label: 'Dashboard'    },
  { id: 'properties',    icon: Building2,        label: 'Properties'   },
  { id: 'verification',  icon: ShieldCheck,      label: 'Verification' },
  { id: 'inquiries',     icon: MessageSquare,    label: 'Inquiries'    },
  { id: 'analytics',     icon: BarChart2,        label: 'Analytics'    },
  { id: 'payments',      icon: CreditCard,       label: 'Payments'     },
  { id: 'reviews',       icon: Star,             label: 'Reviews'      },
]

function Sidebar({ view, setView, inquiryCount, onLogout }) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-surface-200 flex flex-col py-5 px-3 overflow-y-auto">
      <Link to="/" className="px-3 mb-8 block">
        <span className="font-display font-extrabold text-lg text-primary-600">
          Home<span className="text-ink-900">Finder</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV.map(({ id, icon: Icon, label }) => {
          const active = view === id
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                active ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-surface-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-ink-400'}`} />
              {label}
              {id === 'inquiries' && inquiryCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {inquiryCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-surface-200 pt-4 mt-4 flex flex-col gap-1">
        <button
          onClick={() => setView('new-listing')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors w-full"
        >
          <Plus className="w-4 h-4" /> List New Property
        </button>
        <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-500 hover:bg-surface-100 transition-colors">
          <HelpCircle className="w-4 h-4" /> Help Center
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </aside>
  )
}


function OverviewView({ user, listings, enquiries, setView, onVerify }) {
  const active   = listings.filter(l => l.Status === 'Published').length
  const pending  = listings.filter(l => l.Status === 'PendingVerification').length
  const needsVerif = listings.find(l => l.Status === 'Draft' || l.Status === 'Rejected')
  // 48-hour deadline: 48h from now (real app would use the listing's updatedAt)
  const deadline   = needsVerif ? new Date(Date.now() + 23 * 3600 * 1000 + 59 * 60 * 1000 + 42 * 1000).toISOString() : null
  const { display: countdown } = useCountdown(deadline)

  const stats = [
    { label: 'TOTAL PROPERTIES', value: listings.length, note: '+2 this month', icon: Building2, color: 'bg-surface-100' },
    { label: 'ACTIVE LISTINGS',  value: active,           note: null,            icon: Eye,        color: 'bg-emerald-50'  },
    { label: 'PENDING VERIF.',   value: pending,          note: null,            icon: Clock,      color: 'bg-red-50'      },
    { label: 'TENANT INQUIRIES', value: enquiries.length, note: null,            icon: MessageSquare, color: 'bg-blue-50'  },
    { label: 'PROPERTY VIEWS',   value: '—',              note: null,            icon: TrendingUp, color: 'bg-purple-50'  },
  ]

  const recentListings = listings.slice(0, 3)
  const recentInquiries = enquiries.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink-900">
            Welcome back, {user?.FullName?.split(' ')[1] ? `Mr. ${user.FullName.split(' ')[1]}` : user?.FullName}
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Here is what's happening with your properties in Cameroon today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView('verification')}
            className="flex items-center gap-2 border-2 border-primary-600 text-primary-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-primary-50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" /> Verify Listings
          </button>
          <button
            onClick={() => setView('properties')}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Listings Hub
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`${s.color} rounded-xl2 p-4 border border-surface-200`}
          >
            {s.note && <p className="text-xs text-primary-600 font-semibold mb-1">{s.note}</p>}
            <p className="text-xs font-semibold tracking-wider text-ink-400">{s.label}</p>
            <p className="font-display font-extrabold text-2xl text-ink-900 mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* 48-hour verification banner */}
          {needsVerif && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-ink-900 rounded-xl2 p-6 text-white relative overflow-hidden"
            >
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                <ShieldCheck className="w-32 h-32" />
              </div>
              <p className="text-xs font-bold tracking-widest text-primary-400 mb-2 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> PRIORITY 48-HOUR VERIFICATION
              </p>
              <h3 className="font-display font-bold text-xl mb-1">
                Verify your "{needsVerif.Title}"
              </h3>
              <p className="text-sm text-surface-300 mb-5 max-w-sm">
                Unverified listings appear lower in search results. Submit for
                admin verification to publish your listing.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-white/10 rounded-lg px-4 py-2">
                  <p className="text-xs text-surface-300 mb-0.5">TIME REMAINING</p>
                  <p className="font-display font-bold text-xl tracking-widest">{countdown}</p>
                </div>
                <button
                  onClick={() => onVerify(needsVerif.Id)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Verify Now
                </button>
              </div>
            </motion.div>
          )}

          {/* Recent Listings table */}
          <div className="bg-white rounded-xl2 shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h2 className="font-display font-bold text-lg text-ink-900">Recent Listings</h2>
              <button onClick={() => setView('properties')} className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {recentListings.length === 0 ? (
              <div className="p-10 text-center text-ink-400 text-sm">
                No listings yet.{' '}
                <button onClick={() => setView('new-listing')} className="text-primary-600 font-medium hover:underline">
                  Create your first listing
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-100">
                    <th className="text-left px-5 py-3">PROPERTY</th>
                    <th className="text-left px-3 py-3">LOCATION</th>
                    <th className="text-left px-3 py-3">RENT (XAF)</th>
                    <th className="text-left px-3 py-3">STATUS</th>
                    <th className="px-3 py-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentListings.map((l) => (
                    <tr key={l.Id} className="border-b border-surface-50 hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900 leading-tight">{l.Title}</p>
                            <p className="text-xs text-ink-400">{l.Type}, {l.Bedrooms}B {l.Bathrooms}Ba</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-ink-500">{l.City}, {l.Region}</td>
                      <td className="px-3 py-4 font-semibold text-ink-900">{fmt(l.PricePerNight)}</td>
                      <td className="px-3 py-4">{statusPill(l.Status)}</td>
                      <td className="px-3 py-4 text-center">
                        <button className="text-ink-400 hover:text-ink-700 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl2 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink-900">Property Views</h3>
                <span className="text-xs text-ink-400">Last 7 Days</span>
              </div>
              <LineChart
                data={[120, 145, 132, 180, 210, 195, 240]}
                labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']}
                color="#1E3A8A"
              />
            </div>
            <div className="bg-white rounded-xl2 shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-ink-900">Inquiry Trends</h3>
                <span className="text-xs text-ink-400">Monthly</span>
              </div>
              <BarChart
                data={[8, 12, 10, 18, 25, 30]}
                labels={['Jan','Feb','Mar','Apr','May','Jun']}
                color="#0F1115"
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Recent Inquiries */}
          <div className="bg-white rounded-xl2 shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-surface-200">
              <h2 className="font-semibold text-ink-900">Recent Inquiries</h2>
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>
            </div>
            {recentInquiries.length === 0 ? (
              <p className="p-5 text-sm text-ink-400">No inquiries yet.</p>
            ) : (
              <div className="divide-y divide-surface-100">
                {recentInquiries.map((t) => (
                  <button
                    key={t.Id}
                    onClick={() => setView('inquiries')}
                    className="w-full flex items-start gap-3 p-4 hover:bg-surface-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {t.Subject?.[0] || 'T'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary-600 truncate">{t.Subject}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{timeAgo(t.LastMessageAtUtc)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setView('inquiries')}
              className="w-full text-center text-sm text-primary-600 font-semibold py-3 border-t border-surface-100 hover:bg-surface-50 transition-colors"
            >
              Manage All Inquiries
            </button>
          </div>

          {/* Reputation Score */}
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <h2 className="font-semibold text-ink-900 mb-4">Reputation Score</h2>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E7EAF1" strokeWidth="10" />
                  <motion.circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke="#1E3A8A" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - 0.92) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display font-extrabold text-2xl text-ink-900">9.2</p>
                  <p className="text-xs text-ink-400">EXCELLENT</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Average Rating', '4.8 / 5.0'],
                ['Response Rate',  '98%'      ],
                ['Verif. Level',   'Tier 3 (Top)'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-ink-500">{k}</span>
                  <span className="font-semibold text-ink-900">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Manager Support */}
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-ink-900">Manager Support</h3>
            </div>
            <p className="text-xs text-ink-500 mb-4 leading-relaxed">
              Need help verifying your listings or handling payments? Our dedicated manager support is available 24/7.
            </p>
            <button className="w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
              Chat with Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

//  Properties sub-view 
function PropertiesView({ listings, onVerify, onRefresh, loading }) {
  const [actionId, setActionId] = useState(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink-900">My Properties</h2>
          <p className="text-sm text-ink-500">{listings.length} total listings</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="border border-surface-200 rounded-xl px-3 py-2 text-sm text-ink-600 hover:border-primary-400 transition-colors flex items-center gap-1">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/listings/new" className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Listing
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-16 text-center">
          <Building2 className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="font-semibold text-ink-700">No listings yet</p>
          <p className="text-sm text-ink-400 mt-1">Create your first property listing to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-200">
                <th className="text-left px-5 py-3">PROPERTY</th>
                <th className="text-left px-3 py-3">LOCATION</th>
                <th className="text-left px-3 py-3">RENT / NIGHT (XAF)</th>
                <th className="text-left px-3 py-3">CAPACITY</th>
                <th className="text-left px-3 py-3">STATUS</th>
                <th className="px-3 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {listings.map((l) => (
                <tr key={l.Id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">{l.Title}</p>
                        <p className="text-xs text-ink-400 capitalize">{l.Type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-ink-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{l.City}, {l.Region}</span>
                  </td>
                  <td className="px-3 py-4 font-semibold">{fmt(l.PricePerNight)} {l.Currency}</td>
                  <td className="px-3 py-4 text-ink-500">
                    <span className="flex items-center gap-2 text-xs">
                      <BedDouble className="w-3.5 h-3.5" />{l.Bedrooms}
                      <Bath className="w-3.5 h-3.5" />{l.Bathrooms}
                      <Users className="w-3.5 h-3.5" />{l.MaxGuests}
                    </span>
                  </td>
                  <td className="px-3 py-4">{statusPill(l.Status)}</td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {(l.Status === 'Draft' || l.Status === 'Rejected') && (
                        <button
                          onClick={() => onVerify(l.Id)}
                          className="text-xs font-semibold text-primary-600 hover:underline"
                        >
                          Submit
                        </button>
                      )}
                      <Link
                        to={`/listings/${l.Id}`}
                        className="text-xs font-semibold text-ink-500 hover:text-ink-900"
                      >
                        View
                      </Link>
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

//  Verification sub-view 
function VerificationView({ listings, onVerify }) {
  const needsAction = listings.filter(l => ['Draft','Rejected'].includes(l.Status))
  const pending     = listings.filter(l => l.Status === 'PendingVerification')
  const verified    = listings.filter(l => l.Status === 'Published')

  const Section = ({ title, items, color, icon: Icon, action }) => (
    <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
      <div className={`px-5 py-3 border-b border-surface-200 flex items-center gap-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <span className="ml-auto text-xs font-bold text-ink-400">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-sm text-ink-400 text-center">None in this category.</p>
      ) : (
        <ul className="divide-y divide-surface-100">
          {items.map(l => (
            <li key={l.Id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink-900 truncate">{l.Title}</p>
                <p className="text-xs text-ink-400">{l.City}, {l.Region} · {l.Type}</p>
              </div>
              {statusPill(l.Status)}
              {action && (
                <button
                  onClick={() => onVerify(l.Id)}
                  className="text-sm font-semibold text-primary-600 hover:bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  Submit for Verification
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl text-ink-900">Verification</h2>
        <p className="text-sm text-ink-500 mt-0.5">Submit listings for admin review to publish them. Listings expire every 48 hours without re-verification.</p>
      </div>
      <div className="bg-primary-50 border border-primary-200 rounded-xl2 p-4 text-sm text-primary-800 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Once submitted, an admin will review your listing and approve or reject it, usually within a few hours. You'll receive a notification with the result.</span>
      </div>
      <Section title="Action Required"   items={needsAction} color="text-red-500"     icon={AlertCircle}  action={true}  />
      <Section title="Awaiting Review"   items={pending}     color="text-yellow-500"  icon={Clock}        action={false} />
      <Section title="Verified & Active" items={verified}    color="text-emerald-600" icon={CheckCircle2} action={false} />
    </div>
  )
}

//  Inquiries sub-view 
function InquiriesView({ enquiries, onRefresh }) {
  const [selected, setSelected]   = useState(null)  // full EnquiryThreadResponse
  const [thread,   setThread]     = useState(null)
  const [message,  setMessage]    = useState('')
  const [sending,  setSending]    = useState(false)
  const [loading,  setLoading]    = useState(false)
  const bottomRef = useRef(null)
  const { user } = useAuth()

  const openThread = useCallback(async (id) => {
    setSelected(id)
    setLoading(true)
    try {
      const t = await api.enquiries.getThread(id)
      setThread(t)
    } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.Messages])

  const sendReply = async () => {
    if (!message.trim() || !selected) return
    setSending(true)
    try {
      const updated = await api.enquiries.reply(selected, message.trim())
      setThread(updated)
      setMessage('')
    } catch { } finally { setSending(false) }
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-9rem)]">
      {/* Thread list */}
      <div className="w-72 shrink-0 bg-white rounded-xl2 shadow-card flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <h2 className="font-semibold text-ink-900">Inquiries</h2>
          <span className="text-xs text-ink-400">{enquiries.length} total</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
          {enquiries.length === 0 ? (
            <p className="p-6 text-sm text-ink-400 text-center">No inquiries yet.</p>
          ) : enquiries.map(t => (
            <button
              key={t.Id}
              onClick={() => openThread(t.Id)}
              className={`w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors ${selected === t.Id ? 'bg-primary-50 border-l-2 border-primary-600' : ''}`}
            >
              <p className="font-semibold text-sm text-ink-900 truncate">{t.Subject}</p>
              <p className="text-xs text-ink-400 mt-0.5">{timeAgo(t.LastMessageAtUtc)}</p>
              <span className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${
                t.Status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-200 text-ink-500'
              }`}>{t.Status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Message pane */}
      <div className="flex-1 bg-white rounded-xl2 shadow-card flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-ink-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select an inquiry to read messages</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          </div>
        ) : thread ? (
          <>
            {/* Thread header */}
            <div className="px-5 py-4 border-b border-surface-200">
              <p className="font-semibold text-ink-900">{thread.Subject}</p>
              <p className="text-xs text-ink-400 mt-0.5">Status: {thread.Status}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {thread.Messages?.map(msg => {
                const isMine = msg.SenderId === user?.Id
                return (
                  <div key={msg.Id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                      isMine
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-surface-100 text-ink-800 rounded-bl-sm'
                    }`}>
                      <p>{msg.Body}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-ink-400'}`}>
                        {timeAgo(msg.SentAtUtc)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            {thread.Status === 'Open' && (
              <div className="px-4 py-3 border-t border-surface-200 flex gap-2">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                  placeholder="Type a reply…"
                  className="flex-1 border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-400"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !message.trim()}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex items-center gap-1.5 text-sm font-semibold transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

//  Payments sub-view 
function PaymentsView({ listings }) {
  const [bookings,  setBookings]  = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const all = await Promise.all(
          listings.map(l =>
            api.bookings.forListing(l.Id)
              .then(bs => bs.map(b => ({ ...b, listingTitle: l.Title })))
              .catch(() => [])
          )
        )
        setBookings(all.flat())
      } finally { setLoading(false) }
    }
    if (listings.length) load()
    else setLoading(false)
  }, [listings])

  const bookingStatusPill = (s) => {
    const map = {
      Pending:   'bg-yellow-100 text-yellow-700',
      Approved:  'bg-emerald-100 text-emerald-700',
      Rejected:  'bg-red-100 text-red-600',
      Cancelled: 'bg-surface-200 text-ink-500',
    }
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[s] || 'bg-surface-200 text-ink-500'}`}>{s}</span>
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-ink-900 mb-6">Bookings & Payments</h2>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-16 text-center text-ink-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No bookings yet for your listings.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-200">
                <th className="text-left px-5 py-3">LISTING</th>
                <th className="text-left px-3 py-3">CHECK-IN</th>
                <th className="text-left px-3 py-3">CHECK-OUT</th>
                <th className="text-left px-3 py-3">GUESTS</th>
                <th className="text-left px-3 py-3">TOTAL</th>
                <th className="text-left px-3 py-3">STATUS</th>
                <th className="px-3 py-3">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {bookings.map(b => (
                <tr key={b.Id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-ink-900">{b.listingTitle}</td>
                  <td className="px-3 py-4 text-ink-500">{b.CheckIn}</td>
                  <td className="px-3 py-4 text-ink-500">{b.CheckOut}</td>
                  <td className="px-3 py-4 text-ink-500">{b.Guests}</td>
                  <td className="px-3 py-4 font-semibold">{fmt(b.TotalPrice)} {b.Currency}</td>
                  <td className="px-3 py-4">{bookingStatusPill(b.Status)}</td>
                  <td className="px-3 py-4">
                    {b.Status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => api.bookings.approve(b.Id)}
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >Approve</button>
                        <button
                          onClick={() => api.bookings.reject(b.Id)}
                          className="text-xs font-semibold text-red-500 hover:underline"
                        >Reject</button>
                      </div>
                    )}
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

//  Reviews sub-view 
function ReviewsView({ listings }) {
  const [allReviews, setAllReviews] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.all(
          listings.map(l =>
            api.reviews.getForListing(l.Id)
              .then(r => r.Reviews?.map(rv => ({ ...rv, listingTitle: l.Title })) || [])
              .catch(() => [])
          )
        )
        setAllReviews(results.flat())
      } finally { setLoading(false) }
    }
    if (listings.length) load()
    else setLoading(false)
  }, [listings])

  const avg = allReviews.length
    ? (allReviews.reduce((s, r) => s + r.Rating, 0) / allReviews.length).toFixed(1)
    : '—'

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink-900">Reviews</h2>
          <p className="text-sm text-ink-500">{allReviews.length} reviews across all listings</p>
        </div>
        {allReviews.length > 0 && (
          <div className="ml-auto flex items-center gap-1 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-display font-bold text-xl text-ink-900">{avg}</span>
            <span className="text-sm text-ink-400">avg</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : allReviews.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-16 text-center text-ink-400">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. They'll appear here once tenants review your listings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allReviews.map(r => (
            <div key={r.Id} className="bg-white rounded-xl2 shadow-card p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-semibold text-primary-600">{r.listingTitle}</p>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= r.Rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-ink-600 leading-relaxed">{r.Comment}</p>
              <p className="text-xs text-ink-400 mt-2">{timeAgo(r.CreatedAtUtc)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

//  Analytics sub-view 
function AnalyticsView({ listings }) {
  const byStatus = ['Published','PendingVerification','Draft','Rejected','Suspended'].map(s => ({
    label: s === 'Published' ? 'Active' : s === 'PendingVerification' ? 'Pending' : s,
    count: listings.filter(l => l.Status === s).length,
  })).filter(s => s.count > 0)

  const byType = [...new Set(listings.map(l => l.Type))].map(t => ({
    label: t, count: listings.filter(l => l.Type === t).length,
  }))

  return (
    <div className="space-y-6">
      <h2 className="font-display font-bold text-2xl text-ink-900">Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl2 shadow-card p-6">
          <h3 className="font-semibold text-ink-900 mb-4">Listings by Status</h3>
          {byStatus.length === 0 ? <p className="text-sm text-ink-400">No data yet.</p> : (
            <div className="space-y-3">
              {byStatus.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-600">{s.label}</span>
                    <span className="font-semibold text-ink-900">{s.count}</span>
                  </div>
                  <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / listings.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl2 shadow-card p-6">
          <h3 className="font-semibold text-ink-900 mb-4">Listings by Type</h3>
          {byType.length === 0 ? <p className="text-sm text-ink-400">No data yet.</p> : (
            <div className="space-y-3">
              {byType.map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-600">{s.label}</span>
                    <span className="font-semibold text-ink-900">{s.count}</span>
                  </div>
                  <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-ink-900 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.count / listings.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl2 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-900">Simulated Property Views</h3>
            <span className="text-xs text-ink-400">Last 7 days</span>
          </div>
          <LineChart data={[95,130,115,170,200,185,240]} labels={['Mon','Tue','Wed','Thu','Fri','Sat','Sun']} color="#1E3A8A" />
        </div>

        <div className="bg-white rounded-xl2 shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink-900">Inquiry Trends</h3>
            <span className="text-xs text-ink-400">Last 6 months</span>
          </div>
          <BarChart data={[5,9,7,14,20,28]} labels={['Jan','Feb','Mar','Apr','May','Jun']} color="#0F1115" />
        </div>
      </div>
    </div>
  )
}

//  New Listing sub-view 
function NewListingView({ onCreated }) {
  const TYPES = ['Apartment','Studio','House','Villa','Room','Commercial']
  const [form, setForm] = useState({
    Title:'', Description:'', Type:'Apartment', Address:'', City:'',
    Region:'', Country:'Cameroon', PricePerNight:'', Currency:'XAF',
    Bedrooms:1, Bathrooms:1, MaxGuests:2, Amenities:[],
  })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const AMENITIES = ['WiFi','Generator','Water Supply','Security','Parking','Balcony','Pool','Gym']

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleAmenity = (a) => set('Amenities', form.Amenities.includes(a)
    ? form.Amenities.filter(x => x !== a)
    : [...form.Amenities, a])

  const handleCreate = async () => {
    setError('')
    if (!form.Title || !form.City || !form.PricePerNight) {
      setError('Title, city and price are required.')
      return
    }
    setSaving(true)
    try {
      await api.listings.create({
        ...form,
        PricePerNight: Number(form.PricePerNight),
        Bedrooms: Number(form.Bedrooms),
        Bathrooms: Number(form.Bathrooms),
        MaxGuests: Number(form.MaxGuests),
      })
      setSuccess(true)
      setTimeout(() => onCreated(), 2000)
    } catch (e) {
      setError(e.response?.data?.Message || 'Failed to create listing.')
    } finally { setSaving(false) }
  }

  if (success) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <CheckCircle2 className="w-16 h-16 text-primary-600" />
      <h2 className="font-display font-bold text-2xl text-ink-900">Listing Created!</h2>
      <p className="text-ink-500 text-sm">Redirecting to your properties…</p>
    </div>
  )

  return (
    <div className="max-w-2xl">
      <h2 className="font-display font-bold text-2xl text-ink-900 mb-1">Create New Listing</h2>
      <p className="text-sm text-ink-500 mb-6">Fill in the details. You can submit for verification after creation.</p>

      <div className="bg-white rounded-xl2 shadow-card p-6 space-y-5">
        {[['Title','text','Property title','Title'],['Address','text','Street address','Address'],['City','text','e.g. Buea','City'],['Region','text','e.g. South West','Region']].map(([label,type,ph,key]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-ink-700 mb-1">{label}</label>
            <input type={type} placeholder={ph} value={form[key]} onChange={e => set(key, e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1">Description</label>
          <textarea rows={3} value={form.Description} onChange={e => set('Description', e.target.value)}
            className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Type</label>
            <select value={form.Type} onChange={e => set('Type', e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 bg-white">
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Price / Night (XAF)</label>
            <input type="number" value={form.PricePerNight} onChange={e => set('PricePerNight', e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Bedrooms</label>
            <input type="number" min="0" value={form.Bedrooms} onChange={e => set('Bedrooms', e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Bathrooms</label>
            <input type="number" min="0" value={form.Bathrooms} onChange={e => set('Bathrooms', e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Max Guests</label>
            <input type="number" min="1" value={form.MaxGuests} onChange={e => set('MaxGuests', e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map(a => (
              <button key={a} type="button" onClick={() => toggleAmenity(a)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  form.Amenities.includes(a)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-surface-200 text-ink-600 hover:border-primary-400'
                }`}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button onClick={handleCreate} disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Listing Draft'}
        </button>
        <p className="text-xs text-ink-400 text-center">After creation, go to Verification to submit for admin review.</p>
      </div>
    </div>
  )
}

//  Main export 
export default function LandlordDashboard() {
  const { user, logout } = useAuth()
  const [view,      setView]      = useState('overview')
  const [listings,  setListings]  = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const loadData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [l, e] = await Promise.all([
        api.listings.mine(),
        api.enquiries.mine(),
      ])
      setListings(l)
      setEnquiries(e)
    } catch (err) {
      showToast('Failed to load data. Please refresh.')
    } finally { setDataLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleVerify = async (id) => {
    try {
      await api.listings.submitForVerification(id)
      showToast('Listing submitted for verification!')
      loadData()
    } catch { showToast('Failed to submit. Please try again.') }
  }

  const openInquiries = enquiries.filter(e => e.Status === 'Open').length

  return (
    <div className="flex h-screen bg-surface-100 overflow-hidden">
      <Sidebar view={view} setView={setView} inquiryCount={openInquiries} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-2 bg-surface-50 w-64">
            <Search className="w-4 h-4 text-ink-400 shrink-0" />
            <input placeholder="Search inquiries or properties…" className="text-sm outline-none bg-transparent w-full placeholder:text-ink-300" />
          </div>
          <div className="flex items-center gap-4">
            <NotificationsPanel />
            <MessageSquare className="w-6 h-6 text-ink-500 cursor-pointer" onClick={() => setView('inquiries')} />
            <Settings className="w-6 h-6 text-ink-500 cursor-pointer" />
            <div className="flex items-center gap-2 pl-4 border-l border-surface-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-ink-900">{user?.FullName || '—'}</p>
                <p className="text-xs text-ink-400">{user?.Role || 'Landlord'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">
                {user?.FullName?.[0] || 'L'}
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {dataLoading && view === 'overview' ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {view === 'overview'     && <OverviewView     user={user} listings={listings} enquiries={enquiries} setView={setView} onVerify={handleVerify} />}
                {view === 'properties'   && <PropertiesView   listings={listings} onVerify={handleVerify} onRefresh={loadData} loading={dataLoading} />}
                {view === 'verification' && <VerificationView listings={listings} onVerify={handleVerify} />}
                {view === 'inquiries'    && <InquiriesView    enquiries={enquiries} onRefresh={loadData} />}
                {view === 'analytics'    && <AnalyticsView    listings={listings} />}
                {view === 'payments'     && <PaymentsView     listings={listings} />}
                {view === 'reviews'      && <ReviewsView      listings={listings} />}
                {view === 'new-listing'  && <NewListingView   onCreated={() => { loadData(); setView('properties') }} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-cardHover z-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-primary-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
