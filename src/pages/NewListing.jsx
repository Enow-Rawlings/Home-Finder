
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle2, Loader2, ImagePlus, AlertCircle } from 'lucide-react'
import api from '../services/api'

const CM_CITIES = [
  'Yaoundé','Douala','Bafoussam','Bamenda','Garoua','Maroua','Ngaoundéré',
  'Bertoua','Ebolowa','Kribi','Limbé','Buea','Kumba','Edéa','Loum',
  'Nkongsamba','Mbouda','Dschang','Foumban','Sangmélima',
]
const REGIONS = {
  'Yaoundé':'Centre','Douala':'Littoral','Bafoussam':'West','Bamenda':'North West',
  'Garoua':'North','Maroua':'Far North','Ngaoundéré':'Adamawa',
  'Bertoua':'East','Ebolowa':'South','Kribi':'South','Limbé':'South West',
  'Buea':'South West','Kumba':'South West','Edéa':'Littoral','Loum':'Littoral',
  'Nkongsamba':'Littoral','Mbouda':'West','Dschang':'West',
  'Foumban':'West','Sangmélima':'South',
}
const TYPES     = ['Apartment','Studio','House','Villa','Room','Commercial']
const AMENITIES = [
  'WiFi','Generator','Water Supply','Security',
  'Parking','Balcony','Pool','Gym','Kitchen','Air Conditioning',
]

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-surface-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-400 transition-colors'

export default function NewListing() {
  const navigate = useNavigate()

  const [step,      setStep]      = useState(1)   // 1=details 2=photos 3=done
  const [listingId, setListingId] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [photos,    setPhotos]    = useState([])  // { file, preview, uploading, done, error }
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    Title: '', Description: '', Type: 'Apartment',
    Address: '', City: '', Region: '', Country: 'Cameroon',
    PricePerNight: '', Currency: 'XAF',
    Bedrooms: 1, Bathrooms: 1, MaxGuests: 2,
    Amenities: [],
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleCityChange = (city) => {
    set('City', city)
    set('Region', REGIONS[city] || '')
  }

  const toggleAmenity = (a) => set('Amenities',
    form.Amenities.includes(a)
      ? form.Amenities.filter(x => x !== a)
      : [...form.Amenities, a]
  )

  //  Step 1: Create draft 
  const handleCreate = async () => {
    setError('')
    if (!form.Title.trim())     { setError('Title is required.'); return }
    if (!form.City)             { setError('City is required.'); return }
    if (!form.Address.trim())   { setError('Address is required.'); return }
    if (!form.PricePerNight)    { setError('Price is required.'); return }

    setSaving(true)
    try {
      const res = await api.listings.create({
        ...form,
        PricePerNight: Number(form.PricePerNight),
        Bedrooms:      Number(form.Bedrooms),
        Bathrooms:     Number(form.Bathrooms),
        MaxGuests:     Number(form.MaxGuests),
      })
      setListingId(res.Id)
      setStep(2)
    } catch (e) {
      console.error('Create listing error:', e.response?.data)
      const errs = e.response?.data?.Errors
      if (errs) {
        // FastEndpoints returns { Errors: { field: [msg] } }
        const msg = Object.values(errs).flat().join(' ')
        setError(msg)
      } else {
        setError(e.response?.data?.Message || 'Failed to create listing. Check all fields.')
      }
    } finally { setSaving(false) }
  }

  //  Step 2: Photo handling 
  const handlePhotoSelect = (e) => {
    const allowed = 2 - photos.length
    const files   = Array.from(e.target.files).slice(0, allowed)
    const newPhotos = files.map(file => ({
      file,
      preview:   URL.createObjectURL(file),
      uploading: false,
      done:      false,
      error:     '',
    }))
    setPhotos(p => [...p, ...newPhotos])
 
    e.target.value = ''
  }

  const removePhoto = (i) => {
    setPhotos(p => {
      URL.revokeObjectURL(p[i].preview)
      return p.filter((_, idx) => idx !== i)
    })
  }

  const uploadAll = async () => {
    setUploading(true)
    const updated = [...photos]

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].done) continue

      updated[i] = { ...updated[i], uploading: true, error: '' }
      setPhotos([...updated])

      try {
        const fd = new FormData()
        // The field name must match what gilberts API expects.
        // i need gilberts confirmation on this.
        // ASP.NET Core default is "file" for IFormFile.
        // If uploads fail,  gilbert what field name they used.
        fd.append('file', updated[i].file)

        await api.photos.upload(listingId, fd)
        updated[i] = { ...updated[i], uploading: false, done: true }
      } catch (e) {
        console.error('Photo upload error:', e.response?.data)
        updated[i] = {
          ...updated[i],
          uploading: false,
          error: e.response?.data?.Message || 'Upload failed',
        }
      }
      setPhotos([...updated])
    }

    setUploading(false)

    await submitForVerification()
  }

  const submitForVerification = async () => {
    try {
      await api.listings.submitForVerification(listingId)
    } catch (e) {
     
      console.warn('Submit for verification:', e.response?.data)
    }
    setStep(3)
  }

  //  Step 3: Done 
  if (step === 3) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-cardHover p-10 max-w-md w-full text-center"
      >
        <CheckCircle2 className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-ink-900 mb-2">Listing Submitted!</h2>
        <p className="text-sm text-ink-500 leading-relaxed mb-2">
          Your listing has been submitted for admin verification.
        </p>
        <p className="text-sm text-ink-500 leading-relaxed mb-6">
          It will appear in search results once an admin approves it.
          You'll receive a notification when that happens.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/listings/new')}
            className="flex-1 border-2 border-primary-600 text-primary-600 font-semibold py-3 rounded-xl text-sm hover:bg-primary-50 transition-colors">
            Add Another
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm transition-colors">
            My Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Progress steps */}
        <div className="flex items-center mb-8">
          {['Property Details', 'Upload Photos', 'Done'].map((label, i) => {
            const idx    = i + 1
            const active = step === idx
            const done   = step > idx
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-primary-600 text-white' : 'bg-surface-200 text-ink-400'
                  }`}>
                    {done ? '✓' : idx}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${active ? 'text-ink-900' : 'text-ink-400'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-surface-200 mx-3" />}
              </div>
            )
          })}
        </div>

        {/*  Step 1: Details  */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-7">
            <h1 className="font-display font-bold text-2xl text-ink-900 mb-1">List Your Property</h1>
            <p className="text-sm text-ink-400 mb-6">
              An admin will verify your listing before it goes live to house seekers.
            </p>

            <div className="space-y-4">
              <Field label="Property Title" required>
                <input value={form.Title} onChange={e => set('Title', e.target.value)}
                  placeholder="e.g. Cozy 2-Bedroom in Bastos" className={inputCls} />
              </Field>

              <Field label="Description">
                <textarea value={form.Description} onChange={e => set('Description', e.target.value)}
                  rows={3} placeholder="Describe the property, nearby amenities, rules…"
                  className={`${inputCls} resize-none`} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Property Type" required>
                  <select value={form.Type} onChange={e => set('Type', e.target.value)}
                    className={`${inputCls} bg-white`}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Price / Night (XAF)" required>
                  <input type="number" min="0" value={form.PricePerNight}
                    onChange={e => set('PricePerNight', e.target.value)}
                    placeholder="e.g. 75000" className={inputCls} />
                </Field>
              </div>

              <Field label="Street Address" required>
                <input value={form.Address} onChange={e => set('Address', e.target.value)}
                  placeholder="e.g. Rue de la Paix, Bastos" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City" required>
                  <select value={form.City} onChange={e => handleCityChange(e.target.value)}
                    className={`${inputCls} bg-white`}>
                    <option value="">Select city…</option>
                    {CM_CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Region">
                  <input value={form.Region} readOnly
                    placeholder="Auto-filled" className={`${inputCls} bg-surface-50 cursor-not-allowed text-ink-400`} />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[['Bedrooms','Bedrooms'],['Bathrooms','Bathrooms'],['Max Guests','MaxGuests']].map(([label,key]) => (
                  <Field key={key} label={label}>
                    <input type="number" min="0" value={form[key]}
                      onChange={e => set(key, e.target.value)} className={inputCls} />
                  </Field>
                ))}
              </div>

              <Field label="Amenities">
                <div className="flex flex-wrap gap-2 mt-1">
                  {AMENITIES.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        form.Amenities.includes(a)
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-surface-200 text-ink-600 hover:border-primary-400'
                      }`}>
                      {a}
                    </button>
                  ))}
                </div>
              </Field>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button onClick={handleCreate} disabled={saving}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                  : 'Save & Continue to Photos →'}
              </button>
            </div>
          </motion.div>
        )}

        {/*  Step 2: Photos  */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-7">
            <h2 className="font-display font-bold text-2xl text-ink-900 mb-1">Upload Photos</h2>
            <p className="text-sm text-ink-400 mb-2">
              Add up to 8 photos. Good photos significantly increase interest from house seekers.
            </p>
            <p className="text-xs text-primary-600 font-medium mb-6">
              ✓ Listing draft saved. Photos are optional but strongly recommended.
            </p>

            {/* Drop zone */}
            <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-5 ${
              photos.length >= 8 ? 'border-surface-200 opacity-50 cursor-not-allowed' : 'border-surface-300 hover:border-primary-400'
            }`}>
              <ImagePlus className="w-10 h-10 text-ink-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-ink-600">
                  {photos.length >= 2 ? 'Maximum 2 photos reached' : 'Click to add photos'}
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  JPG, PNG, WEBP — max 10MB each. {2 - photos.length} remaining.
                </p>
              <input
                type="file" accept="image/*" multiple
                disabled={photos.length >= 8}
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </label>

            {/* Preview grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-200 group">
                    <img src={p.preview} alt="" className="w-full h-full object-cover" />

                    {/* Overlay states */}
                    {p.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                    {p.done && (
                      <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </div>
                    )}
                    {p.error && (
                      <div className="absolute inset-0 bg-red-500/60 flex flex-col items-center justify-center gap-1 px-2">
                        <AlertCircle className="w-5 h-5 text-white" />
                        <span className="text-white text-[10px] text-center leading-tight">{p.error}</span>
                      </div>
                    )}

                    {/* Remove button */}
                    {!p.uploading && !p.done && (
                      <button onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}

                    {/* Cover badge on first photo */}
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-primary-600 text-white px-2 py-0.5 rounded font-semibold">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={submitForVerification}
                disabled={uploading}
                className="flex-1 border-2 border-surface-200 text-ink-600 hover:border-primary-400 font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                Skip — Submit Without Photos
              </button>
              <button
                onClick={uploadAll}
                disabled={uploading || photos.length === 0}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {uploading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                  : <><Upload className="w-4 h-4" /> Upload & Submit</>}
              </button>
            </div>

            <p className="text-xs text-ink-400 text-center mt-3">
              After submission, an admin will review and approve your listing.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}