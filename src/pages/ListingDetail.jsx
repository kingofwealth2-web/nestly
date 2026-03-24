import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ListingDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)

  // Booking form
  const [bookDate, setBookDate] = useState('')
  const [bookTime, setBookTime] = useState('')
  const [bookGuests, setBookGuests] = useState(1)
  const [bookNotes, setBookNotes] = useState('')
  const [bookLoading, setBookLoading] = useState(false)
  const [bookSuccess, setBookSuccess] = useState(false)
  const [bookError, setBookError] = useState('')

  // Review form
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    fetchListing()
    fetchReviews()
    if (user) checkBookmark()
  }, [id, user])

  useEffect(() => {
    if (!listing?.lat || !listing?.lng) return
    if (mapInstanceRef.current) return

    // Defer until after paint so mapRef.current is guaranteed to be in the DOM
    const raf = requestAnimationFrame(() => {
      if (!mapRef.current) return
      const L = window.L
      if (!L) return
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false })
        .setView([listing.lat, listing.lng], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)
      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;background:#0D9488;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], className: ''
      })
      L.marker([listing.lat, listing.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${listing.title}</b><br>${listing.address || listing.city}`)
      mapInstanceRef.current = map
    })
    return () => cancelAnimationFrame(raf)
  }, [listing])

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, categories(name, slug), profiles(full_name, avatar_url)')
      .eq('id', id)
      .single()
    setListing(data)
    setLoading(false)
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('listing_id', id)
      .order('created_at', { ascending: false })
    setReviews(data || [])
  }

  async function checkBookmark() {
    const { data } = await supabase.from('bookmarks').select('id').eq('listing_id', id).eq('user_id', user.id).single()
    setBookmarked(!!data)
  }

  async function toggleBookmark() {
    if (!user) { navigate('/login'); return }
    if (bookmarked) {
      await supabase.from('bookmarks').delete().eq('listing_id', id).eq('user_id', user.id)
      setBookmarked(false)
    } else {
      await supabase.from('bookmarks').insert({ listing_id: id, user_id: user.id })
      setBookmarked(true)
    }
  }

  async function submitBooking(e) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!bookDate) { setBookError('Please select a date.'); return }
    setBookLoading(true)
    setBookError('')
    const { error } = await supabase.from('bookings').insert({
      listing_id: id,
      user_id: user.id,
      owner_id: listing.owner_id,
      date: bookDate,
      time: bookTime,
      guests: bookGuests,
      notes: bookNotes,
      amount: listing.price_from || 0,
    })
    setBookLoading(false)
    if (error) { setBookError(error.message); return }
    setBookSuccess(true)
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    setReviewLoading(true)
    setReviewError('')
    const { error } = await supabase.from('reviews').upsert({
      listing_id: id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment,
    })
    setReviewLoading(false)
    if (error) { setReviewError(error.message); return }
    setReviewComment('')
    fetchReviews()
    fetchListing()
  }

  if (loading) return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1.5px solid var(--border)', padding: '.75rem 2rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={skeletonStyle({ width: 280, height: 14 })} />
        </div>
      </div>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem' }}>
        <div>
          <div style={{ ...skeletonStyle({ width: '100%', height: 380 }), borderRadius: 16, marginBottom: '1.5rem' }} />
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={skeletonStyle({ width: 100, height: 12, marginBottom: 12 })} />
            <div style={skeletonStyle({ width: '60%', height: 28, marginBottom: 16 })} />
            <div style={skeletonStyle({ width: '40%', height: 14, marginBottom: 8 })} />
            <div style={skeletonStyle({ width: '30%', height: 14 })} />
          </div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem' }}>
            {[100, 90, 95, 70].map((w, i) => (
              <div key={i} style={skeletonStyle({ width: `${w}%`, height: 14, marginBottom: 10 })} />
            ))}
          </div>
        </div>
        <div>
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem' }}>
            <div style={skeletonStyle({ width: '50%', height: 18, marginBottom: 16 })} />
            {[1,2,3].map(i => <div key={i} style={skeletonStyle({ width: '100%', height: 40, marginBottom: 12 })} />)}
            <div style={skeletonStyle({ width: '100%', height: 44, borderRadius: 9 })} />
          </div>
        </div>
      </div>
    </div>
  )
  if (!listing) return <div style={{ padding: '4rem', textAlign: 'center' }}>Listing not found. <Link to="/listings">Browse listings</Link></div>

  const images = [listing.cover_image, ...(listing.images || [])].filter(Boolean)

  return (
    <div style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* ── BREADCRUMB ── */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid var(--border)', padding: '.75rem 2rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: 13, color: 'var(--text-light)' }}>
          <Link to="/" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/listings" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>Listings</Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{listing.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2rem', alignItems: 'start' }}>
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Images */}
          <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: '1.5rem', background: 'linear-gradient(135deg,#0B6157,#1a9e8f)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
            {images[activeImg]
              ? <img src={images[activeImg]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '🏠'
            }
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
              {images.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)} style={{ width: 72, height: 56, borderRadius: 8, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${activeImg === i ? 'var(--teal)' : 'transparent'}`, flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Header */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{listing.categories?.name}</span>
                <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.9rem', color: 'var(--text)', lineHeight: 1.2, marginTop: '.3rem' }}>{listing.title}</h1>
              </div>
              <button onClick={toggleBookmark} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)', background: bookmarked ? '#FEF2F2' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill={bookmarked ? '#DC2626' : 'none'} stroke={bookmarked ? '#DC2626' : 'currentColor'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(listing.avg_rating || 0) ? '#F59E0B' : 'var(--border)', fontSize: 15 }}>★</span>)}
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginLeft: '.3rem' }}>{listing.avg_rating?.toFixed(1) || '0.0'}</span>
                <span style={{ fontSize: 13, color: 'var(--text-light)' }}>({listing.review_count || 0} reviews)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: 13, color: 'var(--text-light)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                {listing.address}, {listing.city}
              </div>
              {listing.price_range && (
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--teal)' }}>{listing.price_range}</span>
              )}
            </div>

            {listing.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
                {listing.tags.map(t => (
                  <span key={t} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', color: 'var(--text)', marginBottom: '1rem' }}>About this listing</h2>
              <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.75 }}>{listing.description}</p>
            </div>
          )}

          {/* Reviews */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.2rem', color: 'var(--text)', marginBottom: '1.25rem' }}>
              Reviews ({reviews.length})
            </h2>

            {/* Write review */}
            {user && (
              <form onSubmit={submitReview} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1.5px solid var(--border)' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: '.5rem' }}>Leave a review</p>
                <div style={{ display: 'flex', gap: '.25rem', marginBottom: '.75rem' }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} onClick={() => setReviewRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                      style={{ fontSize: 22, cursor: 'pointer', color: s <= (hoverRating || reviewRating) ? '#F59E0B' : 'var(--border)', transition: 'color .1s' }}>★</span>
                  ))}
                </div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience..." rows={3}
                  style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 9, padding: '.75rem 1rem', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--text)', background: 'var(--cream)', outline: 'none', resize: 'vertical', marginBottom: '.75rem' }} />
                {reviewError && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: '.5rem' }}>{reviewError}</p>}
                <button type="submit" disabled={reviewLoading} style={{ padding: '.6rem 1.25rem', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {reviewLoading ? 'Submitting...' : 'Submit review'}
                </button>
              </form>
            )}

            {reviews.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-light)' }}>No reviews yet. Be the first!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ paddingBottom: '1.25rem', borderBottom: '1.5px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                          {r.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.profiles?.full_name || 'Anonymous'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '.15rem' }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= r.rating ? '#F59E0B' : 'var(--border)', fontSize: 13 }}>★</span>)}
                      </div>
                    </div>
                    {r.comment && <p style={{ fontSize: 14, color: 'var(--text-mid)', lineHeight: 1.6 }}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ position: 'sticky', top: '80px' }}>
          {/* Booking card */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.15rem', color: 'var(--text)', marginBottom: '1.25rem' }}>
              {listing.price_range ? `Book · ${listing.price_range}` : 'Make a booking'}
            </h3>

            {bookSuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 48, height: 48, background: 'var(--teal-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: '.35rem' }}>Booking request sent!</p>
                <p style={{ fontSize: 13, color: 'var(--text-light)' }}>The owner will confirm shortly.</p>
                <Link to="/dashboard/bookings" style={{ display: 'inline-block', marginTop: '1rem', fontSize: 13, color: 'var(--teal)', fontWeight: 500, textDecoration: 'none' }}>View my bookings →</Link>
              </div>
            ) : (
              <form onSubmit={submitBooking}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Time (optional)</label>
                  <input type="time" value={bookTime} onChange={e => setBookTime(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Guests</label>
                  <input type="number" value={bookGuests} onChange={e => setBookGuests(e.target.value)} min={1} max={20} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Notes (optional)</label>
                  <textarea value={bookNotes} onChange={e => setBookNotes(e.target.value)} rows={2} placeholder="Any special requests..." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                {bookError && <p style={{ fontSize: 12, color: '#DC2626', marginBottom: '.75rem' }}>{bookError}</p>}
                <button type="submit" disabled={bookLoading} style={{ width: '100%', padding: '.85rem', background: bookLoading ? '#aaa' : 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: bookLoading ? 'not-allowed' : 'pointer' }}>
                  {bookLoading ? 'Sending...' : user ? 'Request booking' : 'Sign in to book'}
                </button>
                {!user && <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: '.5rem' }}>
                  <Link to="/login" style={{ color: 'var(--teal)' }}>Sign in</Link> or <Link to="/register" style={{ color: 'var(--teal)' }}>register</Link> to book
                </p>}
              </form>
            )}
          </div>

          {/* Owner card */}
          {listing.profiles && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>Listed by</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600, color: '#fff', overflow: 'hidden' }}>
                  {listing.profiles.avatar_url
                    ? <img src={listing.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : listing.profiles.full_name?.[0]?.toUpperCase() || '?'
                  }
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{listing.profiles.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>Listing owner</div>
                </div>
              </div>
              {user && user.id !== listing.owner_id && (
                <Link to={`/dashboard/messages?listing=${id}&owner=${listing.owner_id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', marginTop: '1rem', padding: '.6rem', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Message owner
                </Link>
              )}
            </div>
          )}

          {/* Location card */}
          {(listing.lat && listing.lng) && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '1rem' }}>Location</h3>
              <div ref={mapRef} style={{ borderRadius: 10, overflow: 'hidden', height: 180 }} />
              <p style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: '.75rem' }}>{listing.address}, {listing.city}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-mid)', marginBottom: '.3rem' }
const inputStyle = { width: '100%', padding: '.65rem .85rem', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--cream)', outline: 'none' }

function skeletonStyle({ width, height, marginBottom, borderRadius }) {
  return {
    width, height,
    borderRadius: borderRadius || 6,
    background: 'linear-gradient(90deg, #e8e8e8 25%, #f5f5f5 50%, #e8e8e8 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    display: 'block',
    marginBottom: marginBottom || 0,
  }
}