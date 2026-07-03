// src/components/Navbar.jsx — REPLACE ENTIRELY
// Fixed: "Post a Property" only shows for Landlord/HotelManager.
// "Sign In" changes to user name + dashboard link when logged in.
// Seekers don't see the "Post a Property" button.

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import NotificationsPanel from './NotificationsPanel'
import { useAuth } from '../context/AuthContext'
import { isLandlordRole } from '../lib/roles'

const publicLinks = [
  { to: '/',        label: 'Home'     },
  { to: '/listings',label: 'Listings' },
  { to: '/reviews', label: 'Reviews'  },
]

export default function Navbar() {
  const [open, setOpen]   = useState(false)
  const [menu, setMenu]   = useState(false)
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()
  const isLandlord        = user && isLandlordRole(user.Role)

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-surface-200">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-extrabold text-lg text-primary-600">
          Home<span className="text-ink-900">Finder</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
          {publicLinks.map(l => (
            <li key={l.to}>
              <NavLink to={l.to} end className={({ isActive }) =>
                `transition-colors hover:text-primary-600 ${isActive ? 'text-primary-600' : ''}`}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {user && (
          <div className="ml-auto md:ml-0">
            <NotificationsPanel />
          </div>
        )}

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isLandlord && (
                <Link to="/listings/new"
                  className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Post a Property
                </Link>
              )}
              {/* Avatar dropdown */}
              <div className="relative">
                <button onClick={() => setMenu(v => !v)}
                  className="flex items-center gap-2 border border-surface-200 rounded-xl px-3 py-1.5 hover:border-primary-400 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    {user.FullName?.[0]}
                  </div>
                  <span className="text-sm font-medium text-ink-800 max-w-[100px] truncate">{user.FullName}</span>
                </button>
                <AnimatePresence>
                  {menu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-12 bg-white border border-surface-200 rounded-xl shadow-cardHover w-48 py-1 z-50"
                    >
                      <button onClick={() => { navigate('/dashboard'); setMenu(false) }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-ink-700 hover:bg-surface-50 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </button>
                      <div className="border-t border-surface-100 my-1" />
                      <button onClick={() => { logout(); setMenu(false) }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="w-4 h-4" /> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"
                className="text-sm font-medium text-ink-700 hover:text-primary-600 transition-colors">
                Sign In
              </Link>
              <Link to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button className="text-ink-800" onClick={() => setOpen(v => !v)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-surface-200 bg-white"
          >
            <ul className="flex flex-col px-6 py-4 gap-4 text-ink-700 font-medium">
              {publicLinks.map(l => (
                <li key={l.to}><NavLink to={l.to} onClick={() => setOpen(false)}>{l.label}</NavLink></li>
              ))}
              {user ? (
                <>
                  <li><Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></li>
                  {isLandlord && <li><Link to="/listings/new" onClick={() => setOpen(false)}>Post a Property</Link></li>}
                  <li><button onClick={() => { logout(); setOpen(false) }} className="text-red-500">Log Out</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" onClick={() => setOpen(false)}>Sign In</Link></li>
                  <li><Link to="/register" onClick={() => setOpen(false)} className="bg-primary-600 text-white px-4 py-2 rounded-lg inline-block">Sign Up</Link></li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
