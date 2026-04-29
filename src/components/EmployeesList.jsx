import { useState, useEffect, useMemo } from 'react'
import { resolveProofUrl, fetchAuthenticatedImage } from '../services/api'
import { getCookie } from '../utils/cookies'
import RoleCombobox from './RoleCombobox'
import Pagination from './Pagination'

function AvatarImage({ employee, className, size = 'medium' }) {
  const [avatarBlobUrl, setAvatarBlobUrl] = useState('')

  useEffect(() => {
    if (employee?.avatarUrl) {
      const token = getCookie('dtr_admin_token')
      if (token) {
        const fullUrl = resolveProofUrl(employee.avatarUrl)
        fetchAuthenticatedImage(fullUrl, token)
          .then(blob => {
            const url = URL.createObjectURL(blob)
            setAvatarBlobUrl(url)
          })
          .catch(err => {
          })
      }
    }

    return () => {
      if (avatarBlobUrl) {
        URL.revokeObjectURL(avatarBlobUrl)
      }
    }
  }, [employee?.avatarUrl])

  if (avatarBlobUrl) {
    return <img src={avatarBlobUrl} alt={`${employee.firstName} ${employee.lastName}`} />
  }

  return (
    <span>
      {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
    </span>
  )
}

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
  newEmployeeId,
}) {
  const [positionFilter, setPositionFilter] = useState('all')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // No need to manually extract positions - RoleCombobox fetches from API

  // Apply filters and sorting
  const filteredAndSortedEmployees = useMemo(() => {
    let result = [...employees]

    // Position filter
    if (positionFilter !== 'all') {
      result = result.filter(emp => emp.position === positionFilter)
    }

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        let aVal, bVal

        if (sortField === 'name') {
          aVal = `${a.firstName} ${a.lastName}`.toLowerCase()
          bVal = `${b.firstName} ${b.lastName}`.toLowerCase()
        } else if (sortField === 'position') {
          aVal = a.position.toLowerCase()
          bVal = b.position.toLowerCase()
        } else if (sortField === 'contact') {
          aVal = a.contactNumber
          bVal = b.contactNumber
        } else if (sortField === 'status') {
          const aStatus = employeeStatus.find(s => s.id === a.id)
          const bStatus = employeeStatus.find(s => s.id === b.id)
          aVal = aStatus?.timedIn ? 1 : 0
          bVal = bStatus?.timedIn ? 1 : 0
        } else if (sortField === 'timeIn') {
          const aStatus = employeeStatus.find(s => s.id === a.id)
          const bStatus = employeeStatus.find(s => s.id === b.id)
          aVal = aStatus?.timeInValue ? new Date(aStatus.timeInValue).getTime() : 0
          bVal = bStatus?.timeInValue ? new Date(bStatus.timeInValue).getTime() : 0
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [employees, positionFilter, sortField, sortDirection, employeeStatus])

  // Pagination
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedEmployees.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedEmployees, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [employeeSearch, employeeFilterStatus, positionFilter])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    )
  }

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
        <div className="employees-header-actions">
          <button className="export-btn" onClick={() => window.alert('Export to CSV functionality coming soon!')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="add-employee-btn" onClick={() => setRegisterModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Employee
          </button>
        </div>
      </div>

      <div className="employees-search-controls">
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

        <RoleCombobox
          value={positionFilter}
          onChange={setPositionFilter}
          placeholder="All Positions"
          includeAllOption={true}
          allOptionLabel="All Positions"
        />

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
        <>
          {paginatedEmployees.length > 0 ? (
            <div className="employees-grid">
              {paginatedEmployees.map((emp) => {
                const status = employeeStatus.find((s) => s.id === emp.id)
                const isNewEmployee = emp.id === newEmployeeId
                return (
                  <article
                    key={emp.id}
                    className={`employee-card ${isNewEmployee ? 'new-employee' : ''}`}
                    onClick={() => setSelectedEmployeeId(emp.id)}
                  >
                    <div className="employee-card-avatar">
                      <AvatarImage employee={emp} />
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
            <div className="empty-search-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <h3>No employees found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedEmployees.length}
          />
        </>
      ) : (
        <>
          {paginatedEmployees.length > 0 ? (
            <div className="employees-table-container">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      <span>Name</span>
                      {getSortIcon('name')}
                    </th>
                    <th onClick={() => handleSort('position')} className="sortable">
                      <span>Position</span>
                      {getSortIcon('position')}
                    </th>
                    <th onClick={() => handleSort('contact')} className="sortable">
                      <span>Contact</span>
                      {getSortIcon('contact')}
                    </th>
                    <th onClick={() => handleSort('status')} className="sortable">
                      <span>Status</span>
                      {getSortIcon('status')}
                    </th>
                    <th onClick={() => handleSort('timeIn')} className="sortable">
                      <span>Time In</span>
                      {getSortIcon('timeIn')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEmployees.map((emp) => {
                    const status = employeeStatus.find((s) => s.id === emp.id)
                    const isNewEmployee = emp.id === newEmployeeId
                    return (
                      <tr 
                        key={emp.id} 
                        onClick={() => setSelectedEmployeeId(emp.id)}
                        className={isNewEmployee ? 'new-employee' : ''}
                      >
                        <td>
                          <div className="table-employee-info">
                            <div className="table-avatar">
                              <AvatarImage employee={emp} />
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
          ) : (
            <div className="empty-search-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <h3>No employees found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAndSortedEmployees.length}
          />
        </>
      )}
    </>
  )
}
