export default function LoadingModal({ isOpen, message = "Loading..." }) {
  if (!isOpen) return null

  return (
    <div className="confirm-discard-overlay" style={{ zIndex: 4000 }}>
      <div className="confirm-discard-content" style={{ alignItems: 'center', padding: '3rem 2rem', width: 'auto', minWidth: '300px' }}>
        <div className="loading-spinner" style={{ marginBottom: '1.5rem', width: '48px', height: '48px', borderTopColor: 'var(--accent)' }}></div>
        <h3 style={{ margin: 0, color: 'var(--secondary)' }}>{message}</h3>
      </div>
    </div>
  )
}
