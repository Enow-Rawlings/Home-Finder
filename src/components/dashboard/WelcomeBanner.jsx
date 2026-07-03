// components/dashboard/WelcomeBanner.jsx
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function WelcomeBanner({ userName, newListingsCount, location, isLoading }) {
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-6 sm:px-8 py-8"
    >
      <div className="max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {isLoading ? 'Welcome back!' : `Welcome back, ${userName || 'there'}!`}
        </h2>
        <p className="mt-3 text-slate-600 text-sm sm:text-base">
          {isLoading
            ? 'Loading your personalized recommendations...'
            : newListingsCount > 0
            ? `Find your perfect home with ease. We've curated ${newListingsCount} new listings matching your preferences${location ? ` in ${location}` : ''}.`
            : 'Find your perfect home with ease. New listings matching your preferences will show up here.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/properties')}
            className="bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
          >
            Explore Listings
          </button>
          <button
            onClick={() => navigate('/saved-listings')}
            className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
          >
            View Saved
          </button>
        </div>
      </div>
    </motion.section>
  );
}