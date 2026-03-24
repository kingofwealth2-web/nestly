import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MessageThread({ conversation, onUpdate }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  const otherId = user.id === conversation.user_id ? conversation.owner_id : conversation.user_id
  const otherName = user.id === conversation.user_id
    ? conversation.owner?.full_name
    : conversation.user?.full_name

  useEffect(() => {
    fetchMessages()

    // Realtime subscription
    const sub = supabase
      .channel(`messages:${conversation.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new])
        scrollToBottom()
        onUpdate?.()
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [conversation.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function fetchMessages() {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)

    // Mark messages as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversation.id)
      .neq('sender_id', user.id)
  }

  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    })

    // Update last message on conversation
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', conversation.id)

    setSending(false)
    onUpdate?.()
  }

  function scrollToBottom() {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(ts) {
    const d = new Date(ts)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString()
  }

  // Group messages by date
  function groupByDate(msgs) {
    const groups = []
    let lastDate = null
    msgs.forEach(m => {
      const date = formatDate(m.created_at)
      if (date !== lastDate) { groups.push({ type: 'date', label: date }); lastDate = date }
      groups.push({ type: 'message', data: m })
    })
    return groups
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
          {otherName?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{otherName || 'Unknown'}</div>
          {conversation.listings && (
            <Link to={`/listings/${conversation.listings.id || conversation.listing_id}`} style={{ fontSize: 12, color: 'var(--teal)', textDecoration: 'none' }}>
              Re: {conversation.listings.title}
            </Link>
          )}
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13, padding: '2rem' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13, padding: '2rem' }}>
            No messages yet. Say hello! 👋
          </div>
        ) : (
          groupByDate(messages).map((item, i) => {
            if (item.type === 'date') {
              return (
                <div key={i} style={{ textAlign: 'center', margin: '.5rem 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', background: 'var(--cream)', padding: '3px 12px', borderRadius: 20 }}>{item.label}</span>
                </div>
              )
            }
            const m = item.data
            const isMe = m.sender_id === user.id
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '70%' }}>
                  <div style={{
                    padding: '.65rem 1rem',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe ? 'var(--teal)' : 'var(--cream)',
                    color: isMe ? '#fff' : 'var(--text)',
                    fontSize: 14, lineHeight: 1.5,
                  }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: '.25rem', textAlign: isMe ? 'right' : 'left' }}>
                    {formatTime(m.created_at)}
                    {isMe && <span style={{ marginLeft: '.3rem' }}>{m.read ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '.75rem 1.25rem', borderTop: '1.5px solid var(--border)', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Message ${otherName || 'owner'}...`}
          style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 24, padding: '.6rem 1.1rem', fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--text)', background: 'var(--cream)', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = 'var(--teal)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{ width: 40, height: 40, borderRadius: '50%', background: input.trim() ? 'var(--teal)' : 'var(--border)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </form>
    </div>
  )
}
