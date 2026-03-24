import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import MessageThread from './MessageThread'

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const listingId = searchParams.get('listing')
  const ownerId = searchParams.get('owner')

  useEffect(() => {
    fetchConversations()
    // Start or open a conversation if coming from listing detail
    if (listingId && ownerId && user) {
      startOrOpenConversation(listingId, ownerId)
    }
  }, [user])

  useEffect(() => {
    const sub = supabase
      .channel('conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [user])

  async function fetchConversations() {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select('*, listings(title, city, cover_image), user:profiles!conversations_user_id_fkey(full_name), owner:profiles!conversations_owner_id_fkey(full_name)')
      .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false })
    setConversations(data || [])
    setLoading(false)
  }

  async function startOrOpenConversation(listingId, ownerId) {
    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*, listings(title, city), user:profiles!conversations_user_id_fkey(full_name), owner:profiles!conversations_owner_id_fkey(full_name)')
      .eq('listing_id', listingId)
      .eq('user_id', user.id)
      .eq('owner_id', ownerId)
      .single()

    if (existing) {
      setSelected(existing)
      return
    }

    // Create new conversation and immediately select it — no race
    const { data } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, user_id: user.id, owner_id: ownerId })
      .select('*, listings(title, city), user:profiles!conversations_user_id_fkey(full_name), owner:profiles!conversations_owner_id_fkey(full_name)')
      .single()

    if (data) {
      setSelected(data)
      // Merge into list directly so it appears immediately without a refetch race
      setConversations(prev => [data, ...prev])
    }
  }

  function getOtherParty(conv) {
    return user.id === conv.user_id ? conv.owner : conv.user
  }

  function formatTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>Messages</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Conversation list */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1.5px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-mid)' }}>
              {loading ? 'Loading...' : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 && !loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>💬</div>
                <p style={{ fontSize: 13, color: 'var(--text-light)', lineHeight: 1.6 }}>No conversations yet. Message a listing owner to get started.</p>
              </div>
            ) : (
              conversations.map(conv => {
                const other = getOtherParty(conv)
                const isActive = selected?.id === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelected(conv)}
                    style={{
                      display: 'flex', gap: '.75rem', padding: '.9rem 1.25rem',
                      cursor: 'pointer', borderBottom: '1.5px solid var(--border)',
                      background: isActive ? 'var(--teal-pale)' : '#fff',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                      {other?.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.2rem' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                          {other?.full_name || 'Unknown'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-light)', flexShrink: 0 }}>{formatTime(conv.last_message_at)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.listings?.title || 'General enquiry'}
                      </div>
                      {conv.last_message && (
                        <div style={{ fontSize: 12, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '.15rem' }}>
                          {conv.last_message}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Thread */}
        {selected ? (
          <MessageThread conversation={selected} onUpdate={fetchConversations} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <p style={{ fontSize: 14, color: 'var(--text-light)' }}>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  )
}