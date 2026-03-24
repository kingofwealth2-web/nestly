import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [listings, setListings] = useState([])
  const [categories, setCategories] = useState([])
  const [bookmarks, setBookmarks] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  const view = searchParams.get('view') || 'grid'
  const q = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''
  const location = searchParams.get('location') || ''

  const [searchInput, setSearchInput] = useState(q)
  const [locationInput, setLocationInput] = useState(location)
  const [selectedCategory, setSelectedCategory] = useState(categorySlug)
  const [sortBy, setSortBy] = useState('created_at')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchListings() }, [q, categorySlug, location, sortBy, priceMin, priceMax])
  useEffect(() => { if (user) fetchBookmarks() }, [user])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*')
    if (data) setCategories(data)
  }

  async function fetchListings() {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('status', 'active')

    if (q) query = query.ilike('title', `%${q}%`)
    if (location) query = query.ilike('city', `%${location}%`)
    if (categorySlug) {
      const cat = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
      if (cat.data) query = query.eq('category_id', cat.data.id)
    }
    if (priceMin) query = query.gte('price_from', priceMin)
    if (priceMax) query = query.lte('price_from', priceMax)
    query = query.order(sortBy, { ascending: false }).limit(24)

    const { data, count } = await query
    setListings(data || [])
    setTotal(count || 0)
    setLoading(false)
  }

  async function fetchBookmarks() {
    const { data } = await supabase
      .from('bookmarks')
      .select('listing_id')
      .eq('user_id', user.id)
    setBookmarks(new Set(data?.map(b => b.listing_id) || []))
  }

  async function toggleBookmark(e, listingId) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    if (bookmarks.has(listingId)) {
      await supabase.from('bookmarks').delete().eq('listing_id', listingId).eq('user_id', user.id)
      setBookmarks(prev => { const n = new Set(prev); n.delete(listingId); return n })
    } else {
      await supabase.from('bookmarks').insert({ listing_id: listingId, user_id: user.id })
      setBookmarks(prev => new Set([...prev, listingId]))
    }
  }

  function applySearch(e) {
    e.preventDefault()
    const p = new URLSearchParams(searchParams)
    if (searchInput) p.set('q', searchInput); else p.delete('q')
    if (locationInput) p.set('location', locationInput); else p.delete('location')
    if (selectedCategory) p.set('category', selectedCategory); else p.delete('category')
    setSearchParams(p)
  }

  function setView(v) {
    const p = new URLSearchParams(searchParams)
    p.set('view', v)
    setSearchParams(p)
  }

  function setCategoryFilter(slug) {
    const p = new URLSearchParams(searchParams)
    if (slug) p.set('category', slug); else p.delete('category')
    setSearchParams(p)
    setSelectedCategory(slug)
  }

  return (
    <div className="page-enter" style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      {/* ── SEARCH BAR ── */}
      <div style={{ background: 'var(--navy)', padding: '1.5rem 2rem' }}>
        <form onSubmit={applySearch} style={{ display: 'flex', gap: '.75rem', maxWidth: 900, margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 160, display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 9, padding: '.65rem 1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search listings..." style={{ border: 'none', outline: 'none', background: 'transparent', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 120, display: 'flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 9, padding: '.65rem 1rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            <input value={locationInput} onChange={e => setLocationInput(e.target.value)} placeholder="Location" style={{ border: 'none', outline: 'none', background: 'transparent', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%' }} />
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ minWidth: 130, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)', borderRadius: 9, padding: '.65rem 1rem', color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none' }}>
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <button type="submit" style={{ padding: '.65rem 1.5rem', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Search</button>
        </form>
      </div>

      {/* ── CATEGORY TABS ── */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid var(--border)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, maxWidth: 1140, margin: '0 auto', padding: '0 2rem' }}>
          <CategoryTab label="All" active={!categorySlug} onClick={() => setCategoryFilter('')} />
          {categories.map(c => (
            <CategoryTab key={c.id} label={c.name} icon={c.icon} active={categorySlug === c.slug} onClick={() => setCategoryFilter(c.slug)} />
          ))}
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ padding: '.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1140, margin: '0 auto', flexWrap: 'wrap', gap: '.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontSize: 13, color: 'var(--text-light)' }}>
            {loading ? 'Loading...' : `${total} listing${total !== 1 ? 's' : ''} found`}
          </span>
          <button onClick={() => setShowFilters(f => !f)} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.4rem .85rem', border: '1.5px solid var(--border)', borderRadius: 7, background: showFilters ? 'var(--teal-pale)' : '#fff', color: showFilters ? 'var(--teal)' : 'var(--text-mid)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            Filters
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: '1.5px solid var(--border)', borderRadius: 7, padding: '.4rem .75rem', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--text-mid)', background: '#fff', outline: 'none' }}>
            <option value="created_at">Newest first</option>
            <option value="avg_rating">Top rated</option>
            <option value="review_count">Most reviewed</option>
            <option value="price_from">Price: low to high</option>
          </select>
          <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {[
              { v: 'list', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
              { v: 'grid', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
              { v: 'map', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg> },
            ].map(({ v, icon }) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '.4rem .7rem', border: 'none', background: view === v ? 'var(--teal)' : '#fff', color: view === v ? '#fff' : 'var(--text-mid)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTERS PANEL ── */}
      {showFilters && (
        <div style={{ background: '#fff', borderTop: '1.5px solid var(--border)', borderBottom: '1.5px solid var(--border)', padding: '1.25rem 2rem' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-mid)', marginBottom: '.35rem' }}>Min price</label>
              <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="GH₵0" style={{ ...filterInput, width: 120 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-mid)', marginBottom: '.35rem' }}>Max price</label>
              <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Any" style={{ ...filterInput, width: 120 }} />
            </div>
            <button onClick={() => { setPriceMin(''); setPriceMax('') }} style={{ padding: '.5rem 1rem', border: '1.5px solid var(--border)', borderRadius: 7, background: '#fff', color: 'var(--text-mid)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      {view === 'map' ? (
        <MapView listings={listings} loading={loading} />
      ) : (
        <div style={{ maxWidth: 1140, margin: '0 auto', padding: '1.5rem 2rem 3rem' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: view === 'list' ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} list={view === 'list'} />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState />
          ) : view === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {listings.map(l => <ListCard key={l.id} listing={l} bookmarked={bookmarks.has(l.id)} onBookmark={toggleBookmark} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {listings.map(l => <GridCard key={l.id} listing={l} bookmarked={bookmarks.has(l.id)} onBookmark={toggleBookmark} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── LIST CARD ──
function ListCard({ listing, bookmarked, onBookmark }) {
  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', display: 'flex', overflow: 'hidden', transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.08)'; e.currentTarget.style.borderColor = '#d0cdc8' }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <div style={{ width: 200, flexShrink: 0, background: 'linear-gradient(135deg,#0B6157,#1a9e8f)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', overflow: 'hidden' }}>
          {listing.cover_image ? <img src={listing.cover_image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
          {listing.is_featured && <span style={{ position: 'absolute', top: '.65rem', left: '.65rem', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(11,97,87,.9)', color: '#fff' }}>⭐ Featured</span>}
        </div>
        <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '.4rem' }}>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{listing.categories?.name}</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginTop: '.2rem', lineHeight: 1.3 }}>{listing.title}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0, marginLeft: '1rem' }}>
                {listing.price_range && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>{listing.price_range}</span>}
                <button onClick={e => onBookmark(e, listing.id)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border)', background: bookmarked ? '#FEF2F2' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? '#DC2626' : 'none'} stroke={bookmarked ? '#DC2626' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: 12, color: 'var(--text-light)', marginBottom: '.5rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              {listing.address}, {listing.city}
            </div>
            {listing.description && <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{listing.description}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '.85rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(listing.avg_rating || 0) ? '#F59E0B' : 'var(--border)', fontSize: 13 }}>★</span>)}
              <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: '.2rem' }}>({listing.review_count || 0})</span>
            </div>
            {listing.tags?.slice(0,3).map(t => (
              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── GRID CARD ──
function GridCard({ listing, bookmarked, onBookmark }) {
  return (
    <Link to={`/listings/${listing.id}`} style={{ textDecoration: 'none' }}>
      <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden', transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,.1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ height: 190, background: 'linear-gradient(135deg,#0B6157,#1a9e8f)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', overflow: 'hidden' }}>
          {listing.cover_image ? <img src={listing.cover_image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
          {listing.is_featured && <span style={{ position: 'absolute', top: '.75rem', left: '.75rem', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(11,97,87,.9)', color: '#fff' }}>⭐ Featured</span>}
          {listing.tags?.length > 0 && <span style={{ position: 'absolute', bottom: '.75rem', left: '.75rem', fontSize: 10, fontWeight: 500, padding: '3px 8px', background: 'rgba(10,15,25,.65)', color: 'rgba(255,255,255,.9)', borderRadius: 6, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.tags.join(' · ')}</span>}
          <button onClick={e => onBookmark(e, listing.id)} style={{ position: 'absolute', top: '.75rem', right: '.75rem', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? '#DC2626' : 'none'} stroke={bookmarked ? '#DC2626' : '#666'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>{listing.categories?.name}</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: '.3rem', lineHeight: 1.3 }}>{listing.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: 12, color: 'var(--text-light)', marginBottom: '.75rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
            {listing.address || listing.city}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.75rem', borderTop: '1.5px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
              {[1,2,3,4,5].map(s => <span key={s} style={{ color: s <= Math.round(listing.avg_rating || 0) ? '#F59E0B' : 'var(--border)', fontSize: 13 }}>★</span>)}
              <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: '.25rem' }}>({listing.review_count || 0})</span>
            </div>
            {listing.price_range && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal)' }}>{listing.price_range}</span>}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── MAP VIEW ──
function MapView({ listings, loading }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (mapInstanceRef.current) return
    const L = window.L
    if (!L) return
    const map = L.map(mapRef.current).setView([5.6037, -0.1870], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)
    mapInstanceRef.current = map
  }, [])

  useEffect(() => {
    const L = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return
    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer) })
    listings.forEach(l => {
      if (!l.lat || !l.lng) return
      const marker = L.marker([l.lat, l.lng]).addTo(map)
      marker.on('click', () => setSelected(l))
    })
  }, [listings])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', height: 'calc(100vh - 200px)' }}>
      <div style={{ position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {listings.length === 0 && !loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,245,240,.85)', zIndex: 1000 }}>
            <p style={{ fontSize: 14, color: 'var(--text-light)' }}>No listings with location data yet.</p>
          </div>
        )}
      </div>
      <div style={{ background: '#fff', borderLeft: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid var(--border)' }}>
          <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: 'var(--text)' }}>
            {loading ? 'Loading...' : `${listings.length} listings`}
          </h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {listings.map(l => (
            <div key={l.id} onClick={() => setSelected(l)} style={{ display: 'flex', gap: '.75rem', padding: '.85rem 1.25rem', cursor: 'pointer', borderBottom: '1.5px solid var(--border)', background: selected?.id === l.id ? 'var(--teal-pale)' : '#fff' }}>
              <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#0B6157,#1a9e8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
                {l.cover_image ? <img src={l.cover_image} alt={l.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: '.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginBottom: '.25rem' }}>{l.city}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 500 }}>{l.categories?.name}</span>
                  <span style={{ fontSize: 11, color: '#F59E0B' }}>★ {l.avg_rating?.toFixed(1) || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1.5px solid var(--border)', background: 'var(--cream)' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: '.25rem' }}>{selected.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: '.75rem' }}>{selected.address}</div>
            <Link to={`/listings/${selected.id}`} style={{ display: 'inline-block', padding: '.5rem 1rem', background: 'var(--teal)', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>View listing →</Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── HELPERS ──
function CategoryTab({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '.35rem', padding: '.85rem 1.1rem', border: 'none', borderBottom: active ? '2.5px solid var(--teal)' : '2.5px solid transparent', background: 'transparent', color: active ? 'var(--teal)' : 'var(--text-mid)', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {icon && <span>{icon}</span>}
      {label}
    </button>
  )
}

function SkeletonCard({ list }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden', display: list ? 'flex' : 'block' }}>
      <div style={{ ...(list ? { width: 200, flexShrink: 0 } : { height: 190 }), background: '#e8e4de' }} />
      <div style={{ padding: '1rem', flex: 1 }}>
        <div style={{ background: '#e8e4de', height: 12, width: '40%', marginBottom: '.5rem', borderRadius: 4 }} />
        <div style={{ background: '#e8e4de', height: 16, width: '70%', marginBottom: '.5rem', borderRadius: 4 }} />
        <div style={{ background: '#e8e4de', height: 12, width: '50%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
      <h3 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '.5rem' }}>No listings found</h3>
      <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: '1.5rem' }}>Try adjusting your search or filters.</p>
      <Link to="/listings" style={{ padding: '.65rem 1.5rem', background: 'var(--teal)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Clear search</Link>
    </div>
  )
}

const filterInput = {
  border: '1.5px solid var(--border)', borderRadius: 7,
  padding: '.5rem .75rem', fontFamily: 'DM Sans, sans-serif',
  fontSize: 13, color: 'var(--text)', background: 'var(--cream)', outline: 'none',
}