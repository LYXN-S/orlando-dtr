import { useState, useMemo } from 'react'
import StatCard from './StatCard'
import StatusBadge from './StatusBadge'
import EmptyState from './EmptyState'

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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const calculateDuration = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return null
    const start = new Date(timeIn)
    const end = new Date(timeOut)
    const diff = end - start
    if (diff < 0) return null
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes, totalMinutes: Math.floor(diff / (1000 * 60)) }
  }

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    let totalMinutes = 0
    let incompleteShifts = 0
    let activeShifts = 0
    let completedShifts = 0

    logs.forEach((entry) => {
      const duration = calculateDuration(entry.timeIn, entry.timeOut)
      if (duration) {
        totalMinutes += duration.totalMinutes
        completedShifts++
      } else {
        incompleteShifts++
        // Check if it's an active shift (today)
        const entryDate = new Date(entry.timeIn).toDateString()
        const today = new Date().toDateString()
        if (entryDate === today) {
          activeShifts++
        }
      }
    })

    const totalHours = Math.floor(totalMinutes / 60)
    const avgMinutes = logs.length > 0 ? totalMinutes / completedShifts : 0
    const avgHours = Math.floor(avgMinutes / 60)
    const avgMins = Math.floor(avgMinutes % 60)

    return {
      totalHours: `${totalHours}h ${totalMinutes % 60}m`,
      avgDuration: completedShifts > 0 ? `${avgHours}h ${avgMins}m` : '—',
      incompleteShifts,
      activeShifts,
      totalRecords: logs.length,
    }
  }, [logs])

  // Sorting logic
  const sortedLogs = useMemo(() => {
    if (!sortConfig.key) return logs

    const sorted = [...logs].sort((a, b) => {
      let aValue, bValue

      if (sortConfig.key === 'date') {
        aValue = new Date(a.timeIn).getTime()
        bValue = new Date(b.timeIn).getTime()
      } else if (sortConfig.key === 'timeIn') {
        aValue = new Date(a.timeIn).getTime()
        bValue = new Date(b.timeIn).getTime()
      } else if (sortConfig.key === 'duration') {
        const aDuration = calculateDuration(a.timeIn, a.timeOut)
        const bDuration = calculateDuration(b.timeIn, b.timeOut)
        aValue = aDuration ? aDuration.totalMinutes : -1
        bValue = bDuration ? bDuration.totalMinutes : -1
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [logs, sortConfig])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      )
    }
    return sortConfig.direction === 'asc' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    )
  }

  const handleClearDates = () => {
    // Get today's date in Manila timezone format (YYYY-MM-DD)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    setSelectedDate(todayStr)
    setToDate(todayStr)
  }

  const hasCustomDates = () => {
    // Get today's date in local format (YYYY-MM-DD)
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    // Show button if either date is different from today OR if dates have values
    return (selectedDate && toDate && (selectedDate !== todayStr || toDate !== todayStr))
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
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      {/* Summary Metrics */}
      <div className="summary-metrics">
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="Total Hours Logged"
          value={summaryMetrics.totalHours}
          subtitle={`${summaryMetrics.totalRecords} records`}
          variant="primary"
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          label="Average Shift Duration"
          value={summaryMetrics.avgDuration}
          subtitle="Per completed shift"
          variant="success"
        />
        <StatCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          label="Incomplete Shifts"
          value={summaryMetrics.incompleteShifts}
          subtitle={`${summaryMetrics.activeShifts} active now`}
          variant="warning"
        />
      </div>

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
          {hasCustomDates() && (
            <button
              type="button"
              className="clear-dates-btn"
              onClick={handleClearDates}
              title="Reset to today"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </button>
          )}
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

      {sortedLogs.length > 0 ? (
        <>
          <div className="summary-table-container">
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="sortable-header" onClick={() => handleSort('date')}>
                    <span>Date</span>
                    {getSortIcon('date')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('timeIn')}>
                    <span>Time In</span>
                    {getSortIcon('timeIn')}
                  </th>
                  <th>Time Out</th>
                  <th className="sortable-header" onClick={() => handleSort('duration')}>
                    <span>Duration</span>
                    {getSortIcon('duration')}
                  </th>
                  <th>Proof</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((entry) => {
                  const duration = calculateDuration(entry.timeIn, entry.timeOut)
                  return (
                    <tr key={entry.id}>
                      <td>{entry.fullName}</td>
                      <td>{formatDate(entry.timeIn)}</td>
                      <td>{formatTimeShort(entry.timeIn)}</td>
                      <td>
                        {entry.timeOut ? (
                          formatTimeShort(entry.timeOut)
                        ) : (
                          <StatusBadge type="missing" />
                        )}
                      </td>
                      <td>
                        {duration ? (
                          `${duration.hours}h ${duration.minutes}m`
                        ) : (
                          <StatusBadge type="active" />
                        )}
                      </td>
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
                  )
                })}
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
        <EmptyState
          message="No attendance records found for the selected date range."
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
      )}
    </>
  )
}
