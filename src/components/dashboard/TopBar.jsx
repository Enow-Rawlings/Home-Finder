// components/dashboard/TopBar.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, MessageSquare, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function TopBar({ user, messagesCount = 0, notificationsCount = 0, onMenuClick }) {
  const [query, setQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/properties?q=${encodeURIComponent(trimmed)}` : '/properties');
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-slate-600" aria-label="Open menu">
        <Menu className="w-5 h-5" />
      </button>

      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by location, type, or price..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => navigate('/messages')}
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Messages"
        >
          <MessageSquare className="w-5 h-5" />
          {messagesCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 sm:pl-3 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {user?.name || 'Loading...'}
              </p>
              <p className="text-xs text-slate-500 leading-tight">{user?.role || ''}</p>
            </div>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
              >
                <button
                  onClick={() => { setIsUserMenuOpen(false); navigate('/settings/profile'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => { setIsUserMenuOpen(false); navigate('/logout'); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Log Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}