// components/dashboard/ListingCard.jsx
import { useNavigate } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Ruler, ShieldCheck, Sparkles, Heart } from 'lucide-react';

export default function ListingCard({ listing, onToggleSave }) {
  const navigate = useNavigate();
  const {
    id, title, price, currency = 'CFA', period = 'mo', location, image,
    beds, baths, area, verified, isNew, isSaved,
  } = listing;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="relative aspect-[4/3] bg-slate-100">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            No image available
          </div>
        )}

        {verified && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
        {isNew && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 text-amber-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> New Listing
          </span>
        )}

        <button
          onClick={() => onToggleSave(id, isSaved)}
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center"
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h4>
          <p className="text-sm sm:text-base font-bold text-emerald-700 whitespace-nowrap">
            {price?.toLocaleString()}
            <span className="text-xs font-medium text-slate-500"> {currency}/{period}</span>
          </p>
        </div>

        <p className="flex items-center gap-1 text-sm text-slate-500 mt-1.5">
          <MapPin className="w-3.5 h-3.5" /> {location}
        </p>

        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
          {beds != null && (
            <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {beds} Beds</span>
          )}
          {baths != null && (
            <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {baths} Baths</span>
          )}
          {area && (
            <span className="flex items-center gap-1"><Ruler className="w-4 h-4" /> {area}</span>
          )}
        </div>

        <button
          onClick={() => navigate(`/properties/${id}`)}
          className="mt-4 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg py-2.5 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}