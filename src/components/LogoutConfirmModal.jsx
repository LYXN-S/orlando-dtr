import { useEffect } from 'react'

export default function LogoutConfirmModal({ isOpen, onCancel, onConfirm }) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="confirm-discard-overlay" onClick={onCancel}>
      <div className="confirm-discard-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-discard-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <h3>Logout?</h3>
        <p>Are you sure you want to logout?</p>
        <div className="confirm-discard-actions">
          <button 
            type="button"
            className="keep-editing-btn" 
            onClick={onCancel}
            autoFocus
          >
            Cancel
          </button>
          <button 
            type="button"
            className="discard-btn" 
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
