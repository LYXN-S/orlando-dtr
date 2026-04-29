export default function StatusBadge({ type }) {
  const badges = {
    active: {
      label: 'Active Shift',
      className: 'status-badge-active',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
    },
    missing: {
      label: 'Missing Time Out',
      className: 'status-badge-missing',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
  }

  const badge = badges[type] || badges.missing

  return (
    <span className={`status-badge ${badge.className}`}>
      {badge.icon}
      {badge.label}
    </span>
  )
}
