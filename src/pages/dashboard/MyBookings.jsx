import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { StatusBadge } from './StatusBadge'

export default function MyBookings() {
  const { user, profile } = useAuth()
  const [tab, setTab] = useState('mine') // mine | received
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => { fetchBookings() }, [tab, user])

  async function fetchBookings() {
    setLoading(true)
    let query = supabase
      .from('bookings')
      .select('*, listings(title, city, cover_image)')
      .order('created_at', { ascending: false })

    if (tab === 'mine') query = query.eq('user_id', user.id)
    else query = query.eq('owner_id', user.id)

    const { data } = await query
    setBookings(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    setUpdating(id)
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    setUpdating(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>Bookings</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1.5px solid var(--border)', marginBottom: '1.5rem' }}>
        {[
          { key: 'mine', label: 'My bookings' },
          { key: 'received', label: 'Received bookings' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '.75rem 1.25rem', border: 'none', borderBottom: tab === t.key ? '2.5px solid var(--teal)' : '2.5px solid transparent', background: 'transparent', color: tab === t.key ? 'var(--teal)' : 'var(--text-mid)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', marginBottom: '-1.5px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>Loading...</div>
      ) : bookings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', color: 'var(--text)', marginBottom: '.5rem' }}>No bookings yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-light)' }}>
            {tab === 'mine' ? <><Link to="/listings" style={{ color: 'var(--teal)' }}>Browse listings</Link> to make your first booking.</> : 'Bookings from customers will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(b => (
            <div key={b.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{b.listings?.title}</h3>
                    <StatusBadge status={b.status} />
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: 13, color: 'var(--text-light)', flexWrap: 'wrap' }}>
                    <span>📍 {b.listings?.city}</span>
                    <span>📅 {b.date}{b.time ? ` at ${b.time}` : ''}</span>
                    <span>👥 {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>
                    {b.amount > 0 && <span>💰 GH₵{b.amount}</span>}
                  </div>
                  {b.notes && <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: '.5rem', fontStyle: 'italic' }}>"{b.notes}"</p>}
                </div>

                {/* Actions for received bookings */}
                {tab === 'received' && b.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                    <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={updating === b.id} style={{ padding: '.45rem .9rem', background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 7, color: '#059669', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Confirm
                    </button>
                    <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={updating === b.id} style={{ padding: '.45rem .9rem', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 7, color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                      Decline
                    </button>
                  </div>
                )}

                {/* Cancel own booking */}
                {tab === 'mine' && b.status === 'pending' && (
                  <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={updating === b.id} style={{ padding: '.45rem .9rem', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 7, color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}