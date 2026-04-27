export default function EmployeeDetails({
  employee,
  logs,
  onBack,
  onViewProfile,
  openProofPreview,
  formatDate,
  formatTimeShort,
}) {
  if (!employee) {
    return <p className="empty-state">Employee not found.</p>
  }

  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '—'
    const start = new Date(timeIn)
    const end = new Date(timeOut)
    const diff = end - start
    if (diff < 0) return '—'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <>
      <button className="back-btn" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Employees
      </button>

      <div className="employee-detail-header">
        <div className="employee-detail-info">
          <div className="employee-detail-avatar">
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </div>
          <div>
            <h2>{`${employee.firstName} ${employee.lastName}`}</h2>
            <p className="employee-detail-position">{employee.position}</p>
          </div>
          <button className="view-profile-btn" onClick={onViewProfile}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            View Profile
          </button>
        </div>
      </div>

      {logs.length > 0 ? (
        <div className="employee-records-table-container">
          <table className="employee-records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Duration</th>
                <th>Proof</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.timeIn)}</td>
                  <td>{formatTimeShort(entry.timeIn)}</td>
                  <td>{entry.timeOut ? formatTimeShort(entry.timeOut) : '—'}</td>
                  <td>{calculateDuration(entry.timeIn, entry.timeOut)}</td>
                  <td>
                    {entry.photoUrl ? (
                      <button
                        type="button"
                        className="proof-btn"
                        onClick={() => openProofPreview(entry)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state">No attendance records found for this employee.</p>
      )}
    </>
  )
}
