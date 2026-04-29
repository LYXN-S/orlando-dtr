export default function EmptyState({ message, icon }) {
  return (
    <div className="empty-state-container">
      <div className="empty-state-icon">
        {icon || (
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <h3 className="empty-state-title">No Records Found</h3>
      <p className="empty-state-message">
        {message || 'No attendance records found for the selected date range.'}
      </p>
      <p className="empty-state-hint">
        Try adjusting your date range or search criteria.
      </p>
    </div>
  )
}
