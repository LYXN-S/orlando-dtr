export default function StatCard({ icon, label, value, subtitle, variant = 'default' }) {
  return (
    <div className={`stat-card stat-card-${variant}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  )
}
