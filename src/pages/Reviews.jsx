import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, ShieldCheck, ThumbsUp, Flag, Search,
  ArrowUpDown, ChevronLeft, ChevronRight,
  Zap, Briefcase, PawPrint, X,
} from 'lucide-react'

//  hard coded landlord profile 
// 🔌GET /api/landlords/:id
const mockLandlord = {
  id: 1,
  name: 'Jean-Pierre Nkemdirim',
  initials: 'JN',
  memberSince: '2021',
  verified: true,
  rating: 4.8,
  reviewCount: 124,
  badges: [
    { label: 'Responsive', icon: Zap },
    { label: 'Professional', icon: Briefcase },
    { label: 'Pet Friendly', icon: PawPrint },
  ],
  // 🔌 GET /api/landlords/:id/rating-breakdown
  breakdown: { 5: 85, 4: 10, 3: 3, 2: 1, 1: 1 },
}

//  Mock reviews 
// 🔌 GET /api/landlords/:id/reviews?page=1&q=:search&sort=:sort
const mockReviews = [
  {
    id: 1, name: 'James Donovan', initials: 'JD',
    date: 'August 2023', rating: 4, verified: true,
    helpful: 12,
    comment: 'Jean-Pierre was an incredible landlord during my two-year stay in Molyko. Any maintenance issues were addressed within 24 hours. He respects privacy but is always available when needed. Highly recommend his properties to anyone looking for a stress-free rental experience.',
  },
  {
    id: 2, name: 'Sarah Lindon', initials: 'SL',
    date: 'June 2023', rating: 3, verified: true,
    helpful: 4,
    comment: 'Great experience overall. The move-in process was very professional and documented well. Only minor issue was a slight delay in fixing a bathroom tile, but communication was constant. Very fair with security deposits as long as you maintain the place.',
  },
  {
    id: 3, name: 'Amara Kouassi', initials: 'AK',
    date: 'January 2023', rating: 4, verified: false,
    helpful: 8,
    comment: 'Very professional landlord. He provided a detailed manual for the apartment which helped with using the older water heater system. Transparent and trustworthy.',
  },
  {
    id: 4, name: 'Robert Mensah', initials: 'RM',
    date: 'November 2022', rating: 4, verified: true,
    helpful: 2,
    comment: 'Best experience I\'ve had renting in Buea. Jean-Pierre treats his tenants with genuine respect and maintains his buildings to a high standard.',
  },
]

//  Helpers 
function StarRow({ rating, size = 'sm', interactive = false, onChange }) {
  const [hovered, setHovered] = useState(null)
  const active = hovered ?? rating
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size === 'sm' ? 'w-4 h-4' : 'w-7 h-7'} transition-colors
            ${s <= active ? 'fill-yellow-400 text-yellow-400' : 'fill-surface-200 text-surface-200'}
            ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => interactive && setHovered(s)}
          onMouseLeave={() => interactive && setHovered(null)}
          onClick={() => interactive && onChange?.(s)}
        />
      ))}
    </div>
  )
}

function Avatar({ initials, size = 'md' }) {
  const sz = size === 'md' ? 'w-11 h-11 text-sm' : 'w-16 h-16 text-xl'
  return (
    <div className={`${sz} rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  )
}

//  Write Review Modal 
function ReviewModal({ landlordName, onClose }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!rating || !comment.trim()) return
    // 🔌  POST /api/landlords/:id/reviews  body: { rating, comment }
    // On success: refetch reviews list, show success state
    console.log('Submit review:', { rating, comment })
    setSubmitted(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }} transition={{ duration: 0.3 }}
        className="bg-white rounded-xl2 shadow-cardHover w-full max-w-lg p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-400 hover:text-ink-700">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <ShieldCheck className="w-14 h-14 text-primary-600" />
            <h3 className="font-display font-bold text-xl text-ink-900">Review Submitted!</h3>
            <p className="text-sm text-ink-500">Thanks for helping other house hunters.</p>
            <button onClick={onClose}
              className="mt-2 bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-700 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-display font-bold text-xl text-ink-900 mb-1">
              Write a Review
            </h3>
            <p className="text-sm text-ink-500 mb-5">
              Share your experience renting from <span className="font-medium text-ink-800">{landlordName}</span>.
            </p>

            <p className="text-sm font-semibold text-ink-700 mb-2">Your Rating</p>
            <StarRow rating={rating} size="lg" interactive onChange={setRating} />
            {!rating && <p className="text-xs text-ink-400 mt-1">Click to rate</p>}

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              placeholder="Describe your experience as a tenant…"
              className="w-full mt-4 border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={!rating || !comment.trim()}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              Submit Review
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

//  Review Card 
function ReviewCard({ review, index }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful)
  const [markedHelpful, setMarkedHelpful] = useState(false)

  const handleHelpful = () => {
    // 🔌 API — POST /api/reviews/:reviewId/helpful
    if (markedHelpful) return
    setHelpfulCount(c => c + 1)
    setMarkedHelpful(true)
  }

  const handleReport = () => {
    // 🔌 API — POST /api/reviews/:reviewId/report
    alert('Review reported. Thank you.')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="bg-white rounded-xl2 shadow-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Avatar initials={review.initials} />
          <div>
            <p className="font-semibold text-sm text-ink-900">{review.name}</p>
            <p className="text-xs text-ink-400">{review.date}</p>
          </div>
        </div>
        {review.verified && (
          <span className="flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Tenant
          </span>
        )}
      </div>

      <StarRow rating={review.rating} />

      <p className="text-sm text-ink-600 leading-relaxed">{review.comment}</p>

      <div className="flex items-center gap-4 pt-1 border-t border-surface-100">
        <button
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            markedHelpful ? 'text-primary-600' : 'text-ink-400 hover:text-primary-600'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({helpfulCount})
        </button>
        <button
          onClick={handleReport}
          className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-red-500 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" /> Report
        </button>
      </div>
    </motion.div>
  )
}

//  Main Page 
export default function Reviews() {
  // 🔌 API — useParams to get landlord id: const { landlordId } = useParams()
  //          then fetch GET /api/landlords/:landlordId
  const landlord = mockLandlord

  const [searchQuery, setSearchQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [showModal, setShowModal] = useState(false)

  // 🔌 API — filter/sort/search on server via query params:
  //          GET /api/landlords/:id/reviews?q=:search&sort=:sort&page=:page
  const filtered = mockReviews.filter(r =>
    r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-ink-400 mb-6">
          <Link to="/listings" className="hover:text-primary-600 transition-colors">Listings</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-ink-700 font-medium">{landlord.name}</span>
        </nav>

        {/*  Profile + Rating breakdown  */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="bg-white rounded-xl2 shadow-card p-6 flex-1"
          >
            <div className="flex items-start gap-4">
              <div className="relative shrink-0">
                <Avatar initials={landlord.initials} size="lg" />
                {landlord.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center border-2 border-white">
                    <ShieldCheck className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-ink-900">{landlord.name}</h1>
                <p className="text-sm text-ink-500 mt-0.5">
                  Member since {landlord.memberSince} · Verified Host
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-display font-extrabold text-2xl text-ink-900">
                    {landlord.rating}
                  </span>
                  <span className="text-sm text-ink-400">
                    {landlord.reviewCount} reviews
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {landlord.badges.map(({ label, icon: Icon }) => (
                    <span key={label}
                      className="flex items-center gap-1.5 text-xs font-semibold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rating breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white rounded-xl2 shadow-card p-6 md:w-80"
          >
            <p className="text-xs font-semibold tracking-widest text-ink-400 mb-4">RATING BREAKDOWN</p>
            <div className="flex flex-col gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-xs text-ink-500 w-10 shrink-0">{star} {star === 1 ? 'star' : 'stars'}</span>
                  <div className="flex-1 h-2 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${landlord.breakdown[star]}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + (5 - star) * 0.05 }}
                      className="h-full bg-primary-600 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-ink-400 w-7 text-right shrink-0">
                    {landlord.breakdown[star]}%
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-200 mt-5 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-ink-500">Previously rented from {landlord.name.split(' ')[0]}?</p>
              <button
                onClick={() => setShowModal(true)}
                className="shrink-0 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
              >
                Write a Review
              </button>
            </div>
          </motion.div>
        </div>

        {/*  Reviews list  */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="font-display font-bold text-xl text-ink-900">Recent Reviews</h2>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 border border-surface-200 rounded-lg px-3 py-2 bg-white flex-1 sm:w-52">
              <Search className="w-4 h-4 text-ink-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reviews…"
                className="text-sm outline-none w-full placeholder:text-ink-300"
              />
            </div>
            {/* Sort */}
            <button
              onClick={() => setSort(s => s === 'newest' ? 'helpful' : 'newest')}
              className="flex items-center gap-1.5 border border-surface-200 rounded-lg px-3 py-2 text-sm font-medium text-ink-600 bg-white hover:border-primary-400 transition-colors shrink-0"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sort === 'newest' ? 'Newest' : 'Most Helpful'}
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl2 shadow-card p-10 text-center text-ink-400 text-sm">
            No reviews match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((review, i) => (
              <ReviewCard key={review.id} review={review} index={i} />
            ))}
          </div>
        )}

        {/* Pagination — 🔌 API: wire page state to GET /landlords/:id/reviews?page=:page */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {[ChevronLeft, 1, 2, 3, '...', 12, ChevronRight].map((item, i) => {
            if (item === ChevronLeft || item === ChevronRight) {
              const Icon = item
              return (
                <button key={i} className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center text-ink-500 hover:border-primary-400 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              )
            }
            if (item === '...') return <span key={i} className="text-ink-400 px-1">…</span>
            return (
              <button key={i}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                  item === 1
                    ? 'bg-primary-600 text-white'
                    : 'border border-surface-200 text-ink-600 hover:border-primary-400'
                }`}>
                {item}
              </button>
            )
          })}
        </div>
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {showModal && (
          <ReviewModal landlordName={landlord.name} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}