// src/components/NotificationsPanel.jsx — NEW FILE
// Bell dropdown used in both dashboards and Navbar.
// Fetches real notifications, marks as read on click.

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Check, Loader2, BellOff } from 'lucide-react'
import api from '../services/api'

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60)    return `${Math.floor(s)}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const TYPE_COLORS = {
  BookingApproved:  'bg-emerald-100 text-emerald-700',
  BookingRejected:  'bg-red-100 text-red-600',
  NewBooking:       'bg-blue-100 text-blue-700',
  NewEnquiry:       'bg-purple-100 text-purple-700',
  ListingApproved:  'bg-emerald-100 text-emerald-700',
  ListingRejected:  'bg-red-100 text-red-600',
  PaymentReceived:  'bg-yellow-100 text-yellow-700',
}

export default function NotificationsPanel() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const [loading,       setLoading]       = useState(false)
  const [page,          setPage]          = useState(1)
  const [hasMore,       setHasMore]       = useState(true)
  const panelRef = useRef(null)
  const PAGE_SIZE = 10

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.notifications.unreadCount()
        setUnread(res.Count)
      } catch {}
    }
    fetchCount()
    const id = setInterval(fetchCount, 30000)
    return () => clearInterval(id)
  }, [])

  // Fetch notifications when panel opens
  useEffect(() => {
    if (!open) return
    fetchNotifications(1, true)
  }, [open])

  const fetchNotifications = async (p = 1, reset = false) => {
    setLoading(true)
    try {
      const res = await api.notifications.getAll({ Page: p, PageSize: PAGE_SIZE })
      const list = Array.isArray(res) ? res : res.Items || res || []
      setNotifications(prev => reset ? list : [...prev, ...list])
      setHasMore(list.length === PAGE_SIZE)
      setPage(p)
    } catch (e) {
      console.error('Notifications fetch error:', e)
    } finally { setLoading(false) }
  }

  const markRead = async (notif) => {
    if (notif.Status === 'Read') return
    try {
      await api.notifications.markRead(notif.Id)
      setNotifications(prev =>
        prev.map(n => n.Id === notif.Id ? { ...n, Status: 'Read' } : n)
      )
      setUnread(c => Math.max(0, c - 1))
    } catch {}
  }

  const markAllRead = async () => {
    const unreadList = notifications.filter(n => n.Status !== 'Read')
    await Promise.allSettled(unreadList.map(n => api.notifications.markRead(n.Id)))
    setNotifications(prev => prev.map(n => ({ ...n, Status: 'Read' })))
    setUnread(0)
  }

  const archiveNotif = async (e, notif) => {
    e.stopPropagation()
    try {
      await api.notifications.archive(notif.Id)
      setNotifications(prev => prev.filter(n => n.Id !== notif.Id))
      if (notif.Status !== 'Read') setUnread(c => Math.max(0, c - 1))
    } catch {}
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-ink-500 hover:text-ink-800 transition-colors" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-10 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-cardHover border border-surface-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-ink-900">Notifications</h3>
                {unread > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[70vh] sm:max-h-[420px] overflow-y-auto divide-y divide-surface-100">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-ink-400">
                  <BellOff className="w-10 h-10 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.Id}
                    onClick={() => markRead(n)}
                    className={`w-full text-left px-5 py-4 hover:bg-surface-50 transition-colors flex items-start gap-3 relative group ${
                      n.Status !== 'Read' ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    {/* Unread dot */}
                    {n.Status !== 'Read' && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary-600" />
                    )}

                    {/* Type badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                      TYPE_COLORS[n.Type] || 'bg-surface-200 text-ink-500'
                    }`}>
                      {n.Type?.replace(/([A-Z])/g, ' $1').trim() || 'Info'}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 leading-tight">{n.Title}</p>
                      <p className="text-xs text-ink-500 mt-0.5 leading-relaxed line-clamp-2">{n.Message}</p>
                      <p className="text-xs text-ink-400 mt-1">{timeAgo(n.CreatedAtUtc)}</p>
                    </div>

                    {/* Archive */}
                    <button
                      onClick={e => archiveNotif(e, n)}
                      className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-ink-600 transition-all shrink-0 mt-0.5"
                      aria-label="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </button>
                ))
              )}
            </div>

            {/* Load more */}
            {hasMore && !loading && (
              <button
                onClick={() => fetchNotifications(page + 1)}
                className="w-full text-center text-sm text-primary-600 font-semibold py-3 border-t border-surface-100 hover:bg-surface-50 transition-colors"
              >
                Load more
              </button>
            )}
            {loading && notifications.length > 0 && (
              <div className="flex justify-center py-3 border-t border-surface-100">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
