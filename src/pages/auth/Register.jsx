import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const inputStyle = {
  width: '100%', padding: '.75rem 1rem',
  border: '1.5px solid var(--border)', borderRadius: 9,
  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
  color: 'var(--text)', background: 'var(--cream)',
  outline: 'none', transition: 'border-color .2s',
}

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await signUp(email, password, fullName)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--cream)' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, background: 'var(--teal-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.6rem', color: 'var(--text)', marginBottom: '.5rem' }}>Check your email</h2>
          <p style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" style={{ color: 'var(--teal)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Back to sign in →</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--cream)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, background: 'var(--teal)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--navy)' }}>
              Nest<span style={{ color: 'var(--teal)' }}>ly</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.6rem', color: 'var(--text)', marginTop: '1.25rem', marginBottom: '.35rem' }}>Create an account</h1>
          <p style={{ fontSize: 14, color: 'var(--text-light)' }}>Join Nestly and start discovering</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '2rem' }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 8, padding: '.75rem 1rem', fontSize: 13, color: '#DC2626', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Field label="Full name">
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Kwame Asante" required style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Email address">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <Field label="Confirm password">
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--teal)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </Field>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '.85rem', background: loading ? '#aaa' : 'var(--teal)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '.5rem' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginTop: '1.25rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--teal)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: '.4rem' }}>{label}</label>
      {children}
    </div>
  )
}