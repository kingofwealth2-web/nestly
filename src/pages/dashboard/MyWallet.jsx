import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MyWallet() {
  const { user, profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchTransactions() }, [user])

  async function fetchTransactions() {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setTransactions(data || [])
    setLoading(false)
  }

  async function addFunds(e) {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) return
    setAdding(true)
    const val = parseFloat(amount)
    await supabase.from('wallet_transactions').insert({
      user_id: user.id, amount: val, type: 'credit', description: 'Top up'
    })
    await supabase.from('profiles').update({ wallet_balance: (profile?.wallet_balance || 0) + val }).eq('id', user.id)
    setAmount('')
    fetchTransactions()
    setAdding(false)
    window.location.reload()
  }

  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.8rem', color: 'var(--text)' }}>Wallet</h1>
      </div>

      {/* Balance card */}
      <div style={{ background: 'var(--navy)', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600, marginBottom: '.5rem' }}>Available balance</p>
          <p style={{ fontFamily: 'DM Serif Display, serif', fontSize: '2.5rem', color: '#fff', lineHeight: 1 }}>
            GH₵ {profile?.wallet_balance?.toFixed(2) || '0.00'}
          </p>
        </div>
        <form onSubmit={addFunds}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: '.5rem' }}>Add funds</p>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="GH₵ amount" min="1" style={{ flex: 1, padding: '.65rem 1rem', background: 'rgba(255,255,255,.1)', border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 8, color: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 14, outline: 'none' }} />
            <button type="submit" disabled={adding} style={{ padding: '.65rem 1.25rem', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {adding ? '...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Transactions */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid var(--border)', padding: '1.5rem' }}>
        <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.25rem' }}>Transaction history</h2>
        {loading ? (
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>Loading...</p>
        ) : transactions.length === 0 ? (
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>No transactions yet.</p>
        ) : (
          <div>
            {transactions.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.85rem 0', borderBottom: '1.5px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.type === 'credit' ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {t.type === 'credit' ? '↓' : '↑'}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{t.description || (t.type === 'credit' ? 'Credit' : 'Debit')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: t.type === 'credit' ? '#059669' : '#DC2626' }}>
                  {t.type === 'credit' ? '+' : '-'}GH₵{parseFloat(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
