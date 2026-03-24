import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MyBookmarks() {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchBookmarks() }, [user])

  async function fetchBookmarks() {
    const { data } = await supabase
      .from('bookmarks')
      .select('*, listings(id, title, city, cover_image, avg_rating, review_count, price_range, categories(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setBookmarks(data || [])
    setLoading(false)
  }

  async function removeBookmark(id) {
    await supabase.from('bookmarks').delete().eq('id', id)
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>Bookmarks</h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: '.2rem' }}>{bookmarks.length} saved listing{bookmarks.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>Loading...</div>
      ) : bookmarks.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>❤️</div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', color: 'var(--text)', marginBottom: '.5rem' }}>No bookmarks yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: '1.5rem' }}>Save listings you love to find them easily later.</p>
          <Link to="/listings" style={{ padding: '.65rem 1.5rem', background: 'var(--teal)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Browse listings</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {bookmarks.map(b => {
            const l = b.listings
            if (!l) return null
            return (
              <div key={b.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ height: 160, background: 'linear-gradient(135deg,#0B6157,#1a9e8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', position: 'relative', overflow: 'hidden' }}>
                  {l.cover_image ? <img src={l.cover_image} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
                  <button onClick={() => removeBookmark(b.id)} style={{ position: 'absolute', top: '.65rem', right: '.65rem', width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', fontSize: 16 }}>♥</button>
                </div>
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.25rem' }}>{l.categories?.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: '.25rem' }}>{l.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: '.75rem' }}>📍 {l.city}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '.15rem' }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(l.avg_rating || 0) ? '#F59E0B' : 'var(--border)', fontSize: 12 }}>★</span>)}
                      <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: '.2rem' }}>({l.review_count || 0})</span>
                    </div>
                    <Link to={`/listings/${l.id}`} style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500, textDecoration: 'none' }}>View →</Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
