import { useState } from 'react'
import { getCookie } from '../utils/cookies'
import { verifyPassword } from '../services/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://206.189.87.46.nip.io'

function Maintenance({ employees = [] }) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Password verification modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
    return fullName.includes(query) || emp.position.toLowerCase().includes(query)
  })

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex)

  const handleDeleteClick = () => {
    if (selectedEmployeeIds.length === 0) {
      window.alert('Please select at least one employee first.')
      return
    }
    // Directly open password modal
    setShowPasswordModal(true)
    setPassword('')
    setPasswordError('')
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId)
      } else {
        return [...prev, employeeId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedEmployeeIds.length === paginatedEmployees.length) {
      // Deselect all on current page
      const currentPageIds = paginatedEmployees.map(emp => emp.id)
      setSelectedEmployeeIds(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      // Select all on current page
      const currentPageIds = paginatedEmployees.map(emp => emp.id)
      setSelectedEmployeeIds(prev => {
        const newIds = [...prev]
        currentPageIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id)
          }
        })
        return newIds
      })
    }
  }

  const selectedEmployees = employees.filter(emp => selectedEmployeeIds.includes(emp.id))

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setPasswordError('Please enter your password.')
      return
    }

    const token = getCookie('dtr_admin_token')
    if (!token) {
      setPasswordError('Admin session expired. Please login again.')
      return
    }

    setIsVerifying(true)
    setPasswordError('')

    try {
      await verifyPassword(token, password)
      // Password verified, proceed with deletion
      setShowPasswordModal(false)
      setPassword('')
      await performDelete()
    } catch (err) {
      setPasswordError(err.message || 'Incorrect password. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePasswordCancel = () => {
    setShowPasswordModal(false)
    setPassword('')
    setPasswordError('')
  }

  const performDelete = async () => {
    const token = getCookie('dtr_admin_token')
    if (!token) {
      window.alert('Admin session expired. Please login again.')
      return
    }

    setIsDeleting(true)
    setDeleteResult(null)

    try {
      let totalDeleted = 0
      const errors = []

      const employeesToDelete = employees.filter(emp => selectedEmployeeIds.includes(emp.id))

      // Delete records for each selected employee
      for (const employeeId of selectedEmployeeIds) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/admin/dtr/attendance/employee/${employeeId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `Failed to delete records: ${response.status}`)
          }

          const result = await response.json()
          totalDeleted += result.deletedCount || 0
        } catch (error) {
          const emp = employees.find(e => e.id === employeeId)
          const empName = emp ? `${emp.firstName} ${emp.lastName}` : `Employee ${employeeId}`
          errors.push(`${empName}: ${error.message}`)
        }
      }

      if (errors.length === 0) {
        setDeleteResult({
          success: true,
          message: `Successfully deleted attendance records for ${employeesToDelete.length} employee${employeesToDelete.length > 1 ? 's' : ''}`,
          deletedCount: totalDeleted,
          employeeNames: employeesToDelete.map(emp => `${emp.firstName} ${emp.lastName}`).join(', ')
        })
        setSelectedEmployeeIds([])
      } else if (errors.length < selectedEmployeeIds.length) {
        setDeleteResult({
          success: true,
          message: `Partially completed. ${totalDeleted} records deleted, but ${errors.length} employee(s) had errors.`,
          deletedCount: totalDeleted,
          employeeNames: employeesToDelete.map(emp => `${emp.firstName} ${emp.lastName}`).join(', '),
          errors: errors
        })
        setSelectedEmployeeIds([])
      } else {
        throw new Error(`All deletions failed:\n${errors.join('\n')}`)
      }
    } catch (error) {
      setDeleteResult({
        success: false,
        message: error.message
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="maintenance-container" style={{ maxWidth: '1280px', margin: '0 auto' }}>
      <div className="maintenance-content">
        <div className="maintenance-card danger-zone">
            <div className="card-header">
              <h3>⚠️ Danger Zone</h3>
              <span className="danger-badge">Destructive Actions</span>
            </div>

            <div className="maintenance-section">
              <div className="section-header-with-info">
                <div className="section-header-left">
                  <h4>Delete All Attendance Records for Employee</h4>
                  <p className="section-description">
                    Permanently delete all time-in and time-out records for a specific employee. 
                    This action cannot be undone.
                  </p>
                </div>
                <div className="maintenance-info-compact">
                  <div className="info-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <span>Records cannot be recovered</span>
                  </div>
                  <div className="info-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <span>Profiles remain intact</span>
                  </div>
                  <div className="info-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>Multiple selection enabled</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="employee-search">Search Employee</label>
                <input
                  id="employee-search"
                  type="text"
                  className="form-input"
                  placeholder="Search by name or position..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    Found {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              <div className="employee-table-container">
                <div className="employee-table-wrapper">
                  <table className="employee-table">
                    <thead>
                      <tr>
                        <th className="text-center">
                          <input
                            type="checkbox"
                            checked={paginatedEmployees.length > 0 && paginatedEmployees.every(emp => selectedEmployeeIds.includes(emp.id))}
                            onChange={handleSelectAll}
                            title="Select all on this page"
                          />
                        </th>
                        <th>Employee</th>
                        <th>Position</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.length > 0 ? (
                        paginatedEmployees.map(emp => (
                          <tr
                            key={emp.id}
                            className={selectedEmployeeIds.includes(emp.id) ? 'selected' : ''}
                            onClick={() => handleEmployeeSelect(emp.id)}
                          >
                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="checkbox-cell">
                                <input
                                  type="checkbox"
                                  checked={selectedEmployeeIds.includes(emp.id)}
                                  onChange={() => handleEmployeeSelect(emp.id)}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="employee-cell">
                                <div className="employee-avatar">
                                  {emp.avatarUrl ? (
                                    <img 
                                      src={`${API_BASE_URL}${emp.avatarUrl}`} 
                                      alt={`${emp.firstName} ${emp.lastName}`}
                                      onError={(e) => {
                                        e.target.style.display = 'none'
                                        e.target.nextSibling.style.display = 'flex'
                                      }}
                                    />
                                  ) : null}
                                  <div className="employee-avatar-placeholder" style={{ display: emp.avatarUrl ? 'none' : 'flex' }}>
                                    {emp.firstName[0]}{emp.lastName[0]}
                                  </div>
                                </div>
                                <span className="employee-name">{emp.firstName} {emp.lastName}</span>
                              </div>
                            </td>
                            <td>{emp.position}</td>
                            <td className="text-muted">{emp.email}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8"></circle>
                              <path d="m21 21-4.35-4.35"></path>
                            </svg>
                            <p>No employees found</p>
                            {searchQuery && <span>Try adjusting your search</span>}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && paginatedEmployees.length > 0 && (
                  <div className="table-pagination">
                    <div className="pagination-info-text">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <span className="page-number">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {selectedEmployees.length > 0 && (
                <div className="employee-preview">
                  <div className="preview-header">⚠️ Selected for Deletion ({selectedEmployees.length}):</div>
                  <div className="selected-employees-list">
                    {selectedEmployees.map(emp => (
                      <div key={emp.id} className="selected-employee-item">
                        <div className="preview-avatar-small">
                          {emp.avatarUrl ? (
                            <img 
                              src={`${API_BASE_URL}${emp.avatarUrl}`} 
                              alt={`${emp.firstName} ${emp.lastName}`}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="preview-avatar-placeholder-small" style={{ display: emp.avatarUrl ? 'none' : 'flex' }}>
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                        </div>
                        <div className="selected-employee-info">
                          <div className="selected-employee-name">{emp.firstName} {emp.lastName}</div>
                          <div className="selected-employee-position">{emp.position}</div>
                        </div>
                        <button 
                          className="remove-selection-btn"
                          onClick={() => handleEmployeeSelect(emp.id)}
                          title="Remove from selection"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn-delete-all"
                onClick={handleDeleteClick}
                disabled={selectedEmployees.length === 0 || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="spinner-small"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete {selectedEmployees.length} Selected Record{selectedEmployees.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>

              {deleteResult && (
                <div className={`delete-result ${deleteResult.success ? 'success' : 'error'}`}>
                  <div className="result-icon">
                    {deleteResult.success ? '✓' : '✗'}
                  </div>
                  <div className="result-content">
                    <div className="result-title">
                      {deleteResult.success ? 'Success' : 'Error'}
                    </div>
                    <div className="result-message">{deleteResult.message}</div>
                    {deleteResult.success && (
                      <div className="result-details">
                        <strong>{deleteResult.deletedCount}</strong> attendance record(s) deleted for{' '}
                        <strong>{deleteResult.employeeNames}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Password Verification Modal */}
      {showPasswordModal && selectedEmployees.length > 0 && (
        <div className="confirmation-modal-overlay" onClick={handlePasswordCancel}>
          <div className="confirmation-modal critical" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon critical-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="modal-title">Admin Password Required</h3>
            <p className="modal-message">
              You are about to permanently delete all attendance records for {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''}:
            </p>
            <div className="modal-employee-list-container">
              {selectedEmployees.map(emp => (
                <div key={emp.id} className="modal-employee-list-item">{emp.firstName} {emp.lastName} - {emp.position}</div>
              ))}
            </div>
            <p className="modal-message" style={{ marginTop: '1rem' }}>
              Please enter your admin password to authorize this deletion.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="modal-input-group">
                <label htmlFor="admin-password-input">Admin Password:</label>
                <div className="password-input-wrapper">
                  <input
                    id="admin-password-input"
                    type={showPassword ? 'text' : 'password'}
                    className={`modal-input ${passwordError ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setPasswordError('')
                    }}
                    disabled={isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isVerifying}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <div className="modal-error-message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {passwordError}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="modal-btn cancel" 
                  onClick={handlePasswordCancel}
                  disabled={isVerifying}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="modal-btn critical" 
                  disabled={isVerifying || !password.trim()}
                >
                  {isVerifying ? (
                    <>
                      <span className="spinner-small"></span>
                      Verifying...
                    </>
                  ) : (
                    'Confirm & Delete'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Maintenance
