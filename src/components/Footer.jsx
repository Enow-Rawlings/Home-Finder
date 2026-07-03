import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Platform',
    links: ['Terms of Service', 'Privacy Policy', 'Cookies'],
  },
  {
    title: 'Company',
    links: ['About Us', 'How It Works', 'Contact'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Safety Guide'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-surface-100 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-display font-extrabold text-lg mb-2">
            Home<span className="text-primary-300">Finder</span>
          </h3>
          <p className="text-sm text-ink-300 max-w-xs">
            Verified rentals, no démarcheurs. Listings expire every 48 hours
            so what you see is what's actually available.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="font-semibold text-sm mb-3 text-white">{col.title}</h4>
            <ul className="space-y-2 text-sm text-ink-300">
              {col.links.map((l) => (
                <li key={l}>
                  <Link to="#" className="hover:text-primary-300 transition-colors">
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-700 py-5 text-center text-xs text-ink-300">
        © {new Date().getFullYear()} Home Finder. Your Comfort, Our Priority.
      </div>
    </footer>
  )
}
