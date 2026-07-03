

import NotificationsPanel from '../components/NotificationsPanel'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Building2, MessageSquare, BarChart2,
  CreditCard, Settings, HelpCircle, LogOut, Plus,
  Search, Heart, Eye, MapPin, BedDouble, Bath,
  Ruler, BadgeCheck, Star, X, ChevronRight, Send,
  Loader2, UserCircle, BookOpen, ArrowRight, Bookmark,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getCollection, normalizeListing } from '../services/apiResponse'

// Helpers 
function fmt(n) { return Number(n || 0).toLocaleString() }
function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60)    return `${Math.floor(s)}s ago`
  if (s < 3600)  return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

//  Listing card 
function ListingCard({ listing, badge, onSave, saved }) {
  const photo = listing.PrimaryPhotoUrl || listing.Photos?.[0]?.Url
  const location = [listing.City, listing.Region].filter(Boolean).join(', ')
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow overflow-hidden group"
    >
      <div className="relative h-44 overflow-hidden bg-surface-200">
        {photo
          ? <img src={photo} alt={listing.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-surface-300" /></div>}
        {badge && (
          <span className={`absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
            badge === 'VERIFIED' ? 'bg-primary-600 text-white' : 'bg-yellow-400 text-ink-900'
          }`}>
            {badge === 'VERIFIED' ? <BadgeCheck className="w-3 h-3" /> : <Star className="w-3 h-3" />}
            {badge}
          </span>
        )}
        <button
          onClick={() => onSave?.(listing.Id)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-primary-600 text-primary-600' : 'text-ink-600'}`} />
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-ink-900 text-sm leading-tight">{listing.Title}</h3>
          <span className="font-bold text-primary-600 text-sm whitespace-nowrap shrink-0">
            {fmt(listing.PricePerNight)} <span className="text-xs font-normal text-ink-400">{listing.Currency || 'CFA'}/mo</span>
          </span>
        </div>
        <p className="text-xs text-ink-500 flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3" /> {location || listing.Country || 'Location unavailable'}
        </p>
        <div className="flex items-center gap-3 text-xs text-ink-400 pt-3 border-t border-surface-100 mb-3">
          {listing.Bedrooms !== undefined && (
            <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{listing.Bedrooms} Beds</span>
          )}
          {listing.Bathrooms !== undefined && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{listing.Bathrooms} Baths</span>
          )}
          {listing.Type && (
            <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{listing.Type}</span>
          )}
        </div>
        <Link
          to={`/listings/${listing.Id}`}
          className="block w-full text-center border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-semibold py-2 rounded-xl text-xs transition-colors"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  )
}

//  Sidebar 
const NAV = [
  { id: 'overview',   icon: LayoutDashboard, label: 'Dashboard'  },
  { id: 'properties', icon: Building2,       label: 'Browse Homes' },
  { id: 'inquiries',  icon: MessageSquare,   label: 'Inquiries'  },
  { id: 'analytics',  icon: BarChart2,       label: 'Analytics'  },
  { id: 'payments',   icon: CreditCard,      label: 'Payments'   },
]

function Sidebar({ view, setView, msgCount, onLogout }) {
  return (
    <aside className="w-52 shrink-0 bg-white border-r border-surface-200 flex flex-col py-5 px-3 overflow-y-auto">
      <div className="px-3 mb-1">
        <Link to="/" className="block">
          <span className="font-display font-extrabold text-base text-primary-600">
            Home<span className="text-ink-900">Finder</span>
          </span>
        </Link>
        <p className="text-xs text-ink-400 mt-0.5">Manager Portal</p>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1 mt-6">
        {NAV.map(({ id, icon: Icon, label }) => {
          const active = view === id
          return (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                active ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-surface-100'
              }`}>
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-ink-400'}`} />
              {label}
              {id === 'inquiries' && msgCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {msgCount}
                </span>
              )}
            </button>
          )
        })}

        <div className="mt-4 mb-1 px-3">
          <p className="text-xs font-semibold tracking-widest text-ink-400">ACCOUNT</p>
        </div>
        <button onClick={() => setView('profile')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
            view === 'profile' ? 'bg-primary-600 text-white' : 'text-ink-600 hover:bg-surface-100'
          }`}>
          <Settings className={`w-4 h-4 ${view === 'profile' ? 'text-white' : 'text-ink-400'}`} />
          Profile Settings
        </button>
      </nav>

      <div className="border-t border-surface-200 pt-4 mt-2 flex flex-col gap-1">
        <button onClick={() => setView('properties')}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors w-full">
          <Search className="w-4 h-4" /> Browse Homes
        </button>
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

//  Overview sub-view 
function OverviewView({ user, listings, enquiries, bookings, setView, saved, onSave }) {
  const firstName = user?.FullName?.split(' ')[0] || 'there'
  const recommended = listings.slice(0, 3)
  const recentSearches = ['Buea Apartments', 'Studio', '50K - 150K', 'Furnished']
  const [searches, setSearches] = useState(recentSearches)

  const stats = [
    { icon: Heart,        label: 'Saved Listings',   value: saved.size },
    { icon: Eye,          label: 'Recently Viewed',  value: listings.length },
    { icon: MessageSquare,label: 'New Messages',      value: enquiries.filter(e => e.Status === 'Open').length },
    { icon: CreditCard,   label: 'Pending Payments', value: bookings.filter(b => b.PaymentStatus === 'Unpaid').length },
  ]

  const quickActions = [
    { icon: Search,      label: 'Browse Properties',      action: () => setView('properties') },
    { icon: Bookmark,    label: 'Saved Listings',         action: () => setView('properties') },
    { icon: CreditCard,  label: 'Pay to Contact Landlord',action: () => setView('payments')   },
    { icon: UserCircle,  label: 'Update Profile',         action: () => setView('profile')    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative bg-gradient-to-r from-primary-50 to-surface-100 rounded-xl2 border border-surface-200 overflow-hidden">
        <div className="p-8 max-w-xl">
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-sm text-ink-500 leading-relaxed mb-6">
            Find your perfect home with ease. We've curated{' '}
            <span className="font-semibold text-primary-600">{listings.length} listings</span>{' '}
            matching your preferences.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={() => setView('properties')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
              Explore Listings
            </button>
            <button onClick={() => setView('properties')}
              className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
              View Saved
            </button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-56 hidden lg:flex items-center justify-center opacity-80">
          <div className="w-40 h-40 rounded-full bg-primary-100 flex items-center justify-center">
            <Building2 className="w-20 h-20 text-primary-300" />
          </div>
        </div>
      </div>

      {/* Stats + Recent Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-xl2 shadow-card p-4 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-display font-extrabold text-2xl text-ink-900">{s.value}</p>
                <p className="text-xs text-ink-400 mt-0.5">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Searches */}
        <div className="bg-white rounded-xl2 shadow-card p-5">
          <h3 className="font-semibold text-ink-900 mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searches.map(s => (
              <span key={s}
                className="flex items-center gap-1.5 text-xs font-medium bg-surface-100 text-ink-600 px-3 py-1.5 rounded-full border border-surface-200">
                {s}
                <button onClick={() => setSearches(p => p.filter(x => x !== s))}>
                  <X className="w-3 h-3 text-ink-400 hover:text-red-500" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended For You */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-ink-900">Recommended For You</h2>
          <button onClick={() => setView('properties')}
            className="text-sm text-primary-600 font-semibold hover:underline flex items-center gap-1">
            View All Listings <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {recommended.length === 0 ? (
          <div className="bg-white rounded-xl2 shadow-card p-12 text-center text-ink-400">
            <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No listings yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommended.map((l, i) => (
              <ListingCard
                key={l.Id}
                listing={l}
                badge={l.Status === 'Published' ? 'VERIFIED' : 'NEW LISTING'}
                saved={saved.has(l.Id)}
                onSave={onSave}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(a => (
            <button key={a.label} onClick={a.action}
              className="bg-white rounded-xl2 shadow-card p-5 flex items-center gap-3 hover:shadow-cardHover hover:border-primary-200 border border-transparent transition-all text-left">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <a.icon className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-sm font-semibold text-ink-900 leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

//  Properties sub-view 
function PropertiesView({ listings, loading, saved, onSave, onSearch }) {
  const [tab, setTab] = useState('all')
  const [query,    setQuery]    = useState('')
  const [city,     setCity]     = useState('')
  const [type,     setType]     = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [searching, setSearching] = useState(false)
  const [results,  setResults]  = useState(null)

  const handleSearch = async () => {
    if (!query && !city && !type && !minPrice && !maxPrice) return
    setSearching(true)
    try {
      const res = await api.search.listings({
        Query: query || undefined,
        City: city || undefined,
        Type: type || undefined,
        MinPrice: minPrice || undefined,
        MaxPrice: maxPrice || undefined,
        Page: 1, PageSize: 20,
      })
      setResults(getCollection(res).map(normalizeListing))
    } catch { } finally { setSearching(false) }
  }

  const display = results !== null
    ? results
    : tab === 'saved'
      ? listings.filter(l => saved.has(l.Id))
      : listings

  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-ink-900 mb-5">Browse Properties</h2>

      {/* Search bar */}
      <div className="bg-white rounded-xl2 shadow-card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-2 flex-1 focus-within:border-primary-400 transition-colors">
          <Search className="w-4 h-4 text-ink-400 shrink-0" />
          <input value={query} onChange={e => { setQuery(e.target.value); setResults(null) }}
            placeholder="Search by location, type, or price…"
            className="text-sm outline-none w-full placeholder:text-ink-300" />
        </div>
        <input value={city} onChange={e => setCity(e.target.value)}
          placeholder="City" className="border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-400 w-32" />
        <select value={type} onChange={e => setType(e.target.value)}
          className="border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-400 bg-white">
          <option value="">Any Type</option>
          {['Apartment','Studio','House','Villa','Room','Commercial'].map(t => <option key={t}>{t}</option>)}
        </select>
        <input value={minPrice} onChange={e => setMinPrice(e.target.value)}
          placeholder="Min Price" type="number"
          className="border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-400 w-28" />
        <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
          placeholder="Max Price" type="number"
          className="border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-400 w-28" />
        <button onClick={handleSearch} disabled={searching}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Tabs */}
      {results === null && (
        <div className="flex gap-2 mb-5">
          {[['all','All Listings'],['saved','Saved']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                tab === t ? 'bg-primary-600 text-white' : 'bg-white text-ink-600 border border-surface-200 hover:border-primary-400'
              }`}>
              {l}
            </button>
          ))}
        </div>
      )}
      {results !== null && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-500">{results.length} results found</p>
          <button onClick={() => setResults(null)} className="text-sm text-primary-600 hover:underline">Clear search</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : display.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-16 text-center text-ink-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{tab === 'saved' ? 'No saved listings yet.' : 'No listings found.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {display.map(l => (
            <ListingCard key={l.Id} listing={l} badge={l.Status === 'Published' ? 'VERIFIED' : null} saved={saved.has(l.Id)} onSave={onSave} />
          ))}
        </div>
      )}
    </div>
  )
}

//  Inquiries sub-view 
function InquiriesView({ enquiries }) {
  const { user } = useAuth()
  const [selected, setSelected] = useState(null)
  const [thread,   setThread]   = useState(null)
  const [message,  setMessage]  = useState('')
  const [sending,  setSending]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const bottomRef = useRef(null)

  const openThread = useCallback(async (id) => {
    setSelected(id)
    setLoading(true)
    try { setThread(await api.enquiries.getThread(id)) }
    catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread?.Messages])

  const sendReply = async () => {
    if (!message.trim() || !selected) return
    setSending(true)
    try { setThread(await api.enquiries.reply(selected, message.trim())); setMessage('') }
    catch { } finally { setSending(false) }
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-ink-900 mb-5">My Inquiries</h2>
      <div className="flex gap-5 h-[calc(100vh-13rem)]">
        {/* Thread list */}
        <div className="w-72 shrink-0 bg-white rounded-xl2 shadow-card flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-200 flex items-center justify-between">
            <p className="font-semibold text-ink-900 text-sm">Threads</p>
            <span className="text-xs text-ink-400">{enquiries.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-surface-100">
            {enquiries.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                <p className="text-sm text-ink-400">No inquiries yet.</p>
                <p className="text-xs text-ink-300 mt-1">Start one from a listing page.</p>
              </div>
            ) : enquiries.map(t => (
              <button key={t.Id} onClick={() => openThread(t.Id)}
                className={`w-full text-left px-4 py-3 hover:bg-surface-50 transition-colors ${selected === t.Id ? 'bg-primary-50 border-l-2 border-primary-600' : ''}`}>
                <p className="text-sm font-semibold text-ink-900 truncate">{t.Subject}</p>
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
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Select an inquiry to view messages</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : thread ? (
            <>
              <div className="px-5 py-4 border-b border-surface-200">
                <p className="font-semibold text-ink-900">{thread.Subject}</p>
                <p className="text-xs text-ink-400 mt-0.5">Status: {thread.Status}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {thread.Messages?.map(msg => {
                  const mine = msg.SenderId === user?.Id
                  return (
                    <div key={msg.Id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                        mine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-surface-100 text-ink-800 rounded-bl-sm'
                      }`}>
                        <p>{msg.Body}</p>
                        <p className={`text-xs mt-1 ${mine ? 'text-primary-200' : 'text-ink-400'}`}>{timeAgo(msg.SentAtUtc)}</p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              {thread.Status === 'Open' && (
                <div className="px-4 py-3 border-t border-surface-200 flex gap-2">
                  <input value={message} onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Type a message…"
                    className="flex-1 border border-surface-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-400" />
                  <button onClick={sendReply} disabled={sending || !message.trim()}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex items-center gap-1 text-sm font-semibold transition-colors">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

//  Payments sub-view 
function PaymentsView({ bookings, loading }) {
  const pill = (s) => {
    const map = { Pending:'bg-yellow-100 text-yellow-700', Approved:'bg-emerald-100 text-emerald-700', Rejected:'bg-red-100 text-red-600', Cancelled:'bg-surface-200 text-ink-500' }
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[s] || 'bg-surface-200 text-ink-500'}`}>{s}</span>
  }
  const payPill = (s) => {
    const map = { Unpaid:'bg-orange-100 text-orange-700', Paid:'bg-emerald-100 text-emerald-700', Refunded:'bg-blue-100 text-blue-700' }
    return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[s] || 'bg-surface-200 text-ink-500'}`}>{s}</span>
  }

  return (
    <div>
      <h2 className="font-display font-bold text-2xl text-ink-900 mb-6">My Bookings & Payments</h2>
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card p-16 text-center text-ink-400">
          <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No bookings yet.</p>
          <Link to="/listings" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">Browse listings →</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-50 text-xs font-semibold tracking-wider text-ink-400 border-b border-surface-200">
                <th className="text-left px-5 py-3">LISTING</th>
                <th className="text-left px-3 py-3">CHECK-IN</th>
                <th className="text-left px-3 py-3">CHECK-OUT</th>
                <th className="text-left px-3 py-3">TOTAL</th>
                <th className="text-left px-3 py-3">STATUS</th>
                <th className="text-left px-3 py-3">PAYMENT</th>
                <th className="px-3 py-3">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {bookings.map(b => (
                <tr key={b.Id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-ink-900">{b.ListingId?.substring(0,8)}…</td>
                  <td className="px-3 py-4 text-ink-500">{b.CheckIn}</td>
                  <td className="px-3 py-4 text-ink-500">{b.CheckOut}</td>
                  <td className="px-3 py-4 font-semibold">{fmt(b.TotalPrice)} {b.Currency}</td>
                  <td className="px-3 py-4">{pill(b.Status)}</td>
                  <td className="px-3 py-4">{payPill(b.PaymentStatus)}</td>
                  <td className="px-3 py-4 text-center">
                    {b.Status === 'Approved' && b.PaymentStatus === 'Unpaid' && (
                      <Link to={`/listings/${b.ListingId}/pay`}
                        className="text-xs font-bold text-primary-600 hover:underline">Pay Now</Link>
                    )}
                    {b.Status === 'Pending' && (
                      <button onClick={() => api.bookings.cancel(b.Id)}
                        className="text-xs font-bold text-red-500 hover:underline">Cancel</button>
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

//  Analytics sub-view 
function AnalyticsView({ enquiries, bookings, saved }) {
  const openEnquiries     = enquiries.filter(e => e.Status === 'Open').length
  const closedEnquiries   = enquiries.filter(e => e.Status === 'Closed').length
  const pendingBookings   = bookings.filter(b => b.Status === 'Pending').length
  const approvedBookings  = bookings.filter(b => b.Status === 'Approved').length
  const totalSpent        = bookings.filter(b => b.PaymentStatus === 'Paid').reduce((s,b) => s + Number(b.TotalPrice||0), 0)

  const StatRow = ({ label, value, color = 'bg-primary-600' }) => (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-ink-600">{label}</span>
        <span className="font-semibold text-ink-900">{value}</span>
      </div>
      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
        <motion.div className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: value > 0 ? '100%' : '0%' }}
          transition={{ duration: 0.8 }} />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      <h2 className="font-display font-bold text-2xl text-ink-900">My Analytics</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Saved Listings',    saved.size,        'bg-primary-50'  ],
          ['Total Inquiries',   enquiries.length,  'bg-blue-50'     ],
          ['Total Bookings',    bookings.length,   'bg-emerald-50'  ],
          ['Total Spent (CFA)', fmt(totalSpent),   'bg-yellow-50'   ],
        ].map(([l,v,c]) => (
          <div key={l} className={`${c} rounded-xl2 border border-surface-200 p-5`}>
            <p className="text-xs font-semibold tracking-wider text-ink-400">{l}</p>
            <p className="font-display font-extrabold text-2xl text-ink-900 mt-1">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl2 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-ink-900">Inquiry Breakdown</h3>
          <StatRow label="Open"   value={openEnquiries}   color="bg-primary-600" />
          <StatRow label="Closed" value={closedEnquiries} color="bg-ink-400"     />
        </div>
        <div className="bg-white rounded-xl2 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-ink-900">Booking Breakdown</h3>
          <StatRow label="Pending"  value={pendingBookings}  color="bg-yellow-400"  />
          <StatRow label="Approved" value={approvedBookings} color="bg-emerald-500" />
          <StatRow label="Total"    value={bookings.length}  color="bg-primary-600" />
        </div>
      </div>
    </div>
  )
}

//  Profile sub-view 
function ProfileView({ user }) {
  const [fullName, setFullName] = useState(user?.FullName || '')
  const [email,    setEmail]    = useState(user?.Email    || '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  // Profile update is not in the spec — placeholder ready for when endpoint is added
  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800)) // swap for real PATCH /api/users/me
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-lg">
      <h2 className="font-display font-bold text-2xl text-ink-900 mb-6">Profile Settings</h2>
      <div className="bg-white rounded-xl2 shadow-card p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-5 border-b border-surface-200">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white font-bold text-2xl flex items-center justify-center">
            {user?.FullName?.[0] || 'U'}
          </div>
          <div>
            <p className="font-semibold text-ink-900">{user?.FullName}</p>
            <p className="text-sm text-ink-400">{user?.Role}</p>
            <p className="text-xs text-primary-600 mt-1">{user?.Email}</p>
          </div>
        </div>

        {[['Full Name','text',fullName,setFullName],['Email','email',email,setEmail]].map(([label,type,val,set]) => (
          <div key={label}>
            <label className="block text-sm font-medium text-ink-700 mb-1">{label}</label>
            <input type={type} value={val} onChange={e => set(e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
          </div>
        ))}

        <div className="bg-surface-50 rounded-xl p-4 text-sm text-ink-500">
          <p className="font-semibold text-ink-700 mb-0.5">Account Role</p>
          <p className="capitalize">{user?.Role} — contact support to change your role.</p>
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
            Profile updated successfully!
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

//  Main export 
export default function SeekerDashboard() {
  const { user, logout } = useAuth()
  const [view,      setView]      = useState('overview')
  const [listings,  setListings]  = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [bookings,  setBookings]  = useState([])
  const [saved,     setSaved]     = useState(new Set())
  const [dataLoading,setDataLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [l, e, b] = await Promise.all([
        api.listings.browse({ Page: 1, PageSize: 20 }),
        api.enquiries.mine(),
        api.bookings.mine(),
      ])
      setListings(getCollection(l).map(normalizeListing))
      setEnquiries(getCollection(e))
      setBookings(getCollection(b))
    } catch { showToast('Failed to load data.') }
    finally { setDataLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = (id) => {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      showToast(next.has(id) ? 'Listing saved!' : 'Removed from saved.')
      return next
    })
  }

  const openInquiries = enquiries.filter(e => e.Status === 'Open').length

  return (
    <div className="flex h-screen bg-surface-100 overflow-hidden">
      <Sidebar view={view} setView={setView} msgCount={openInquiries} onLogout={logout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-surface-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-2 bg-surface-50 flex-1 max-w-md focus-within:border-primary-400 transition-colors">
            <Search className="w-4 h-4 text-ink-400 shrink-0" />
            <input
              placeholder="Search by location, type, or price…"
              className="text-sm outline-none bg-transparent w-full placeholder:text-ink-300"
              onFocus={() => setView('properties')}
            />
          </div>
          <div className="flex items-center gap-4 ml-4">
            <NotificationsPanel />
            <MessageSquare
              className="w-6 h-6 text-ink-500 cursor-pointer"
              onClick={() => setView('inquiries')}
            />
            <div className="flex items-center gap-2 pl-4 border-l border-surface-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-ink-900">{user?.FullName || '—'}</p>
                <p className="text-xs text-ink-400">Property Manager</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                {user?.FullName?.[0] || 'U'}
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
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {view === 'overview'   && <OverviewView   user={user} listings={listings} enquiries={enquiries} bookings={bookings} setView={setView} saved={saved} onSave={handleSave} />}
                {view === 'properties' && <PropertiesView listings={listings} loading={dataLoading} saved={saved} onSave={handleSave} />}
                {view === 'inquiries'  && <InquiriesView  enquiries={enquiries} />}
                {view === 'analytics'  && <AnalyticsView  enquiries={enquiries} bookings={bookings} saved={saved} />}
                {view === 'payments'   && <PaymentsView   bookings={bookings} loading={dataLoading} />}
                {view === 'profile'    && <ProfileView    user={user} />}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-surface-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <p className="text-sm font-display font-bold text-ink-900">Home<span className="text-primary-600">Finder</span></p>
            <p className="text-xs text-ink-400">© 2026 Home Finder Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-4 text-xs text-ink-400">
            {['Terms of Service','Privacy Policy','Contact Support','Cookies'].map(l => (
              <Link key={l} to="#" className="hover:text-primary-600 transition-colors">{l}</Link>
            ))}
          </div>
        </footer>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-cardHover z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
