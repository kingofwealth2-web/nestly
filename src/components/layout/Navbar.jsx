import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ onMenuClick }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!user) { setUnread(0); return }
    fetchUnread()
    const sub = supabase
      .channel('unread-badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => fetchUnread())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => fetchUnread())
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [user])

  async function fetchUnread() {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`)
    if (!convs?.length) return
    const convIds = convs.map(c => c.id)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .in('conversation_id', convIds)
      .eq('read', false)
      .neq('sender_id', user.id)
    setUnread(count || 0)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--navy)',
      display: 'flex', alignItems: 'center',
      padding: '0 2rem', height: '60px', gap: '1rem'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: 'var(--teal)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#fff', letterSpacing: '-.3px' }}>
          Nest<span style={{ color: '#5DD6C8' }}>ly</span>
        </span>
      </Link>

      <div style={{ flex: 1 }} />

      {/* Cart */}
      <button style={navIconBtn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 600, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--navy)' }}>0</span>
      </button>

      {/* Messages icon with unread badge */}
      {user && (
        <Link to="/dashboard/messages" style={{ textDecoration: 'none', display: 'flex' }}>
          <div style={navIconBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -4, background: '#22C55E', color: '#fff', fontSize: 10, fontWeight: 600, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid var(--navy)' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
        </Link>
      )}

      {user ? (
        <>
          <Link to="/dashboard" style={navBtnStyle}>Dashboard</Link>
          <button onClick={handleSignOut} style={navBtnStyle}>Sign out</button>
        </>
      ) : (
        <>
          <Link to="/login" style={navBtnStyle}>Sign in</Link>
          <Link to="/register" style={{ ...navBtnStyle, background: 'var(--teal)', borderColor: 'var(--teal)', color: '#fff' }}>Register</Link>
        </>
      )}

      <button onClick={onMenuClick} style={navIconBtn}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </nav>
  )
}

const navIconBtn = {
  width: 38, height: 38, border: 'none', cursor: 'pointer',
  background: 'rgba(255,255,255,.08)', borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'rgba(255,255,255,.8)', position: 'relative',
}

const navBtnStyle = {
  height: 36, padding: '0 1rem', borderRadius: 8,
  border: '1.5px solid rgba(255,255,255,.2)',
  background: 'transparent', color: 'rgba(255,255,255,.85)',
  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', textDecoration: 'none',
  display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
}