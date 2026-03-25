export function StatusBadge({ status }) {
  const map = {
    pending:   { bg: '#FEF3E8', color: '#D97706', label: 'Pending' },
    confirmed: { bg: '#ECFDF5', color: '#059669', label: 'Confirmed' },
    cancelled: { bg: '#FEF2F2', color: '#DC2626', label: 'Cancelled' },
    completed: { bg: 'var(--teal-pale)', color: 'var(--teal)', label: 'Completed' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}