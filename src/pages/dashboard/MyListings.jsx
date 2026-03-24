import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MyListings() {
  const { user } = useAuth()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchListings() }, [user])

  async function fetchListings() {
    const { data } = await supabase
      .from('listings')
      .select('*, categories(name)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  async function deleteListing(id) {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return
    setDeleting(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeleting(null)
  }

  async function toggleStatus(listing) {
    const newStatus = listing.status === 'active' ? 'inactive' : 'active'
    await supabase.from('listings').update({ status: newStatus }).eq('id', listing.id)
    setListings(prev => prev.map(l => l.id === listing.id ? { ...l, status: newStatus } : l))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>My listings</h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: '.2rem' }}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/dashboard/listings/add" style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.65rem 1.25rem', background: 'var(--teal)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add listing
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>Loading...</div>
      ) : listings.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏠</div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', color: 'var(--text)', marginBottom: '.5rem' }}>No listings yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: '1.5rem' }}>Add your first listing to start receiving bookings.</p>
          <Link to="/dashboard/listings/add" style={{ padding: '.65rem 1.5rem', background: 'var(--teal)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Add your first listing</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {listings.map(l => (
            <div key={l.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: 120, flexShrink: 0, background: 'linear-gradient(135deg,#0B6157,#1a9e8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden' }}>
                {l.cover_image ? <img src={l.cover_image} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
              </div>
              <div style={{ flex: 1, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l.categories?.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: l.status === 'active' ? '#ECFDF5' : '#F3F4F6', color: l.status === 'active' ? '#059669' : '#6B7280' }}>
                      {l.status}
                    </span>
                    {l.is_featured && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 600 }}>⭐ Featured</span>}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: '.25rem' }}>{l.title}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', display: 'flex', gap: '1rem' }}>
                    <span>📍 {l.city}</span>
                    <span>⭐ {l.avg_rating?.toFixed(1) || '0.0'} ({l.review_count || 0} reviews)</span>
                    {l.price_range && <span>💰 {l.price_range}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                  <button onClick={() => toggleStatus(l)} style={{ padding: '.5rem .9rem', border: '1.5px solid var(--border)', borderRadius: 7, background: '#fff', color: 'var(--text-mid)', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                    {l.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link to={`/dashboard/listings/edit/${l.id}`} style={{ padding: '.5rem .9rem', border: '1.5px solid var(--teal)', borderRadius: 7, background: 'var(--teal-pale)', color: 'var(--teal)', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>
                    Edit
                  </Link>
                  <button onClick={() => deleteListing(l.id)} disabled={deleting === l.id} style={{ padding: '.5rem .9rem', border: '1.5px solid #FECACA', borderRadius: 7, background: '#FEF2F2', color: '#DC2626', fontSize: 12, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>
                    {deleting === l.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
