// components/dashboard/RecentSearches.jsx
import { X } from 'lucide-react';

export default function RecentSearches({ searches, onRemove, isLoading }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent Searches</h3>

      {isLoading ? (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-slate-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : searches.length === 0 ? (
        <p className="text-sm text-slate-400">
          Your recent searches will appear here once you start exploring listings.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {searches.map((search) => (
            <span
              key={search.id}
              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-sm rounded-full pl-3 pr-2 py-1.5"
            >
              {search.label}
              <button
                onClick={() => onRemove(search.id)}
                aria-label={`Remove ${search.label} search`}
                className="hover:bg-slate-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}