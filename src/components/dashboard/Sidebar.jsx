// components/dashboard/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Building2, Mail, BarChart3, Wallet, Settings,
  Plus, HelpCircle, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/inquiries', label: 'Inquiries', icon: Mail },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/payments', label: 'Payments', icon: Wallet },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-emerald-200/70 text-emerald-900' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-lg font-bold text-slate-900">Home Finder</h1>
        <p className="text-xs text-slate-500">Manager Portal</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClasses}>
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}

        <p className="pt-6 pb-2 px-3 text-[11px] font-semibold tracking-wide text-slate-400">
          ACCOUNT
        </p>
        <NavLink to="/settings/profile" className={linkClasses}>
          <Settings className="w-[18px] h-[18px]" />
          Profile Settings
        </NavLink>
      </nav>

      <div className="px-3 pb-6 space-y-2 border-t border-slate-200 pt-4">
        <button
          onClick={() => navigate('/properties/new')}
          className="w-full flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          List New Property
        </button>
        <button
          onClick={() => navigate('/help')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <HelpCircle className="w-[18px] h-[18px]" />
          Help Center
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Log Out
        </button>
      </div>
    </aside>
  );
}