
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Heart, BedDouble, Bath, Ruler, Clock, BadgeCheck, ChevronLeft, ChevronRight, Search, Loader2, Building2 } from 'lucide-react'
import api from '../services/api'

// Cameroon cities
const CM_CITIES = [
  'Yaoundé','Douala','Bafoussam','Bamenda','Garoua','Maroua','Ngaoundéré',
  'Bertoua','Ebolowa','Kribi','Limbé','Buea','Kumba','Edéa','Loum',
  'Nkongsamba','Mbouda','Dschang','Foumban','Sangmélima',
]

const TYPES = ['Apartment','Studio','House','Villa','Room','Commercial']

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' } }),
}

function ListingCard({ listing, index, favorited, onToggleFavorite }) {
  const photo = listing.PrimaryPhotoUrl
  const hoursOld = listing.AvailableFrom
    ? Math.floor((Date.now() - new Date(listing.AvailableFrom)) / 3600000)
    : 0
  const expiring = hoursOld > 40

  return (
    <motion.div
      initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}
      custom={index} variants={fadeUp}
      className="bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow overflow-hidden group"
    >
      <div className="relative h-48 overflow-hidden bg-surface-200">
        {photo
          ? <img src={photo} alt={listing.Title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Building2 className="w-10 h-10 text-surface-300" /></div>
        }
        <span className={`absolute top-3 left-3 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
          expiring ? 'bg-red-600 text-white' : 'bg-primary-600 text-white'
        }`}>
          {expiring ? <><Clock className="w-3.5 h-3.5" /> Expiring Soon</> : <><BadgeCheck className="w-3.5 h-3.5" /> Verified</>}
        </span>
        <button
          onClick={() => onToggleFavorite(listing.Id)}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-primary-600 text-primary-600' : 'text-ink-700'}`} />
        </button>
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold text-ink-900 truncate">{listing.Title}</h3>
        <p className="text-sm text-ink-500 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" /> {listing.City}, {listing.Region}
        </p>
        <div className="flex items-center gap-4 text-xs text-ink-500 mt-3 pb-3 border-b border-surface-200">
          <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {listing.Bedrooms} {listing.Bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          <span className="flex items-center gap-1"><Bath className="w-4 h-4" /> {listing.Bathrooms} {listing.Bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          <span className="flex items-center gap-1"><Ruler className="w-4 h-4" /> {listing.Type}</span>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-primary-600 font-bold">
            {Number(listing.PricePerNight).toLocaleString()} {listing.Currency}
            <span className="text-ink-400 font-normal text-xs">/mo</span>
          </span>
          <Link to={`/listings/${listing.Id}`}
            className="text-sm font-semibold bg-ink-900 hover:bg-ink-800 text-white px-4 py-2 rounded-lg transition-colors">
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default function Listings() {
  const [results,   setResults]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [favorites, setFavorites] = useState(new Set())
  const [city,      setCity]      = useState('')
  const [type,      setType]      = useState('')
  const [minPrice,  setMinPrice]  = useState('')
  const [maxPrice,  setMaxPrice]  = useState('')
  const [sort,      setSort]      = useState('newest')
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const PAGE_SIZE = 9

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      // Use search endpoint when filters applied, browse otherwise
      const hasFilters = city || type || minPrice || maxPrice
      if (hasFilters) {
        const res = await api.search.listings({
          City:     city     || undefined,
          Type:     type     || undefined,
          MinPrice: minPrice || undefined,
          MaxPrice: maxPrice || undefined,
          SortBy:   sort === 'price-asc' ? 'price_asc' : sort === 'price-desc' ? 'price_desc' : undefined,
          Page:     page,
          PageSize: PAGE_SIZE,
        })
        setResults(res.Items || [])
        setTotal(res.TotalCount || 0)
      } else {
        const res = await api.listings.browse({ Page: page, PageSize: PAGE_SIZE })
        setResults(Array.isArray(res) ? res : res.Items || [])
        setTotal(Array.isArray(res) ? res.length : res.TotalCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch listings:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [city, type, minPrice, maxPrice, sort, page])

  useEffect(() => { fetchListings() }, [fetchListings])

  const toggleFavorite = (id) => setFavorites(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const clearAll = () => { setCity(''); setType(''); setMinPrice(''); setMaxPrice(''); setPage(1) }
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        <aside className="lg:w-72 shrink-0">
          <div className="bg-white rounded-xl2 shadow-card p-6 sticky top-20">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-ink-900">Filters</h2>
              <button onClick={clearAll} className="text-xs font-semibold text-primary-600 hover:underline">Clear all</button>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold tracking-wide text-ink-500 mb-2">CITY</label>
              <select value={city} onChange={e => { setCity(e.target.value); setPage(1) }}
                className="w-full border border-surface-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 bg-white">
                <option value="">All Cities</option>
                {CM_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold tracking-wide text-ink-500 mb-2">PROPERTY TYPE</label>
              <select value={type} onChange={e => { setType(e.target.value); setPage(1) }}
                className="w-full border border-surface-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-400 bg-white">
                <option value="">Any Type</option>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold tracking-wide text-ink-500 mb-2">PRICE RANGE (XAF/month)</label>
              <div className="flex items-center gap-2">
                <input value={minPrice} onChange={e => { setMinPrice(e.target.value); setPage(1) }}
                  placeholder="Min" type="number"
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400" />
                <span className="text-ink-300">—</span>
                <input value={maxPrice} onChange={e => { setMaxPrice(e.target.value); setPage(1) }}
                  placeholder="Max" type="number"
                  className="w-full border border-surface-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-400" />
              </div>
            </div>

            <div className="bg-primary-50 rounded-lg p-3 text-xs text-primary-700 leading-relaxed">
              All listings are re-verified by landlords within 48 hours.
            </div>
          </div>
        </aside>

        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-ink-900">Available Listings</h1>
              <p className="text-sm text-ink-500 mt-1">
                {loading ? 'Loading…' : `Showing ${results.length} verified properties`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-ink-500">Sort by:</span>
              <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }}
                className="border border-surface-200 rounded-lg px-3 py-2 outline-none focus:border-primary-400 bg-white">
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-xl2 shadow-card p-12 text-center">
              <Building2 className="w-12 h-12 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-500">No listings match your filters.</p>
              <button onClick={clearAll} className="text-primary-600 text-sm hover:underline mt-2">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((l, i) => (
                <ListingCard key={l.Id} listing={l} index={i} favorited={favorites.has(l.Id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
          )}

          
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center text-ink-500 hover:border-primary-400 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                    page === p ? 'bg-primary-600 text-white' : 'border border-surface-200 text-ink-600 hover:border-primary-400'
                  }`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center text-ink-500 hover:border-primary-400 disabled:opacity-40 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}