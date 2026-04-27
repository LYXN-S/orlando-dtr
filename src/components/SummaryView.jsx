import { useState } from 'react'

export default function SummaryView({
  logs,
  summarySearch,
  setSummarySearch,
  selectedDate,
  setSelectedDate,
  toDate,
  setToDate,
  currentPage,
  setCurrentPage,
  totalPages,
  openProofPreview,
  formatDate,
  formatTimeShort,
}) {
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('dtr_admin_token='))
        ?.split('=')[1]

      if (!token) {
        alert('Authentication token not found. Please log in again.')
        return
      }

      // Build URL with search parameter if present
      let url = `https://api.orlandoprestige.com/api/v1/admin/dtr/attendance/export-pdf?startDate=${selectedDate}&endDate=${toDate}`
      if (summarySearch.trim()) {
        url += `&search=${encodeURIComponent(summarySearch.trim())}`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      
      // Include search term in filename if present
      const searchSuffix = summarySearch.trim() ? `_${summarySearch.trim().replace(/\s+/g, '_')}` : ''
      a.download = `attendance_summary_${selectedDate}_to_${toDate}${searchSuffix}.pdf`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(blobUrl)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div className="summary-controls">
        <div className="date-range-picker">
          <div className="date-input-group">
            <label>From</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>

        <div className="summary-search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by employee name..."
            value={summarySearch}
            onChange={(e) => setSummarySearch(e.target.value)}
          />
          {summarySearch && (
            <button className="clear-search-btn" onClick={() => setSummarySearch('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <button 
          className="export-pdf-btn" 
          onClick={handleExportPDF} 
          disabled={logs.length === 0 || isExporting}
        >
          {isExporting ? (
            <>
              <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round" />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export PDF
            </>
          )}
        </button>
      </div>

      {logs.length > 0 ? (
        <>
          <div className="summary-table-container">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Employee</th>
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
                    <td>{entry.fullName}</td>
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="empty-state">No attendance records found for the selected date range.</p>
      )}
    </>
  )
}
