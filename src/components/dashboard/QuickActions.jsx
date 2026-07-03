// components/dashboard/QuickActions.jsx
import { useNavigate } from 'react-router-dom';
import { Search, Bookmark, CreditCard, UserCog } from 'lucide-react';

const ACTIONS = [
  { icon: Search, label: 'Browse Properties', to: '/properties' },
  { icon: Bookmark, label: 'Saved Listings', to: '/saved-listings' },
  { icon: CreditCard, label: 'Pay to Contact Landlord', to: '/payments/contact-landlord' },
  { icon: UserCog, label: 'Update Profile', to: '/settings/profile' },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {ACTIONS.map(({ icon: Icon, label, to }) => (
        <button
          key={to}
          onClick={() => navigate(to)}
          className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3 text-center hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <span className="w-11 h-11 rounded-full bg-sky-50 text-emerald-700 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </span>
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </button>
      ))}
    </div>
  );
}