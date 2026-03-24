import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MyReviews() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReviews() }, [user])

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*, listings(id, title, city)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function deleteReview(id) {
    if (!window.confirm('Delete this review?')) return
    await supabase.from('reviews').delete().eq('id', id)
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>My reviews</h1>
        <p style={{ fontSize: 14, color: 'var(--text-light)', marginTop: '.2rem' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''} written</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>Loading...</div>
      ) : reviews.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⭐</div>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.3rem', color: 'var(--text)', marginBottom: '.5rem' }}>No reviews yet</h3>
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: '1.5rem' }}>Visit a listing and share your experience.</p>
          <Link to="/listings" style={{ padding: '.65rem 1.5rem', background: 'var(--teal)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Browse listings</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <Link to={`/listings/${r.listings?.id}`} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', display: 'block', marginBottom: '.3rem' }}>
                    {r.listings?.title}
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '.5rem' }}>
                    <div style={{ display: 'flex', gap: '.15rem' }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? '#F59E0B' : 'var(--border)', fontSize: 14 }}>★</span>)}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>{r.comment}</p>}
                </div>
                <button onClick={() => deleteReview(r.id)} style={{ padding: '.4rem .8rem', background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 7, color: '#DC2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0 }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
