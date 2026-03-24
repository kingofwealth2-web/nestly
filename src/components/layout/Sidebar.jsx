import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const linkStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '.65rem 1.5rem',
  color: 'rgba(255,255,255,.75)', fontSize: 14,
  textDecoration: 'none',
}

const sectionLabel = {
  fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
  textTransform: 'uppercase', color: 'rgba(255,255,255,.3)',
  padding: '.5rem 1.5rem .25rem'
}

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'All listings', to: '/listings' },
]

const listingLinks = [
  { label: 'List layout', to: '/listings?view=list' },
  { label: 'Grid layout', to: '/listings?view=grid' },
  { label: 'Map view', to: '/listings?view=map' },
  { label: 'Bookings', to: '/listings?view=bookings' },
]

const userLinks = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'My bookings', to: '/dashboard/bookings' },
  { label: 'Messages', to: '/dashboard/messages' },
  { label: 'Wallet', to: '/dashboard/wallet' },
  { label: 'My listings', to: '/dashboard/listings' },
  { label: 'Reviews', to: '/dashboard/reviews' },
  { label: 'Bookmarks', to: '/dashboard/bookmarks' },
  { label: 'Add listing', to: '/dashboard/listings/add' },
  { label: 'My profile', to: '/dashboard/profile' },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,15,25,.6)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity .3s',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sidebar */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
        width: 280, background: 'var(--navy)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,.08)'
        }}>
          <Link to="/" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: 'var(--teal)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#fff' }}>
              Nest<span style={{ color: '#5DD6C8' }}>ly</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, border: 'none',
              background: 'rgba(255,255,255,.08)', borderRadius: 6,
              color: 'rgba(255,255,255,.7)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <SidebarSection label="Navigation" links={navLinks} onClose={onClose} />
        <SidebarSection label="Listings" links={listingLinks} onClose={onClose} />
        {user && <SidebarSection label="User panel" links={userLinks} onClose={onClose} />}
        {!user && (
          <div style={{ padding: '.75rem 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={sectionLabel}>Account</div>
            <Link to="/login" style={linkStyle} onClick={onClose}>Sign in <Chevron/></Link>
            <Link to="/register" style={linkStyle} onClick={onClose}>Register <Chevron/></Link>
          </div>
        )}

        {/* Contact */}
        <div style={{ padding: '1.25rem 1.5rem', marginTop: 'auto' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.7 }}>
            123 Independence Ave, Accra<br/>
            +233 00 000 0000<br/>
            <a href="mailto:hello@nestly.com" style={{ color: '#5DD6C8', textDecoration: 'none' }}>hello@nestly.com</a>
          </p>
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
            {['X', 'in', '✉', '📷'].map(s => (
              <div key={s} style={{
                width: 32, height: 32, background: 'rgba(255,255,255,.08)',
                borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer'
              }}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function SidebarSection({ label, links, onClose }) {
  return (
    <div style={{ padding: '.75rem 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      <div style={sectionLabel}>{label}</div>
      {links.map(l => (
        <Link key={l.to} to={l.to} style={linkStyle} onClick={onClose}>
          {l.label} <Chevron/>
        </Link>
      ))}
    </div>
  )
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: .5 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}