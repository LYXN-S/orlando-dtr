export default function EmployeesList({
  employees,
  employeeStatus,
  employeeSearch,
  setEmployeeSearch,
  employeeFilterStatus,
  setEmployeeFilterStatus,
  employeeViewMode,
  setEmployeeViewMode,
  setRegisterModalOpen,
  setSelectedEmployeeId,
  formatTimeShort,
}) {
  return (
    <>
      <div className="employees-header">
        <div className="employees-filters">
          <button
            className={`filter-btn ${employeeFilterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setEmployeeFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${employeeFilterStatus === 'present' ? 'active' : ''}`}
            onClick={() => setEmployeeFilterStatus('present')}
          >
            Present
          </button>
          <button
            className={`filter-btn ${employeeFilterStatus === 'absent' ? 'active' : ''}`}
            onClick={() => setEmployeeFilterStatus('absent')}
          >
            Absent
          </button>
        </div>
        <button className="add-employee-btn" onClick={() => setRegisterModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Add Employee
        </button>
      </div>

      <div className="employees-search-bar">
        <div className="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search employees..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
          />
          {employeeSearch && (
            <button className="clear-search-btn" onClick={() => setEmployeeSearch('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${employeeViewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setEmployeeViewMode('cards')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            className={`view-btn ${employeeViewMode === 'table' ? 'active' : ''}`}
            onClick={() => setEmployeeViewMode('table')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {employeeViewMode === 'cards' ? (
        <div className="employees-grid">
          {employees.map((emp) => {
            const status = employeeStatus.find((s) => s.id === emp.id)
            return (
              <article
                key={emp.id}
                className="employee-card"
                onClick={() => setSelectedEmployeeId(emp.id)}
              >
                <div className="employee-card-avatar">
                  {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                </div>
                <div className="employee-card-info">
                  <h3>{`${emp.firstName} ${emp.lastName}`}</h3>
                  <p className="employee-card-position">{emp.position}</p>
                  <div className="employee-card-status">
                    {status?.timedIn ? (
                      <>
                        <span className="status-badge status-present">Present</span>
                        <span className="status-time">{formatTimeShort(status.timeInValue)}</span>
                      </>
                    ) : (
                      <span className="status-badge status-absent">Absent</span>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="employees-table-container">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Time In</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const status = employeeStatus.find((s) => s.id === emp.id)
                return (
                  <tr key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)}>
                    <td>
                      <div className="table-employee-info">
                        <div className="table-avatar">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <span>{`${emp.firstName} ${emp.lastName}`}</span>
                      </div>
                    </td>
                    <td>{emp.position}</td>
                    <td>{emp.contactNumber}</td>
                    <td>
                      {status?.timedIn ? (
                        <span className="status-badge status-present">Present</span>
                      ) : (
                        <span className="status-badge status-absent">Absent</span>
                      )}
                    </td>
                    <td>{status?.timedIn ? formatTimeShort(status.timeInValue) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {employees.length === 0 && (
        <p className="empty-state">No employees found.</p>
      )}
    </>
  )
}
