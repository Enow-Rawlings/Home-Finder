

import { useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Info, ArrowLeft, CheckCircle2, Phone, Copy, Check, Loader2, AlertCircle } from 'lucide-react'
import api from '../services/api'

const providers = [
  { id: 'MTN',    label: 'MTN MoMo',     color: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-400', short: 'MTN' },
  { id: 'Orange', label: 'Orange Money', color: 'bg-orange-500', text: 'text-white',       border: 'border-orange-400', short: 'ORG' },
]

const STEP = { FORM: 'form', PROCESSING: 'processing', SUCCESS: 'success', ERROR: 'error' }

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="ml-2 text-primary-600 hover:text-primary-800 transition-colors" aria-label="Copy">
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}

export default function Payment() {
  const { id } = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  
  const { bookingId, listing, nights, total } = location.state || {}

  const [provider, setProvider] = useState('MTN')
  const [phone,    setPhone]    = useState('')
  const [phoneErr, setPhoneErr] = useState('')
  const [step,     setStep]     = useState(STEP.FORM)
  const [payment, setPayment] = useState(null)
  const [apiError, setApiError] = useState('')
  
  if (!bookingId) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-surface-200 rounded-xl2 shadow-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Booking Required</h1>
          <p className="text-sm text-ink-500 leading-relaxed mb-6">
            You need to request a booking from a listing page first before making a payment.
          </p>
          <div className="flex gap-3">
            <Link
              to={`/listings/${id}`}
              className="flex-1 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Back to Listing
            </Link>
            <Link
              to="/listings"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const validate = () => {
    const digits = phone.replace(/\D/g, '')
    if (!digits || digits.length < 9) {
      setPhoneErr('Enter a valid Cameroon Mobile Money number.')
      return false
    }
    setPhoneErr('')
    return true
  }

  const handlePay = async () => {
    if (!validate()) return
    setStep(STEP.PROCESSING)
    setApiError('')

    try {
      // POST /api/payments  body: { BookingId }
      // Returns PaymentResponse: { Id, BookingId, PayerId, Provider, Amount,
      //   Currency, ProviderReference, CheckoutUrl, Status, CreatedAtUtc }
      const result = await api.payments.initiate(bookingId)
      setPayment(result)

      // If the API returns a CheckoutUrl (e.g. for a real payment gateway),
      // redirect the user there. Otherwise simulate success for demo.
      if (result.CheckoutUrl) {
        window.location.href = result.CheckoutUrl
        return
      }

      // For demo / admin-mark-paid flow — show success immediately
      setStep(STEP.SUCCESS)
    } catch (e) {
      console.error('Payment error:', e)
      setApiError(
        e.response?.data?.Message ||
        e.response?.data?.errors ||
        'Payment initiation failed. Please try again.'
      )
      setStep(STEP.ERROR)
    }
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <h1 className="font-display font-bold text-3xl text-ink-900">Complete Your Booking</h1>
        <p className="text-ink-500 mt-2 max-w-md text-sm leading-relaxed">
          Pay via Mobile Money to confirm your booking. The landlord will be notified immediately.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}
        className="w-full max-w-lg"
      >
        {/* Booking summary card */}
        <div className="bg-white rounded-t-xl2 border border-surface-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-ink-400 mb-1">BOOKING DETAILS</p>
              <h2 className="font-display font-bold text-xl text-ink-900 leading-tight">
                {listing?.Title || 'Property Booking'}
              </h2>
              <p className="text-sm text-ink-500 mt-1">
                {listing?.City}, {listing?.Region}
              </p>
              {nights > 0 && (
                <p className="text-xs text-ink-400 mt-1">{nights} night{nights > 1 ? 's' : ''}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold tracking-widest text-ink-400 mb-1">TOTAL</p>
              <p className="font-display font-extrabold text-3xl text-primary-600 leading-none">
                {Number(total || listing?.PricePerNight || 0).toLocaleString()}
              </p>
              <p className="font-display font-bold text-lg text-primary-600">
                {listing?.Currency || 'XAF'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment body */}
        <div className="bg-white border-x border-b border-surface-200 rounded-b-xl2 px-6 py-6">
          <AnimatePresence mode="wait">

            {/*  FORM  */}
            {step === STEP.FORM && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-sm font-semibold text-ink-700 mb-3">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {providers.map(p => (
                    <button key={p.id} onClick={() => setProvider(p.id)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${
                        provider === p.id
                          ? `${p.border} bg-primary-50`
                          : 'border-surface-200 hover:border-surface-300'
                      }`}>
                      <div className={`w-11 h-11 rounded-full ${p.color} flex items-center justify-center`}>
                        <span className={`text-xs font-extrabold ${p.text}`}>{p.short}</span>
                      </div>
                      <span className={`text-sm font-semibold ${provider === p.id ? 'text-primary-600' : 'text-ink-700'}`}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Mobile Money Number
                </label>
                <div className={`flex items-center border-2 rounded-xl px-3 py-2.5 transition-colors ${
                  phoneErr ? 'border-red-400' : 'border-surface-200 focus-within:border-primary-400'
                }`}>
                  <span className="text-sm font-medium text-ink-500 mr-2">+237</span>
                  <input
                    type="tel"
                    placeholder="67 12 34 56"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneErr('') }}
                    className="flex-1 text-sm outline-none text-ink-900 placeholder:text-ink-300"
                  />
                </div>
                {phoneErr && <p className="text-xs text-red-500 mt-1.5">{phoneErr}</p>}

                <div className="flex items-start gap-2.5 bg-surface-100 rounded-xl p-4 mt-4 mb-5">
                  <Info className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-600 leading-relaxed">
                    You will receive a prompt on your phone to confirm the payment.
                    Please have your phone nearby.
                  </p>
                </div>

                <button onClick={handlePay}
                  className="w-full bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all text-white font-bold py-4 rounded-xl text-base">
                  Pay {Number(total || 0).toLocaleString()} {listing?.Currency || 'XAF'}
                </button>
              </motion.div>
            )}

            {/*  PROCESSING  */}
            {step === STEP.PROCESSING && (
              <motion.div key="processing"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center py-10 gap-4">
                <Loader2 className="w-14 h-14 animate-spin text-primary-600" />
                <p className="font-display font-semibold text-ink-900 text-lg">Processing Payment…</p>
                <p className="text-sm text-ink-500 text-center max-w-xs">
                  Check your phone for the {provider === 'MTN' ? 'MTN MoMo' : 'Orange Money'} prompt
                  and enter your PIN to confirm.
                </p>
              </motion.div>
            )}

            {/*  SUCCESS  */}
            {step === STEP.SUCCESS && (
              <motion.div key="success"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="flex flex-col items-center py-6 gap-4">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}>
                  <CheckCircle2 className="w-16 h-16 text-primary-600" />
                </motion.div>

                <div className="text-center">
                  <h3 className="font-display font-bold text-xl text-ink-900">Booking Confirmed!</h3>
                  <p className="text-sm text-ink-500 mt-1">
                    Your payment was received. The landlord has been notified.
                  </p>
                </div>

                {/* Payment reference */}
                {payment?.ProviderReference && (
                  <div className="w-full bg-surface-50 border border-surface-200 rounded-xl p-4 text-sm">
                    <p className="text-xs font-semibold text-ink-400 mb-1">PAYMENT REFERENCE</p>
                    <div className="flex items-center">
                      <span className="font-mono text-ink-800">{payment.ProviderReference}</span>
                      <CopyButton value={payment.ProviderReference} />
                    </div>
                  </div>
                )}

                <div className="w-full bg-primary-50 border border-primary-200 rounded-xl p-5">
                  <p className="text-xs font-semibold tracking-wider text-primary-500 mb-1">WHAT HAPPENS NEXT</p>
                  <ul className="text-sm text-ink-700 space-y-1.5 list-disc list-inside">
                    <li>Landlord reviews and approves your booking</li>
                    <li>You'll get a notification once approved</li>
                    <li>Contact details unlock after approval</li>
                  </ul>
                </div>

                <p className="text-xs text-ink-400 text-center leading-relaxed">
                  Track your booking in your{' '}
                  <Link to="/dashboard" className="text-primary-600 hover:underline font-medium">Dashboard</Link>.
                </p>

                <div className="flex gap-3 w-full">
                  <Link to="/listings"
                    className="flex-1 text-center border-2 border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold py-3 rounded-xl text-sm transition-colors">
                    Browse More
                  </Link>
                  <Link to="/dashboard"
                    className="flex-1 text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                    Go to Dashboard
                  </Link>
                </div>
              </motion.div>
            )}

            {/*  ERROR  */}
            {step === STEP.ERROR && (
              <motion.div key="error"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center py-8 gap-4">
                <AlertCircle className="w-14 h-14 text-red-500" />
                <div className="text-center">
                  <h3 className="font-display font-bold text-xl text-ink-900">Payment Failed</h3>
                  <p className="text-sm text-red-500 mt-1">{apiError}</p>
                </div>
                <button onClick={() => { setStep(STEP.FORM); setApiError('') }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                  Try Again
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Secure badge */}
        {step === STEP.FORM && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-ink-400">
            <Lock className="w-3.5 h-3.5" /> Your payment is secure and encrypted.
          </div>
        )}

        {/* Back link */}
        {(step === STEP.FORM || step === STEP.ERROR) && (
          <div className="text-center mt-5">
            <Link to={`/listings/${id}`}
              className="text-sm text-ink-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to property details
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}
