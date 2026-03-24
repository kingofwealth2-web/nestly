import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const inputStyle = {
  width: '100%', padding: '.7rem 1rem',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontFamily: 'DM Sans, sans-serif', fontSize: 14,
  color: 'var(--text)', background: 'var(--cream)', outline: 'none',
}

export default function MyProfile() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState({ full_name: '', bio: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name || '', bio: profile.bio || '', phone: profile.phone || '' })
  }, [profile])

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      bio: form.bio,
      phone: form.phone,
    }).eq('id', user.id)
    setLoading(false)
    if (error) { setError(error.message); return }
    await refreshProfile()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>My profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem' }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.25rem', paddingBottom: '.75rem', borderBottom: '1.5px solid var(--border)' }}>Personal information</h2>

          {success && <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: 8, padding: '.75rem 1rem', fontSize: 13, color: '#059669', marginBottom: '1.25rem' }}>Profile updated successfully.</div>}
          {error && <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 8, padding: '.75rem 1rem', fontSize: 13, color: '#DC2626', marginBottom: '1.25rem' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <Field label="Full name">
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" style={inputStyle} />
            </Field>
            <Field label="Email address">
              <input value={user?.email || ''} disabled style={{ ...inputStyle, background: '#f5f5f5', color: 'var(--text-light)', cursor: 'not-allowed' }} />
              <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: '.25rem' }}>Email cannot be changed here.</p>
            </Field>
            <Field label="Phone number">
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+233 00 000 0000" style={inputStyle} />
            </Field>
            <Field label="Bio">
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} placeholder="Tell others a bit about yourself..." style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <button type="submit" disabled={loading} style={{ padding: '.75rem 1.75rem', background: loading ? '#aaa' : 'var(--teal)', color: '#fff', border: 'none', borderRadius: 9, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Avatar card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.75rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 600, color: '#fff', margin: '0 auto 1rem', overflow: 'hidden' }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?')
            }
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: '.25rem' }}>{profile?.full_name || 'Your name'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: '1rem' }}>{user?.email}</div>
          <div style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--teal-pale)', color: 'var(--teal)', fontWeight: 600, display: 'inline-block' }}>
            {profile?.role || 'user'}
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1.5px solid var(--border)', fontSize: 13, color: 'var(--text-light)' }}>
            Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: '.35rem' }}>{label}</label>
      {children}
    </div>
  )
}