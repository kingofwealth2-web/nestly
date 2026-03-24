import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// Sub-pages
import DashHome from './DashHome'
import MyListings from './MyListings'
import AddListing from './AddListing'
import MyBookings from './MyBookings'
import MyBookmarks from './MyBookmarks'
import MyReviews from './MyReviews'
import MyProfile from './MyProfile'
import MyWallet from './MyWallet'
import Messages from './Messages'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', exact: true, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { to: '/dashboard/listings', label: 'My listings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg> },
  { to: '/dashboard/bookings', label: 'Bookings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { to: '/dashboard/messages', label: 'Messages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
  { to: '/dashboard/bookmarks', label: 'Bookmarks', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg> },
  { to: '/dashboard/reviews', label: 'Reviews', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { to: '/dashboard/wallet', label: 'Wallet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg> },
  { to: '/dashboard/profile', label: 'Profile', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
]

// Bottom tab bar shows only the most important 5 items on mobile
const mobileTabItems = [
  navItems[0], // Dashboard
  navItems[1], // My listings
  navItems[2], // Bookings
  navItems[3], // Messages
  navItems[7], // Profile
]

export default function Dashboard() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '240px 1fr', minHeight: 'calc(100vh - 60px)', background: 'var(--cream)' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ background: '#fff', borderRight: '1.5px solid var(--border)', padding: '1.5rem 0', position: 'sticky', top: 60, height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
          <div style={{ padding: '0 1.25rem 1rem', borderBottom: '1.5px solid var(--border)', marginBottom: '.75rem' }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-light)' }}>User panel</p>
          </div>
          {navItems.map(item => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.65rem 1.25rem',
                color: active ? 'var(--teal)' : 'var(--text-mid)',
                background: active ? 'var(--teal-pale)' : 'transparent',
                borderRight: active ? '3px solid var(--teal)' : '3px solid transparent',
                textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
                transition: 'all .15s',
              }}>
                {item.icon}
                {item.label}
              </Link>
            )
          })}
          <div style={{ padding: '1rem 1.25rem', marginTop: '1rem', borderTop: '1.5px solid var(--border)' }}>
            <Link to="/dashboard/listings/add" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
              padding: '.65rem', background: 'var(--teal)', color: '#fff',
              borderRadius: 9, textDecoration: 'none', fontSize: 13, fontWeight: 600,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add listing
            </Link>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main style={{ padding: isMobile ? '1.25rem 1rem 90px' : '2rem', minWidth: 0 }}>
        <Routes>
          <Route index element={<DashHome />} />
          <Route path="listings" element={<MyListings />} />
          <Route path="listings/add" element={<AddListing />} />
          <Route path="listings/edit/:id" element={<AddListing />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="bookmarks" element={<MyBookmarks />} />
          <Route path="reviews" element={<MyReviews />} />
          <Route path="wallet" element={<MyWallet />} />
          <Route path="profile" element={<MyProfile />} />
        </Routes>
      </main>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: '#fff', borderTop: '1.5px solid var(--border)',
          display: 'flex', alignItems: 'stretch',
          height: 64, paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
          {mobileTabItems.map(item => {
            const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '3px',
                  textDecoration: 'none',
                  color: active ? 'var(--teal)' : 'var(--text-light)',
                  borderTop: active ? '2px solid var(--teal)' : '2px solid transparent',
                  background: active ? 'var(--teal-pale)' : 'transparent',
                  transition: 'all .15s',
                  fontSize: 10, fontWeight: active ? 600 : 400,
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
          {/* "More" button linking to wallet/bookmarks/reviews */}
          <Link
            to="/dashboard/wallet"
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '3px',
              textDecoration: 'none',
              color: ['/dashboard/wallet', '/dashboard/bookmarks', '/dashboard/reviews'].some(p => location.pathname.startsWith(p)) ? 'var(--teal)' : 'var(--text-light)',
              borderTop: ['/dashboard/wallet', '/dashboard/bookmarks', '/dashboard/reviews'].some(p => location.pathname.startsWith(p)) ? '2px solid var(--teal)' : '2px solid transparent',
              background: ['/dashboard/wallet', '/dashboard/bookmarks', '/dashboard/reviews'].some(p => location.pathname.startsWith(p)) ? 'var(--teal-pale)' : 'transparent',
              transition: 'all .15s',
              fontSize: 10, fontWeight: 400,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            <span>More</span>
          </Link>
        </nav>
      )}
    </div>
  )
}