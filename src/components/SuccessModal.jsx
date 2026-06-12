import { useEffect } from 'react'

export default function SuccessModal({ isOpen, title, message, onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="confirm-discard-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
      <div className="confirm-discard-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div className="confirm-discard-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', margin: '0 auto 1.25rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 style={{ marginBottom: '0.75rem' }}>{title}</h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>{message}</p>
        <div className="confirm-discard-actions" style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            type="button"
            className="keep-editing-btn" 
            style={{ maxWidth: '200px' }}
            onClick={onClose}
            autoFocus
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  )
}
