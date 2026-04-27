import { formatTimeShort } from '../utils/dateHelpers'

export default function Dashboard({
  employees,
  employeeStatus,
  presentCount,
  absentCount,
  setActiveTab,
  setSelectedEmployeeId,
}) {
  return (
    <>
      {/* KPI Cards Grid */}
      <div className="dashboard-kpi-grid">
        <article className="dashboard-kpi-card kpi-primary">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Employees</span>
            <strong className="kpi-value">{employees.length}</strong>
            <span className="kpi-change">Active workforce</span>
          </div>
        </article>

        <article className="dashboard-kpi-card kpi-success">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Present Today</span>
            <strong className="kpi-value">{presentCount}</strong>
            <span className="kpi-change">
              {employees.length > 0 ? Math.round((presentCount / employees.length) * 100) : 0}% attendance rate
            </span>
          </div>
        </article>

        <article className="dashboard-kpi-card kpi-warning">
          <div className="kpi-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Absent Today</span>
            <strong className="kpi-value">{absentCount}</strong>
            <span className="kpi-change">Requires attention</span>
          </div>
        </article>
      </div>

      {/* Recent Activity Section */}
      <div className="dashboard-grid">
        <section className="dashboard-card">
          <div className="card-header">
            <h3>Today's Attendance</h3>
            <button 
              className="text-btn"
              onClick={() => setActiveTab('employees')}
            >
              View All →
            </button>
          </div>
          <div className="attendance-list">
            {employeeStatus
              .filter(emp => emp.timedIn)
              .sort((a, b) => new Date(a.timeInValue) - new Date(b.timeInValue))
              .slice(0, 3)
              .map((emp) => (
              <div
                key={emp.id}
                className="attendance-item"
                onClick={() => {
                  setSelectedEmployeeId(emp.id)
                  setActiveTab('employees')
                }}
              >
                <div className="attendance-avatar">
                  {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                </div>
                <div className="attendance-info">
                  <strong>{`${emp.firstName} ${emp.lastName}`}</strong>
                  <span className="attendance-position">{emp.position}</span>
                </div>
                <div className="attendance-status">
                  {emp.timedIn ? (
                    <>
                      <span className="status-badge status-present">Present</span>
                      <span className="attendance-time">{formatTimeShort(emp.timeInValue)}</span>
                    </>
                  ) : (
                    <span className="status-badge status-absent">Absent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {employeeStatus.filter(emp => emp.timedIn).length === 0 && (
            <p className="empty-state">No clock-ins yet today.</p>
          )}
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button
              className="action-card"
              onClick={() => setActiveTab('employees')}
            >
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="action-content">
                <strong>Manage Employees</strong>
                <span>View and edit employee records</span>
              </div>
            </button>

            <button
              className="action-card"
              onClick={() => setActiveTab('summary')}
            >
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="action-content">
                <strong>Summary</strong>
                <span>Review attendance by date range</span>
              </div>
            </button>

            <button
              className="action-card"
              onClick={() => setActiveTab('employees')}
            >
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div className="action-content">
                <strong>Add Employee</strong>
                <span>Register new team member</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
