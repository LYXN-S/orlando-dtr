import { useEffect } from 'react'

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showBackButton, 
  onBack,
  disableBackdropClick = false,
  onEscapeKey
}) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        // If custom escape handler provided, use it; otherwise use default onClose
        if (onEscapeKey) {
          onEscapeKey()
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, onEscapeKey])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    // Only close if the click is directly on the overlay (not bubbled from content)
    if (e.target === e.currentTarget && !disableBackdropClick) {
      onClose()
    }
  }

  return (
    <div 
      className={`modal-overlay ${disableBackdropClick ? 'no-backdrop-close' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {showBackButton && onBack && (
            <button className="modal-close-btn" onClick={onBack} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
