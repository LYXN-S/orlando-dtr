import { useEffect } from 'react'

export default function ConfirmDiscardModal({ isOpen, onKeepEditing, onDiscard }) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onKeepEditing()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onKeepEditing])

  if (!isOpen) return null

  return (
    <div className="confirm-discard-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="confirm-discard-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-discard-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3>Discard unsaved changes?</h3>
        <p>You have entered data that hasn't been saved. Are you sure you want to close this form and lose your progress?</p>
        <div className="confirm-discard-actions">
          <button 
            type="button"
            className="keep-editing-btn" 
            onClick={onKeepEditing}
            autoFocus
          >
            Keep Editing
          </button>
          <button 
            type="button"
            className="discard-btn" 
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  )
}
