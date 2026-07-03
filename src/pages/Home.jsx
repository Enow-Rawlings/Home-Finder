import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, MapPin, Home as HomeIcon, ShieldCheck, BadgeCheck, MessageSquare, ArrowRight, Clock } from 'lucide-react'
import { mockListings } from '../services/mockData'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

const features = [
  {
    icon: BadgeCheck,
    title: 'Self-Expiring Listings',
    desc: 'Every listing auto-hides after 48 hours unless the landlord re-verifies it\u2019s still vacant. No more wasted trips on outdated posts.',
  },
  {
    icon: ShieldCheck,
    title: 'No Démarcheurs',
    desc: 'Skip the dishonest middlemen. Unlock verified landlord contacts directly for a flat 500 CFA fee via Mobile Money.',
  },
  {
    icon: MessageSquare,
    title: 'Direct Contact',
    desc: 'Message landlords directly once you unlock a listing  ask questions and book viewings without a go-between.',
  },
]

export default function Home() {
  return (
    <div>
      <section className="relative">
        <div
          className="relative h-[560px] bg-cover bg-center flex items-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(11,22,53,0.65), rgba(11,22,53,0.55)), url('https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?q=80&w=1600&auto=format&fit=crop')",
          }}
        >
          <div className="max-w-7xl mx-auto px-6 w-full">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="max-w-2xl"
            >
              <h1 className="text-white font-display font-extrabold text-4xl md:text-5xl leading-tight">
                Find Verified Homes You Can Trust
              </h1>
              <p className="text-surface-100/90 mt-4 text-lg">
                No démarcheurs, no dead listings. Every apartment is
                re-verified every 48 hours guaranteed available.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={1}
              initial="hidden"
              animate="show"
              className="mt-8 bg-white rounded-xl shadow-cardHover p-2 flex flex-col md:flex-row gap-2 max-w-3xl"
            >
              <div className="flex items-center gap-2 px-3 py-2 flex-1">
                <MapPin className="w-4 h-4 text-ink-500" />
                <input
                  placeholder="Location (e.g. Molyko, Buea)"
                  className="w-full outline-none text-sm text-ink-800 placeholder:text-ink-300"
                />
              </div>
              <div className="hidden md:block w-px bg-surface-200" />
              <div className="flex items-center gap-2 px-3 py-2 flex-1">
                <HomeIcon className="w-4 h-4 text-ink-500" />
                <select className="w-full outline-none text-sm text-ink-800 bg-transparent">
                  <option>Property Type</option>
                  <option>Studio</option>
                  <option>1 Bedroom</option>
                  <option>2 Bedroom</option>
                  <option>House</option>
                </select>
              </div>
              <div className="hidden md:block w-px bg-surface-200" />
              <div className="flex items-center gap-2 px-3 py-2 flex-1">
                <span className="text-ink-500 text-sm">CFA</span>
                <input
                  placeholder="Min Price"
                  className="w-full outline-none text-sm text-ink-800 placeholder:text-ink-300"
                />
              </div>
              <Link
                to="/listings"
                className="bg-primary-600 hover:bg-primary-700 transition-colors text-white font-semibold text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                Search
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-10 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              custom={i}
              variants={fadeUp}
              className="bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow p-6"
            >
              <div className="w-11 h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-display font-semibold text-lg text-ink-900 mb-1.5">
                {f.title}
              </h3>
              <p className="text-sm text-ink-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
          <div className="bg-white rounded-2xl shadow-card p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">About Us</p>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-3">
              Trusted homes, direct landlord contact, and zero middlemen.
            </h2>
            <p className="text-ink-500 mt-4 leading-relaxed">
              Home Finder helps renters and landlords in Cameroon connect quickly with verified listings that are re-checked every 48 hours. We make it easy to browse, book viewings, and list properties with confidence.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-600">
              <li>• Verified listings with clear availability.</li>
              <li>• Safe direct communication with landlords.</li>
              <li>• Simple tools for property owners to list and manage homes.</li>
            </ul>
          </div>
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8">
            <h3 className="font-display font-semibold text-xl text-ink-900">Why people choose us</h3>
            <div className="mt-6 space-y-4 text-sm text-ink-600">
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-ink-900">Fast and transparent</p>
                <p className="mt-1">No hidden agents, no confusing steps.</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-ink-900">Built for Cameroon</p>
                <p className="mt-1">Local listings, local support, and mobile-friendly tools.</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-semibold text-ink-900">Always current</p>
                <p className="mt-1">Listings are re-verified often so you can trust what you see.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-2">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-ink-900">
            Available Now
          </h2>
          <Link
            to="/listings"
            className="text-primary-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="text-ink-500 text-sm mb-8">
          Re-verified by landlords within the last 48 hours.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockListings.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              variants={fadeUp}
              className="bg-white rounded-xl2 shadow-card hover:shadow-cardHover transition-shadow overflow-hidden group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {listing.verified ? (
                  <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 bg-ink-700 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Expiring Soon
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display font-semibold text-ink-900">
                  {listing.title}
                </h3>
                <p className="text-sm text-ink-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {listing.location}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-primary-600 font-bold">
                    {listing.price.toLocaleString()} CFA
                    <span className="text-ink-400 font-normal text-xs">/mo</span>
                  </span>
                  <Link
                    to={`/listings/${listing.id}`}
                    className="text-sm font-semibold bg-surface-100 hover:bg-primary-50 hover:text-primary-600 text-ink-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-surface-50 rounded-3xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">What our customers say</p>
              <h2 className="font-display font-bold text-2xl md:text-3xl text-ink-900 mt-2">
                Happy renters and landlords rely on Home Finder every day.
              </h2>
            </div>
            <Link to="/register" className="text-sm font-semibold text-primary-600 hover:underline">
              Join now
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'I found a verified apartment in just a few minutes and avoided the usual middlemen.',
                author: 'Gilbert, Buea',
              },
              {
                quote: 'Listing my property became much easier. The dashboard gives me everything I need in one place.',
                author: 'Rawlings, Douala',
              },
              {
                quote: 'The platform feels trustworthy and current. I no longer waste time on outdated listings.',
                author: 'Grace, Yaoundé',
              },
            ].map((item) => (
              <div key={item.author} className="bg-white rounded-2xl p-6 shadow-card">
                <p className="text-sm text-ink-600 leading-relaxed">“{item.quote}”</p>
                <p className="mt-4 font-semibold text-ink-900">{item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
