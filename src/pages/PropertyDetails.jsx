
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, BedDouble, Bath, Ruler, Star, Wifi, ShieldCheck,
  ParkingCircle, Dumbbell, Waves, Trees, Heart, ArrowLeft,
  Clock, BadgeCheck, Zap, ChevronLeft, ChevronRight,
  MessageSquare, CalendarDays, Users, Loader2, CheckCircle2, X,
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { isSeekerRole } from '../lib/roles'

const AMENITY_ICONS = {
  WiFi: Wifi, Generator: Zap, 'Water Supply': Waves,
  Security: ShieldCheck, Parking: ParkingCircle,
  Balcony: Trees, Gym: Dumbbell,
}

//  Enquiry Modal 
function EnquiryModal({ listingId, onClose }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.enquiries.start({ ListingId: listingId, Subject: subject.trim(), Message: message.trim() })
      setDone(true)
    } catch (e) {
      setError(e.response?.data?.Message || 'Failed to send enquiry.')
    } finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink-900/60 flex items-center justify-center px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-cardHover w-full max-w-md p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-400 hover:text-ink-700">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="py-6 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-14 h-14 text-primary-600" />
            <h3 className="font-display font-bold text-xl text-ink-900">Enquiry Sent!</h3>
            <p className="text-sm text-ink-500">The landlord will reply in your Messages.</p>
            <button onClick={onClose}
              className="mt-2 bg-primary-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary-700 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-display font-bold text-xl text-ink-900 mb-1">Send Enquiry</h3>
            <p className="text-sm text-ink-500 mb-5">Ask the landlord a question about this property.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Is parking included?"
                  className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  rows={4} placeholder="Write your message here…"
                  className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none" />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleSend} disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send Enquiry'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

//  Booking Modal 
function BookingModal({ listing, onClose, onBooked }) {
  const navigate = useNavigate()
  const [checkIn,  setCheckIn]  = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests,   setGuests]   = useState(1)
  const [message,  setMessage]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0
  const total = nights * Number(listing.PricePerNight)

  const handleBook = async () => {
    if (!checkIn || !checkOut) { setError('Please select check-in and check-out dates.'); return }
    if (nights <= 0)           { setError('Check-out must be after check-in.'); return }
    if (guests < 1)            { setError('At least 1 guest required.'); return }
    setError('')
    setLoading(true)
    try {
      const booking = await api.bookings.request({
        ListingId: listing.Id,
        CheckIn:   checkIn,
        CheckOut:  checkOut,
        Guests:    Number(guests),
        Message:   message || undefined,
      })
      // Booking created → go straight to payment with the real BookingId
      onClose()
      navigate(`/listings/${listing.Id}/pay`, { state: { bookingId: booking.Id, listing, nights, total } })
    } catch (e) {
      setError(e.response?.data?.Message || 'Booking failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink-900/60 flex items-center justify-center px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-cardHover w-full max-w-md p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-400 hover:text-ink-700">
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-display font-bold text-xl text-ink-900 mb-1">Request Booking</h3>
        <p className="text-sm text-ink-500 mb-5">{listing.Title}</p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Check-in</label>
              <input type="date" value={checkIn}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Check-out</label>
              <input type="date" value={checkOut}
                min={checkIn || new Date().toISOString().split('T')[0]}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Guests</label>
            <input type="number" min="1" max={listing.MaxGuests} value={guests}
              onChange={e => setGuests(e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400" />
            <p className="text-xs text-ink-400 mt-1">Max {listing.MaxGuests} guests</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Message to landlord (optional)</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              rows={2} placeholder="Introduce yourself or ask a question…"
              className="w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 resize-none" />
          </div>

          {/* Price breakdown */}
          {nights > 0 && (
            <div className="bg-surface-50 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between text-ink-600">
                <span>{Number(listing.PricePerNight).toLocaleString()} XAF × {nights} night{nights > 1 ? 's' : ''}</span>
                <span>{total.toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between font-bold text-ink-900 pt-1 border-t border-surface-200">
                <span>Total</span>
                <span>{total.toLocaleString()} {listing.Currency}</span>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={handleBook} disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Requesting…</>
              : `Request Booking${nights > 0 ? ` · ${total.toLocaleString()} XAF` : ''}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

//  Main page 
export default function PropertyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [listing,     setListing]     = useState(null)
  const [photos,      setPhotos]      = useState([])
  const [reviews,     setReviews]     = useState(null)  // { AverageRating, TotalReviews, Reviews[] }
  const [loading,     setLoading]     = useState(true)
  const [activeImg,   setActiveImg]   = useState(0)
  const [favorited,   setFavorited]   = useState(false)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [error,       setError]       = useState('')

  const isSeeker = user && isSeekerRole(user.Role)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        // Fetch listing, photos, and reviews in parallel
        const [l, p, r] = await Promise.allSettled([
          api.listings.getById(id),
          api.photos.getAll(id),
          api.reviews.getForListing(id),
        ])

        if (l.status === 'rejected') throw l.reason
        setListing(l.value)
        setPhotos(p.status === 'fulfilled' ? p.value : [])
        setReviews(r.status === 'fulfilled' ? r.value : null)
      } catch (e) {
        console.error('Failed to load listing:', e)
        setError(e.response?.data?.Message || 'Failed to load listing.')
      } finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
    </div>
  )

  if (error || !listing) return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center">
      <p className="text-ink-500 mb-4">{error || 'Listing not found.'}</p>
      <button onClick={() => navigate('/listings')}
        className="text-primary-600 hover:underline text-sm">← Back to listings</button>
    </div>
  )

  // Build image list: use real uploaded photos, fallback to placeholder
  const images = photos.length > 0
    ? photos.sort((a, b) => a.DisplayOrder - b.DisplayOrder).map(p => p.Url)
    : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=900&auto=format&fit=crop']

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setActiveImg(i => (i + 1) % images.length)

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-primary-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/*  Left  */}
          <div className="flex-1 min-w-0">
            {/* Main image with nav arrows */}
            <div className="relative rounded-xl2 overflow-hidden h-72 md:h-[400px] bg-surface-200 group">
              <motion.img
                key={activeImg}
                src={images[activeImg]}
                alt={listing.Title}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button onClick={prevImg}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronLeft className="w-5 h-5 text-ink-800" />
                  </button>
                  <button onClick={nextImg}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-5 h-5 text-ink-800" />
                  </button>
                  <span className="absolute bottom-3 right-3 bg-ink-900/60 text-white text-xs px-2.5 py-1 rounded-full">
                    {activeImg + 1} / {images.length}
                  </span>
                </>
              )}
              {/* Status badge */}
              <span className={`absolute top-4 left-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                listing.Status === 'Published' ? 'bg-primary-600 text-white' : 'bg-yellow-500 text-white'
              }`}>
                {listing.Status === 'Published'
                  ? <><BadgeCheck className="w-3.5 h-3.5" /> Verified</>
                  : <><Clock className="w-3.5 h-3.5" /> {listing.Status}</>}
              </span>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-2">
                {images.slice(0, 5).map((src, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`relative rounded-lg overflow-hidden h-16 ring-2 transition-all ${activeImg === i ? 'ring-primary-600' : 'ring-transparent'}`}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    {i === 4 && images.length > 5 && (
                      <div className="absolute inset-0 bg-ink-900/50 flex items-center justify-center text-white text-xs font-semibold">
                        +{images.length - 5}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* About */}
            <div className="bg-white rounded-xl2 shadow-card p-6 mt-5">
              <h2 className="font-display font-bold text-xl text-ink-900 mb-3">About this property</h2>
              <p className="text-sm text-ink-500 leading-relaxed whitespace-pre-line">
                {listing.Description || 'No description provided.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-surface-200">
                {[
                  ['Type',      listing.Type],
                  ['Bedrooms',  listing.Bedrooms],
                  ['Bathrooms', listing.Bathrooms],
                  ['Max Guests',listing.MaxGuests],
                ].map(([k,v]) => (
                  <div key={k} className="text-center">
                    <p className="text-xs text-ink-400">{k}</p>
                    <p className="font-semibold text-ink-900 mt-0.5 capitalize">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            {listing.Amenities?.length > 0 && (
              <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
                <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                  {listing.Amenities.map(a => {
                    const Icon = AMENITY_ICONS[a] || ShieldCheck
                    return (
                      <div key={a} className="flex items-center gap-2 text-sm text-ink-700">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary-600" />
                        </div>
                        {a}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
              <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Location</h2>
              <div className="h-40 rounded-xl bg-surface-100 flex items-center justify-center border border-surface-200">
                <span className="flex items-center gap-2 bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow">
                  <MapPin className="w-4 h-4" />
                  {listing.Address}, {listing.City}, {listing.Region}
                </span>
              </div>
            </div>

            {/* Reviews */}
            {reviews && reviews.TotalReviews > 0 && (
              <div className="bg-white rounded-xl2 shadow-card p-6 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display font-bold text-xl text-ink-900">Reviews</h2>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-ink-900">{reviews.AverageRating?.toFixed(1)}</span>
                    <span className="text-sm text-ink-400">({reviews.TotalReviews})</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {reviews.Reviews?.slice(0, 3).map(r => (
                    <div key={r.Id} className="pb-4 border-b border-surface-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1 mb-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= r.Rating ? 'fill-yellow-400 text-yellow-400' : 'text-surface-200'}`} />
                        ))}
                      </div>
                      <p className="text-sm text-ink-600 leading-relaxed">{r.Comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/*  Sticky sidebar  */}
          <aside className="lg:w-80 shrink-0">
            <div className="bg-white rounded-xl2 shadow-cardHover p-6 sticky top-20">
              {/* Price */}
              <p className="font-display font-extrabold text-2xl text-primary-600">
                {Number(listing.PricePerNight).toLocaleString()} {listing.Currency}
                <span className="text-ink-400 font-normal text-sm">/mo</span>
              </p>
              <p className="text-sm text-ink-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {listing.City}, {listing.Region}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 py-4 my-4 border-y border-surface-200">
                {[
                  [BedDouble, listing.Bedrooms, listing.Bedrooms === 1 ? 'Bed' : 'Beds'],
                  [Bath,      listing.Bathrooms, listing.Bathrooms === 1 ? 'Bath' : 'Baths'],
                  [Users,     listing.MaxGuests, 'Guests'],
                ].map(([Icon, val, label]) => (
                  <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
                    <Icon className="w-5 h-5 text-primary-600" />
                    <span className="font-semibold text-ink-900">{val}</span>
                    <span className="text-xs text-ink-400">{label}</span>
                  </div>
                ))}
              </div>

              {/* Average rating */}
              {reviews?.TotalReviews > 0 && (
                <div className="flex items-center gap-2 mb-4 bg-yellow-50 rounded-xl px-3 py-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-ink-900">{reviews.AverageRating?.toFixed(1)}</span>
                  <span className="text-xs text-ink-400">({reviews.TotalReviews} reviews)</span>
                </div>
              )}

              {/* CTA buttons — only for seekers */}
              {isSeeker ? (
                <>
                  <button onClick={() => setShowBooking(true)}
                    className="block w-full text-center bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all text-white font-bold py-3.5 rounded-xl text-sm mb-3">
                    Request Booking
                  </button>
                  <button onClick={() => setShowEnquiry(true)}
                    className="block w-full text-center border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 rounded-xl text-sm mb-3 transition-colors flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Send Enquiry
                  </button>
                </>
              ) : !user ? (
                <Link to="/login" state={{ from: `/listings/${id}` }}
                  className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl text-sm mb-3">
                  Sign in to Book
                </Link>
              ) : null}

              {/* Save */}
              <button onClick={() => setFavorited(v => !v)}
                className={`w-full flex items-center justify-center gap-2 border-2 font-semibold py-3 rounded-xl text-sm transition-colors ${
                  favorited ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-surface-200 text-ink-700 hover:border-primary-400'
                }`}>
                <Heart className={`w-4 h-4 ${favorited ? 'fill-primary-600' : ''}`} />
                {favorited ? 'Saved' : 'Save to Favourites'}
              </button>

              <p className="text-center text-xs text-ink-400 mt-4 leading-relaxed">
                No middlemen. Direct contact with verified landlords.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEnquiry && <EnquiryModal listingId={listing.Id} onClose={() => setShowEnquiry(false)} />}
        {showBooking && <BookingModal listing={listing} onClose={() => setShowBooking(false)} />}
      </AnimatePresence>
    </>
  )
}
