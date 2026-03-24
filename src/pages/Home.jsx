import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [categories, featuredListings])
  const [featuredListings, setFeaturedListings] = useState([])
  const [siteStats, setSiteStats] = useState({ listings: '...', categories: '...', reviews: '...' })
  const [bookmarks, setBookmarks] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [searchCategory, setSearchCategory] = useState('')

  useEffect(() => {
    fetchCategories()
    fetchFeaturedListings()
    fetchSiteStats()
    if (user) fetchBookmarks()
  }, [])

  async function fetchSiteStats() {
    const [listingsRes, categoriesRes, reviewsRes] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id', { count: 'exact', head: true }),
    ])
    setSiteStats({
      listings: listingsRes.count ?? '—',
      categories: categoriesRes.count ?? '—',
      reviews: reviewsRes.count ?? '—',
    })
  }

  async function fetchBookmarks() {
    const { data } = await supabase.from('bookmarks').select('listing_id').eq('user_id', user.id)
    setBookmarks(new Set(data?.map(b => b.listing_id) || []))
  }

  async function toggleBookmark(e, listingId) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (bookmarks.has(listingId)) {
      await supabase.from('bookmarks').delete().eq('listing_id', listingId).eq('user_id', user.id)
      setBookmarks(prev => { const n = new Set(prev); n.delete(listingId); return n })
    } else {
      await supabase.from('bookmarks').insert({ listing_id: listingId, user_id: user.id })
      setBookmarks(prev => new Set([...prev, listingId]))
    }
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('category_listing_counts')
      .select('*')
      .limit(8)
    if (data) setCategories(data)
  }

  async function fetchFeaturedListings() {
    const { data } = await supabase
      .from('listings')
      .select('*, categories(name, slug)')
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(3)
    if (data) setFeaturedListings(data)
  }

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (searchLocation) params.set('location', searchLocation)
    if (searchCategory) params.set('category', searchCategory)
    navigate(`/listings?${params.toString()}`)
  }

  return (
    <div style={{ background: 'var(--cream)' }}>
      {/* ── HERO ── */}
      <section className="hero-gradient" style={{
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(11,97,87,.45) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p className="anim-fade-up" style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#5DD6C8', marginBottom: '1rem', position: 'relative', animationDelay: '.1s' }}>
          The local discovery platform
        </p>

        <h1 className="anim-fade-up" style={{
          fontFamily: 'DM Serif Display, serif',
          fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
          color: '#fff', lineHeight: 1.1,
          marginBottom: '1rem',
          maxWidth: 640, marginLeft: 'auto', marginRight: 'auto',
          position: 'relative', animationDelay: '.2s',
        }}>
          Find the <em style={{ color: '#5DD6C8', fontStyle: 'italic' }}>perfect place</em><br />near you
        </h1>

        <p className="anim-fade-up" style={{ color: 'rgba(255,255,255,.55)', fontSize: 16, maxWidth: 440, margin: '0 auto 2.5rem', lineHeight: 1.6, position: 'relative', animationDelay: '.3s' }}>
          Search restaurants, apartments, events and services in your neighbourhood.
        </p>

        {/* Search box */}
        <form onSubmit={handleSearch} className="anim-fade-up" style={{ animationDelay: '.4s',
          display: 'flex', alignItems: 'center',
          background: '#fff', borderRadius: 12,
          maxWidth: 700, margin: '0 auto',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,.35)',
          position: 'relative', zIndex: 1,
        }}>
          <div style={searchFieldStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <div style={{ ...searchFieldStyle, borderRight: '1.5px solid var(--border)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            <input
              type="text"
              placeholder="Location"
              value={searchLocation}
              onChange={e => setSearchLocation(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <select
            value={searchCategory}
            onChange={e => setSearchCategory(e.target.value)}
            style={{
              padding: '.9rem 1rem', border: 'none', outline: 'none',
              fontFamily: 'DM Sans, sans-serif', fontSize: 14,
              color: 'var(--text-mid)', background: 'transparent', cursor: 'pointer',
              borderRight: '1.5px solid var(--border)',
            }}
          >
            <option value="">All categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <button type="submit" style={{
            margin: '.35rem', padding: '.7rem 1.5rem',
            background: 'var(--teal)', color: '#fff',
            border: 'none', borderRadius: 9, cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>Search</button>
        </form>

        {/* Stats */}
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginTop: '2rem', position: 'relative', animationDelay: '.5s' }}>
          <Stat num={siteStats.listings === '...' ? '...' : `${siteStats.listings}+`} label="Listings" />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.12)' }} />
          <Stat num={siteStats.categories} label="Categories" />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,.12)' }} />
          <Stat num={siteStats.reviews === '...' ? '...' : siteStats.reviews >= 1000 ? `${(siteStats.reviews / 1000).toFixed(1)}k` : String(siteStats.reviews)} label="Reviews" />
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <div style={{ padding: '3.5rem 2rem', maxWidth: 1140, margin: '0 auto' }}>
        <div className="reveal"><SectionHeader title="Browse by category" sub="Find exactly what you need" link="/listings" /></div>
        <div className="stagger reveal" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '.75rem',
        }}>
          {(categories.length > 0 ? categories : defaultCategories).map(cat => (
            <Link
              key={cat.id || cat.slug}
              to={`/listings?category=${cat.slug}`}
              className="anim-fade-up card-hover btn-press"
              style={{
                background: '#fff', border: '1.5px solid var(--border)',
                borderRadius: 14, padding: '1.25rem 1rem',
                textAlign: 'center', cursor: 'pointer',
                textDecoration: 'none', color: 'inherit',
                display: 'block',
              }}
            >
              <div style={{
                width: 44, height: 44, margin: '0 auto .75rem',
                borderRadius: 12,
                background: iconBg[cat.slug] || 'var(--teal-pale)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>{cat.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: '.2rem' }}>{cat.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{cat.listing_count || 0} listings</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── TRENDING LISTINGS ── */}
      <div style={{ padding: '0 2rem 3.5rem', maxWidth: 1140, margin: '0 auto' }}>
        <div className="reveal"><SectionHeader title="Trending listings" sub="Verified for quality" link="/listings" /></div>
        <div className="stagger reveal" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {(featuredListings.length > 0 ? featuredListings : demoListings).map(listing => (
            <ListingCard key={listing.id} listing={listing} bookmarked={bookmarks.has(listing.id)} onBookmark={toggleBookmark} />
          ))}
        </div>
      </div>

      {/* ── MAP TEASER ── */}
      <div style={{
        background: 'var(--navy)',
        display: 'grid', gridTemplateColumns: '1fr 380px',
        minHeight: 420,
      }}>
        <div style={{ position: 'relative', overflow: 'hidden', background: '#1a2740', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
          {mapDots.map((dot, i) => <MapDot key={i} dot={dot} />)}
          <div style={{ position: 'absolute', bottom: '.5rem', right: '.75rem', fontSize: 10, color: 'rgba(255,255,255,.3)' }}>
            Leaflet · © OpenStreetMap contributors
          </div>
          <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 13, marginBottom: '.75rem' }}>Explore listings on the map</p>
            <Link to="/listings?view=map" style={{
              background: 'var(--teal)', color: '#fff',
              padding: '.65rem 1.5rem', borderRadius: 8,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}>Open map view →</Link>
          </div>
        </div>
        <div style={{ background: 'var(--navy-mid)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <h3 style={{ fontFamily: 'DM Serif Display, serif', color: '#fff', fontSize: '1.2rem', marginBottom: '.25rem' }}>Explore the map</h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>Listings near you</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {demoListings.map(l => (
              <Link key={l.id} to={`/listings/${l.id}`} style={{
                display: 'flex', gap: '.75rem', padding: '.75rem 1.5rem',
                textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,.04)',
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, background: l.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{l.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: '.2rem' }}>{l.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: '.25rem' }}>{l.address}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(11,97,87,.4)', color: '#5DD6C8', fontWeight: 500 }}>{l.category}</span>
                    <span style={{ fontSize: 11, color: '#F59E0B' }}>★ {l.avg_rating || '5.0'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'var(--teal-pale)', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <SectionHeader title="How Nestly works" sub="Three simple steps to find your place" />
          <div className="stagger reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '2rem' }}>
            {howSteps.map((step, i) => (
              <div key={i} className="anim-fade-up card-hover" style={{ background: '#fff', borderRadius: 14, padding: '1.75rem 1.5rem', border: '1.5px solid var(--teal-mid)' }}>
                <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2.5rem', lineHeight: 1, color: 'var(--teal-pale)', marginBottom: '.75rem', WebkitTextStroke: '1.5px var(--teal-mid)' }}>0{i + 1}</div>
                <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: '.5rem' }}>{step.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ChatWidget />
    </div>
  )
}

function ListingCard({ listing, bookmarked, onBookmark }) {
  return (
    <Link to={`/listings/${listing.id}`} className="anim-fade-up" style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card-hover" style={{ background: '#fff', borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ height: 190, position: 'relative', overflow: 'hidden', background: listing.gradient || 'linear-gradient(135deg,#0B6157,#1a9e8f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>
          {listing.cover_image ? <img src={listing.cover_image} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (listing.emoji || '🏠')}
          {listing.is_featured && <span style={{ position: 'absolute', top: '.75rem', left: '.75rem', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: 'rgba(11,97,87,.9)', color: '#fff' }}>⭐ Featured</span>}
          {listing.tags?.length > 0 && <span style={{ position: 'absolute', bottom: '.75rem', left: '.75rem', fontSize: 10, fontWeight: 500, padding: '3px 8px', background: 'rgba(10,15,25,.65)', color: 'rgba(255,255,255,.9)', borderRadius: 6, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listing.tags.join(' · ')}</span>}
          <button onClick={e => onBookmark(e, listing.id)} style={{ position: 'absolute', top: '.75rem', right: '.75rem', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: bookmarked ? '#DC2626' : 'var(--text-mid)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill={bookmarked ? '#DC2626' : 'none'} stroke={bookmarked ? '#DC2626' : 'currentColor'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </button>
        </div>
        <div style={{ padding: '1rem 1.1rem' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>{listing.categories?.name || listing.category}</div>
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

function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! 👋 I can help you find listings, suggest places nearby, or answer questions. What are you looking for?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => {
      const next = [...prev, { role: 'user', text: userMsg }]
      return next.length > 50 ? next.slice(next.length - 50) : next
    })
    setLoading(true)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a helpful assistant for Nestly, a local business directory. Help users find listings, answer questions, and give recommendations. Keep responses concise and friendly.' },
            ...messages.map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: userMsg }
          ],
          max_tokens: 200,
        })
      })
      const data = await res.json()
      setMessages(prev => {
        const next = [...prev, { role: 'bot', text: data.choices?.[0]?.message?.content || 'Sorry, try again.' }]
        return next.length > 50 ? next.slice(next.length - 50) : next
      })
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50 }}>
      {open && (
        <div className="anim-pop-in" style={{ position: 'absolute', bottom: 64, right: 0, width: 320, background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--teal)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Nestly Assistant</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                <div style={{ width: 6, height: 6, background: '#5DD6C8', borderRadius: '50%' }} /> Online
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.75rem', maxHeight: 280, overflowY: 'auto' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ maxWidth: '80%', padding: '.6rem .9rem', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: m.role === 'bot' ? 'var(--cream)' : 'var(--teal)', color: m.role === 'bot' ? 'var(--text)' : '#fff', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', borderBottomRightRadius: m.role === 'user' ? 4 : 12, borderBottomLeftRadius: m.role === 'bot' ? 4 : 12 }}>{m.text}</div>
            ))}
            {loading && <div style={{ maxWidth: '80%', padding: '.6rem .9rem', borderRadius: 12, fontSize: 13, background: 'var(--cream)', color: 'var(--text-light)' }}>Typing...</div>}
          </div>
          <div style={{ display: 'flex', padding: '.75rem 1rem', gap: '.5rem', borderTop: '1.5px solid var(--border)' }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask anything..." style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 8, padding: '.5rem .75rem', fontFamily: 'DM Sans, sans-serif', fontSize: 13, outline: 'none', background: 'var(--cream)' }} />
            <button onClick={sendMessage} style={{ width: 34, height: 34, background: 'var(--teal)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)} className="chat-fab btn-press" style={{ width: 52, height: 52, background: 'var(--teal)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 24px rgba(11,97,87,.45)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      </button>
    </div>
  )
}

function Stat({ num, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.6rem', color: '#fff', display: 'block' }}>{num}</span>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{label}</span>
    </div>
  )
}

function SectionHeader({ title, sub, link }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
      <div>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem', color: 'var(--text)', lineHeight: 1.2 }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: '.3rem' }}>{sub}</p>}
      </div>
      {link && <Link to={link} style={{ fontSize: 13, fontWeight: 500, color: 'var(--teal)', textDecoration: 'none' }}>View all →</Link>}
    </div>
  )
}

function MapDot({ dot }) {
  return (
    <div style={{ position: 'absolute', left: dot.x, top: dot.y, zIndex: 1 }}>
      <div style={{ width: 36, height: 36, background: 'var(--teal)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(11,97,87,.5)' }}>
        <div style={{ width: 14, height: 14, background: '#fff', borderRadius: '50%', transform: 'rotate(45deg)' }} />
      </div>
    </div>
  )
}

const searchFieldStyle = { flex: 1, display: 'flex', alignItems: 'center', padding: '.9rem 1.2rem', gap: '.6rem', borderRight: '1.5px solid var(--border)' }
const searchInputStyle = { border: 'none', outline: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--text)', background: 'transparent', width: '100%' }

const iconBg = { apartments: '#EAF1FD', 'eat-and-drink': '#FEF3E8', events: '#FDEAEA', services: '#EAF1FD', wellness: '#F0EEFF', fitness: '#EAFAF0', cafes: '#FEF3E8', arts: '#FDEAEA' }

const defaultCategories = [
  { id: 1, name: 'Apartments', slug: 'apartments', icon: '🏠', listing_count: 0 },
  { id: 2, name: 'Eat & Drink', slug: 'eat-and-drink', icon: '🍽️', listing_count: 0 },
  { id: 3, name: 'Events', slug: 'events', icon: '🎉', listing_count: 0 },
  { id: 4, name: 'Services', slug: 'services', icon: '🛠️', listing_count: 0 },
  { id: 5, name: 'Wellness', slug: 'wellness', icon: '💆', listing_count: 0 },
  { id: 6, name: 'Fitness', slug: 'fitness', icon: '🏋️', listing_count: 0 },
  { id: 7, name: 'Cafés', slug: 'cafes', icon: '☕', listing_count: 0 },
  { id: 8, name: 'Arts', slug: 'arts', icon: '🎭', listing_count: 0 },
]

const demoListings = [
  { id: 'demo-1', title: 'Bella Vista Restaurant', address: 'Oxford Street, Osu', category: 'Eat & Drink', avg_rating: 5, review_count: 48, is_featured: true, price_range: 'From GH₵80', tags: ['Fine Dining', 'Italian', 'Rooftop'], gradient: 'linear-gradient(135deg,#0B6157,#1a9e8f)', emoji: '🍽️' },
  { id: 'demo-2', title: 'Sunny 2-Bed Apartment', address: 'Cantonments, Accra', category: 'Apartments', avg_rating: 4, review_count: 12, is_featured: true, price_range: 'GH₵950/mo', tags: ['2 Bed', 'A/C', 'Furnished'], gradient: 'linear-gradient(135deg,#1E3A5F,#2d5f9e)', emoji: '🏠' },
  { id: 'demo-3', title: 'Sticky Band Live', address: 'Labadi Beach, Accra', category: 'Events', avg_rating: 5, review_count: 31, is_featured: true, price_range: 'GH₵40 entry', tags: ['Concert', 'Live Music', 'Bar'], gradient: 'linear-gradient(135deg,#5B2D8E,#8b4fd8)', emoji: '🎵' },
]

const mapDots = [{ x: '30%', y: '35%' }, { x: '55%', y: '55%' }, { x: '45%', y: '25%' }, { x: '70%', y: '42%' }, { x: '20%', y: '60%' }]

const howSteps = [
  { title: 'Find a place', desc: 'Search by area, category, or let our AI assistant help you find exactly what you\'re looking for.' },
  { title: 'Check reviews', desc: 'Read honest reviews from verified visitors and see ratings before you make a decision.' },
  { title: 'Make a booking', desc: 'Reserve a table, book an apartment, or register for an event directly through the platform.' },
  { title: 'List your business', desc: 'Register as a vendor, add your listing, and start receiving bookings from local customers.' },
]