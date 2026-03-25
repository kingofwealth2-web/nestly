import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: '#090F1A', color: 'rgba(255,255,255,.55)', padding: '3rem 2rem 1.5rem' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>

          <div>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, background: 'var(--teal)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#fff' }}>
                Nest<span style={{ color: '#5DD6C8' }}>ly</span>
              </span>
            </Link>
            <p style={{ fontSize: 13, lineHeight: 1.7, marginTop: '.75rem', maxWidth: 200 }}>
              Your local discovery platform. Find the best places, book with confidence.
            </p>
          </div>

          <FooterCol title="Explore" links={[
            { label: 'Browse listings', to: '/listings' },
            { label: 'Map view', to: '/listings?view=map' },
            { label: 'Categories', to: '/listings' },
            { label: 'Trending', to: '/listings' },
          ]} />

          <FooterCol title="Account" links={[
            { label: 'Sign in', to: '/login' },
            { label: 'Register', to: '/register' },
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'Add listing', to: '/dashboard/listings/add' },
          ]} />

          <FooterCol title="Helpful links" links={[
            { label: 'My bookings', to: '/dashboard/bookings' },
            { label: 'Reviews', to: '/dashboard/reviews' },
            { label: 'Bookmarks', to: '/dashboard/bookmarks' },
            { label: 'Wallet', to: '/dashboard/wallet' },
          ]} />
        </div>

        <div style={{
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255,255,255,.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12
        }}>
          <span>© {new Date().getFullYear()} Nestly. All rights reserved.</span>
          <span>Built by <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.45)", textDecoration: "none" }}>Prince Anquandah</a></span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: '.75rem' }}>{title}</h4>
      {links.map((l, i) => (
        <Link key={i} to={l.to} style={{
          display: 'block', fontSize: 13,
          color: 'rgba(255,255,255,.45)', textDecoration: 'none',
          padding: '.25rem 0'
        }}>{l.label}</Link>
      ))}
    </div>
  )
}