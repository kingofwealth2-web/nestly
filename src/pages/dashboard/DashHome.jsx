import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function DashHome() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState({ listings: 0, bookings: 0, reviews: 0, bookmarks: 0 })
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentBookings()
  }, [user])

  async function fetchStats() {
    const [listings, bookings, reviews, bookmarks] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact' }).eq('owner_id', user.id),
      supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('reviews').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('bookmarks').select('id', { count: 'exact' }).eq('user_id', user.id),
    ])
    setStats({
      listings: listings.count || 0,
      bookings: bookings.count || 0,
      reviews: reviews.count || 0,
      bookmarks: bookmarks.count || 0,
    })
    setLoading(false)
  }

  async function fetchRecentBookings() {
    const { data } = await supabase
      .from('bookings')
      .select('*, listings(title, city)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    setRecentBookings(data || [])
  }

  const statCards = [
    { label: 'My listings', value: stats.listings, to: '/dashboard/listings', color: 'var(--teal)', bg: 'var(--teal-pale)', icon: '🏠' },
    { label: 'Bookings made', value: stats.bookings, to: '/dashboard/bookings', color: '#7C3AED', bg: '#F0EEFF', icon: '📅' },
    { label: 'Reviews written', value: stats.reviews, to: '/dashboard/reviews', color: '#D97706', bg: '#FEF3E8', icon: '⭐' },
    { label: 'Bookmarks', value: stats.bookmarks, to: '/dashboard/bookmarks', color: '#DC2626', bg: '#FEF2F2', icon: '❤️' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)', marginBottom: '.25rem' }}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)' }}>Here's what's happening with your account.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(s => (
          <Link key={s.to} to={s.to} style={{ textDecoration: 'none' }}>
            <div className="card-hover" style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: '.85rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: '.25rem' }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Wallet balance */}
      <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: '.35rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>Wallet balance</p>
          <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2rem', color: '#fff' }}>GH₵ {profile?.wallet_balance?.toFixed(2) || '0.00'}</p>
        </div>
        <Link to="/dashboard/wallet" style={{ padding: '.6rem 1.25rem', background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 9, color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          View wallet →
        </Link>
      </div>

      {/* Recent bookings */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: 'var(--text)' }}>Recent bookings</h2>
          <Link to="/dashboard/bookings" style={{ fontSize: 13, color: 'var(--teal)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
        </div>
        {recentBookings.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-light)', padding: '1rem 0' }}>No bookings yet. <Link to="/listings" style={{ color: 'var(--teal)' }}>Browse listings</Link></p>
        ) : (
          <div>
            {recentBookings.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 0', borderBottom: '1.5px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{b.listings?.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: '.15rem' }}>{b.date} · {b.guests} guest{b.guests !== 1 ? 's' : ''}</div>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    pending: { bg: '#FEF3E8', color: '#D97706', label: 'Pending' },
    confirmed: { bg: '#ECFDF5', color: '#059669', label: 'Confirmed' },
    cancelled: { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
    completed: { bg: 'var(--teal-pale)', color: 'var(--teal)', label: 'Completed' },
  }
  const s = map[status] || map.pending
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>{s.label}</span>
}