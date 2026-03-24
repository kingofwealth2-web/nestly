import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--cream)' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Big 404 */}
        <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 'clamp(6rem, 15vw, 10rem)', color: 'var(--teal-mid)', lineHeight: 1, marginBottom: '1rem', userSelect: 'none' }}>
          404
        </div>

        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.75rem', color: 'var(--text)', marginBottom: '.75rem' }}>
          Page not found
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-light)', lineHeight: 1.7, marginBottom: '2rem' }}>
          The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate(-1)} style={{ padding: '.75rem 1.5rem', border: '1.5px solid var(--border)', borderRadius: 9, background: '#fff', color: 'var(--text-mid)', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            ← Go back
          </button>
          <Link to="/" style={{ padding: '.75rem 1.5rem', background: 'var(--teal)', color: '#fff', borderRadius: 9, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Go to homepage
          </Link>
          <Link to="/listings" style={{ padding: '.75rem 1.5rem', border: '1.5px solid var(--border)', borderRadius: 9, background: '#fff', color: 'var(--text-mid)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
            Browse listings
          </Link>
        </div>
      </div>
    </div>
  )
}
