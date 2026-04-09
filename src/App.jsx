import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const AUTH_API_BASE_URL = API_BASE_URL.replace(/\/?api\/v1\/?$/, '')
const MANILA_TIME_ZONE = 'Asia/Manila'

const parseBackendDate = (value) => {
  if (!value) return null
  const hasZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value)
  const parsed = new Date(hasZone ? value : `${value}Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const MANILA_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
})

const MANILA_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const MANILA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const MANILA_DATE_KEY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: MANILA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      !!localStorage.getItem('dtr_admin_token') &&
      localStorage.getItem('dtr_admin_role') === 'ROLE_SUPER_ADMIN',
  )
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)
  const [viewingCredentialsEmployeeId, setViewingCredentialsEmployeeId] = useState(null)
  const [credentialsEditMode, setCredentialsEditMode] = useState(false)
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false)
  const [proofPreviewUrl, setProofPreviewUrl] = useState('')
  const [proofPreviewTitle, setProofPreviewTitle] = useState('Proof Preview')
  const [proofPreviewError, setProofPreviewError] = useState('')
  const [editingCredentialsForm, setEditingCredentialsForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    position: '',
    contactNumber: '',
    address: '',
  })
  const [registerForm, setRegisterForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    position: '',
    contactNumber: '',
    address: '',
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState(
    MANILA_DATE_KEY_FORMATTER.format(new Date()),
  )
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  const [employees, setEmployees] = useState([])
  const [attendanceLogs, setAttendanceLogs] = useState([])

  const resolveProofUrl = (value) => {
    if (!value) return ''
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value
    }
    return `${AUTH_API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
  }

  const formatTimeShort = (value) => {
    if (!value) return '—'
    const date = parseBackendDate(value)
    if (!date) return '—'
    return MANILA_TIME_FORMATTER.format(date)
  }

  const formatDate = (value) => {
    const date = parseBackendDate(value)
    if (!date) return '—'
    return MANILA_DATE_FORMATTER.format(date)
  }

  const formatDateTime = (value) => {
    const date = parseBackendDate(value)
    if (!date) return '—'
    return MANILA_DATE_TIME_FORMATTER.format(date)
  }

  const getDateOnly = (dateString) => {
    const date = parseBackendDate(dateString)
    if (!date) return ''
    return MANILA_DATE_KEY_FORMATTER.format(date)
  }

  const logsWithEmployee = useMemo(
    () =>
      attendanceLogs.map((log) => {
        const employee = employees.find((e) => e.id === log.employeeId)
        return {
          ...log,
          photoUrl: resolveProofUrl(log.photoUrl || log.proofUrl),
          fullName: employee
            ? `${employee.firstName} ${employee.lastName}`
            : log.employeeName || 'Unknown',
          position: employee?.position || log.employeePosition || '—',
        }
      }),
    [attendanceLogs, employees],
  )

  const logsByDate = useMemo(
    () =>
      logsWithEmployee.filter(
        (log) => getDateOnly(log.timeIn) === selectedDate,
      ),
    [logsWithEmployee, selectedDate],
  )

  const logsByEmployee = useMemo(
    () =>
      selectedEmployeeId
        ? logsWithEmployee.filter(
            (log) => log.employeeId === selectedEmployeeId,
          )
        : [],
    [logsWithEmployee, selectedEmployeeId],
  )

  const employeeStatus = useMemo(() => {
    const today = MANILA_DATE_KEY_FORMATTER.format(new Date())
    return employees.map((emp) => {
      const todayLog = attendanceLogs.find(
        (log) =>
          log.employeeId === emp.id && getDateOnly(log.timeIn) === today,
      )
      return {
        ...emp,
        timedIn: !!todayLog,
        timeInValue: todayLog?.timeIn,
        timeOutValue: todayLog?.timeOut,
      }
    })
  }, [employees, attendanceLogs])

  useEffect(() => {
    return () => {
      if (proofPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proofPreviewUrl)
      }
    }
  }, [proofPreviewUrl])

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    const token = localStorage.getItem('dtr_admin_token')
    if (!token) {
      return
    }

    let cancelled = false

    const loadEmployees = async () => {
      try {
        const response = await fetch(`${AUTH_API_BASE_URL}/api/v1/admin/dtr/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (!cancelled && Array.isArray(data)) {
          setEmployees(data)
        }
      } catch {
        // Keep current in-memory state when the backend is temporarily unreachable.
      }
    }

    const loadAttendance = async () => {
      try {
        const response = await fetch(`${AUTH_API_BASE_URL}/api/v1/admin/dtr/attendance`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        if (!cancelled && Array.isArray(data)) {
          setAttendanceLogs(data)
        }
      } catch {
        // Keep current in-memory state when the backend is temporarily unreachable.
      }
    }

    loadEmployees()
    loadAttendance()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn])

  const handleLoginSubmit = async (event) => {
    event.preventDefault()
    const email = loginForm.email.trim().toLowerCase()
    const password = loginForm.password.trim()

    if (!email || !password) {
      setLoginError('Email and password are required.')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        let message = 'Invalid credentials.'
        try {
          const errorBody = await response.json()
          if (errorBody?.message) {
            message = errorBody.message
          }
        } catch {
          // Ignore non-JSON error bodies and use default message.
        }
        setLoginError(message)
        return
      }

      const data = await response.json()
      if (!data?.token) {
        setLoginError('Login succeeded but no token was returned.')
        return
      }

      if (data.role !== 'ROLE_SUPER_ADMIN') {
        localStorage.removeItem('dtr_admin_token')
        localStorage.removeItem('dtr_admin_role')
        setIsLoggedIn(false)
        setLoginError('Only the backend admin account can access DTR.')
        return
      }

      localStorage.setItem('dtr_admin_token', data.token)
      localStorage.setItem('dtr_admin_role', data.role || '')
      setIsLoggedIn(true)
      setLoginError('')
      return
    } catch {
      setLoginError('Unable to reach backend. Check if API is running.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleRegisterSubmit = async (event) => {
    event.preventDefault()

    const token = localStorage.getItem('dtr_admin_token')
    if (!token) {
      window.alert('Admin session expired. Please login again.')
      return
    }

    const requestBody = {
      email: registerForm.email.trim().toLowerCase(),
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      position: registerForm.position.trim(),
      contactNumber: registerForm.contactNumber.trim(),
      address: registerForm.address.trim(),
    }

    try {
      const response = await fetch(`${AUTH_API_BASE_URL}/api/v1/admin/dtr/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        let message = 'Unable to register employee.'
        try {
          const errorBody = await response.json()
          if (errorBody?.message) {
            message = errorBody.message
          }
        } catch {
          // Ignore non-JSON errors and keep default message.
        }
        throw new Error(message)
      }

      const savedEmployee = await response.json()
      setEmployees((current) => [
        savedEmployee,
        ...current.filter((emp) => emp.id !== savedEmployee.id),
      ])
      setRegisterForm({
        email: '',
        firstName: '',
        lastName: '',
        position: '',
        contactNumber: '',
        address: '',
      })
      setRegisterModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register employee.'
      window.alert(message)
    }
  }

  const handleEnterEditMode = () => {
    const emp = employees.find((e) => e.id === viewingCredentialsEmployeeId)
    if (emp) {
      setEditingCredentialsForm({
        email: emp.email,
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.position,
        contactNumber: emp.contactNumber,
        address: emp.address,
      })
      setCredentialsEditMode(true)
    }
  }

  const handleSaveCredentials = () => {
    setEmployees((current) =>
      current.map((emp) =>
        emp.id === viewingCredentialsEmployeeId
          ? {
              ...emp,
              ...editingCredentialsForm,
            }
          : emp,
      ),
    )
    setCredentialsEditMode(false)
    setEditingCredentialsForm({
      email: '',
      firstName: '',
      lastName: '',
      position: '',
      contactNumber: '',
      address: '',
    })
  }

  const handleCancelEdit = () => {
    setCredentialsEditMode(false)
    setEditingCredentialsForm({
      email: '',
      firstName: '',
      lastName: '',
      position: '',
      contactNumber: '',
      address: '',
    })
  }

  const openProofPreview = async (entry) => {
    const token = localStorage.getItem('dtr_admin_token')
    const rawProofUrl = resolveProofUrl(entry.photoUrl || entry.proofUrl)

    setProofPreviewError('')
    if (proofPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(proofPreviewUrl)
    }
    setProofPreviewUrl('')
    setProofPreviewTitle(`${entry.fullName} - Proof`)
    setProofPreviewOpen(true)

    if (!token || !rawProofUrl) {
      setProofPreviewError('Unable to load proof image.')
      return
    }

    try {
      const response = await fetch(rawProofUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch proof image.')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      setProofPreviewUrl(objectUrl)
    } catch {
      setProofPreviewError('Failed to load proof image.')
    }
  }

  const closeProofPreview = () => {
    setProofPreviewOpen(false)
    setProofPreviewError('')
    if (proofPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(proofPreviewUrl)
    }
    setProofPreviewUrl('')
    setProofPreviewTitle('Proof Preview')
  }

  const handleLogout = () => {
    localStorage.removeItem('dtr_admin_token')
    localStorage.removeItem('dtr_admin_role')
    setIsLoggedIn(false)
    setLoginForm({ email: '', password: '' })
    setActiveTab('overview')
  }

  const todayDate = MANILA_DATE_KEY_FORMATTER.format(new Date())

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Orlando DTR</h1>
          <p>Daily time records management</p>
        </div>
        {isLoggedIn ? (
          <button className="secondary-btn" onClick={handleLogout}>
            Logout
          </button>
        ) : null}
      </header>

      {!isLoggedIn ? (
        <section className="login-container">
          <div className="card card-login">
            <h2>Admin Login</h2>
            <p className="helper-text">Access employee time records</p>
            <form className="form-grid" onSubmit={handleLoginSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="admin@orlando.com"
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Enter password"
                  required
                />
              </label>
              {loginError ? <p className="error-text">{loginError}</p> : null}
              <button type="submit" className="primary-btn" disabled={isLoggingIn}>
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <p className="demo-text">
              Use your backend admin credentials from environment configuration.
            </p>
          </div>
        </section>
      ) : (
        <>
          <div className="dashboard-toolbar">
            <button
              className="primary-btn"
              onClick={() => setRegisterModalOpen(true)}
            >
              + Register Employee
            </button>
          </div>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              By Employee
            </button>
            <button
              className={`tab ${activeTab === 'date' ? 'active' : ''}`}
              onClick={() => setActiveTab('date')}
            >
              By Date
            </button>
          </div>

          {activeTab === 'overview' && (
            <section className="card">
              <h2>Today's Attendance Status</h2>
              <p className="helper-text">
                {formatDate(`${todayDate}T00:00:00`)}
              </p>
              <div className="employee-grid">
                {employeeStatus.map((emp) => (
                  <div
                    key={emp.id}
                    className={`employee-card ${emp.timedIn ? 'present' : 'absent'}`}
                    onClick={() => {
                      setSelectedEmployeeId(emp.id)
                      setActiveTab('employees')
                    }}
                  >
                    <div className="employee-card-header">
                      <div>
                        <h3>{`${emp.firstName} ${emp.lastName}`}</h3>
                        <p className="position">{emp.position}</p>
                      </div>
                      <div
                        className={`status-badge ${emp.timedIn ? 'present' : 'absent'}`}
                      >
                        {emp.timedIn ? 'Present' : 'Absent'}
                      </div>
                    </div>
                    {emp.timedIn && (
                      <div className="time-info">
                        <div className="time-item">
                          <span className="label">In:</span>
                          <span className="time">
                            {formatTimeShort(emp.timeInValue)}
                          </span>
                        </div>
                        {emp.timeOutValue && (
                          <div className="time-item">
                            <span className="label">Out:</span>
                            <span className="time">
                              {formatTimeShort(emp.timeOutValue)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'employees' && (
            <div className="two-column">
              <section className="card">
                <h2>Select Employee</h2>
                <p className="helper-text">
                  View DTR for a specific employee
                </p>
                <div className="employee-list">
                  {employees.map((emp) => (
                    <button
                      key={emp.id}
                      className={`employee-list-item ${selectedEmployeeId === emp.id ? 'selected' : ''}`}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                    >
                      <div>
                        <strong>{`${emp.firstName} ${emp.lastName}`}</strong>
                        <p>{emp.position}</p>
                      </div>
                      <span className="arrow">→</span>
                    </button>
                  ))}
                </div>
              </section>

              {selectedEmployeeId && (
                <section className="card">
                  <div className="employee-header-section">
                    <div>
                      <h2>
                        {`${employees.find((e) => e.id === selectedEmployeeId)?.firstName || ''} ${employees.find((e) => e.id === selectedEmployeeId)?.lastName || ''}`}{' '}
                        - DTR
                      </h2>
                      <p className="helper-text">
                        {logsByEmployee.length} records found
                      </p>
                    </div>
                    <button
                      className="secondary-btn"
                      onClick={() => {
                        setViewingCredentialsEmployeeId(selectedEmployeeId)
                        setCredentialsModalOpen(true)
                      }}
                    >
                      View Credentials
                    </button>
                  </div>
                  {logsByEmployee.length > 0 ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Time In</th>
                            <th>Time Out</th>
                            <th>Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logsByEmployee
                            .sort(
                              (a, b) =>
                                new Date(b.timeIn) - new Date(a.timeIn),
                            )
                            .map((entry) => (
                              <tr key={entry.id}>
                                <td>{formatDate(entry.timeIn)}</td>
                                <td>{formatTimeShort(entry.timeIn)}</td>
                                <td>{formatTimeShort(entry.timeOut)}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="thumb-button"
                                    onClick={() => openProofPreview(entry)}
                                  >
                                    Open Proof
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-state">
                      No records found for this employee.
                    </p>
                  )}
                </section>
              )}
            </div>
          )}

          {activeTab === 'date' && (
            <section className="card">
              <h2>Records by Date</h2>
              <div className="filter-controls">
                <label>
                  Select Date
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={todayDate}
                  />
                </label>
                <span className="date-display">{formatDate(`${selectedDate}T00:00:00`)}</span>
              </div>

              {logsByDate.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsByDate.map((entry) => (
                        <tr key={entry.id}>
                          <td>
                            <button
                              className="employee-link"
                              onClick={() => {
                                setSelectedEmployeeId(entry.employeeId)
                                setActiveTab('employees')
                              }}
                            >
                              {entry.fullName}
                            </button>
                          </td>
                          <td>{entry.position}</td>
                          <td>{formatTimeShort(entry.timeIn)}</td>
                          <td>{formatTimeShort(entry.timeOut)}</td>
                          <td>
                            <button
                              type="button"
                              className="thumb-button"
                              onClick={() => openProofPreview(entry)}
                            >
                              Open Proof
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  No records found for {formatDate(`${selectedDate}T00:00:00`)}.
                </p>
              )}
            </section>
          )}

          <Modal
            isOpen={registerModalOpen}
            onClose={() => setRegisterModalOpen(false)}
            title="Register New Employee"
          >
            <form className="form-grid" onSubmit={handleRegisterSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="employee@orlando.com"
                  required
                />
              </label>

              <label>
                First Name
                <input
                  type="text"
                  value={registerForm.firstName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                  placeholder="First name"
                  required
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  value={registerForm.lastName}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                  placeholder="Last name"
                  required
                />
              </label>

              <label>
                Position
                <input
                  type="text"
                  placeholder="e.g., Sales Associate"
                  value={registerForm.position}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      position: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                Contact Number
                <input
                  type="text"
                  value={registerForm.contactNumber}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      contactNumber: event.target.value,
                    }))
                  }
                  placeholder="+63 917 123 4567"
                  required
                />
              </label>

              <label>
                Address
                <input
                  type="text"
                  value={registerForm.address}
                  onChange={(event) =>
                    setRegisterForm((current) => ({
                      ...current,
                      address: event.target.value,
                    }))
                  }
                  placeholder="City, Province"
                  required
                />
              </label>

              <button type="submit" className="primary-btn">
                Register Employee
              </button>
            </form>
          </Modal>
          <Modal
            isOpen={credentialsModalOpen}
            onClose={() => {
              setCredentialsModalOpen(false)
              setViewingCredentialsEmployeeId(null)
              setCredentialsEditMode(false)
            }}
            title={
              viewingCredentialsEmployeeId
                ? `${employees.find((e) => e.id === viewingCredentialsEmployeeId)?.firstName || ''} ${employees.find((e) => e.id === viewingCredentialsEmployeeId)?.lastName || ''} - Credentials`
                : 'Employee Credentials'
            }
          >
            {viewingCredentialsEmployeeId &&
              employees.find((e) => e.id === viewingCredentialsEmployeeId) && (
                <>
                  {!credentialsEditMode ? (
                    <div className="credentials-layout">
                      {(() => {
                        const emp = employees.find(
                          (e) => e.id === viewingCredentialsEmployeeId,
                        )
                        return (
                          <>
                            <aside className="credentials-summary">
                              <div className="employee-avatar">
                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                              </div>
                              <div className="summary-copy">
                                <h3 className="full-name">
                                  {emp.firstName} {emp.lastName}
                                </h3>
                                <p className="summary-role">{emp.position}</p>
                              </div>
                            </aside>

                            <div className="credentials-sections">
                              <div className="credentials-section">
                                <h3 className="section-title">Contact Information</h3>
                                <div className="credential-item-full">
                                  <span className="credential-label">Email:</span>
                                  <span className="credential-value credential-value-break">
                                    {emp.email}
                                  </span>
                                </div>
                                <div className="credential-item-full">
                                  <span className="credential-label">Phone Number:</span>
                                  <span className="credential-value">
                                    {emp.contactNumber}
                                  </span>
                                </div>
                                <div className="credential-item-full">
                                  <span className="credential-label">Address:</span>
                                  <span className="credential-value">
                                    {emp.address}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="credentials-edit-layout">
                      {(() => {
                        const emp = employees.find(
                          (e) => e.id === viewingCredentialsEmployeeId,
                        )
                        return (
                          <>
                            <aside className="credentials-summary credentials-summary-edit">
                              <div className="employee-avatar">
                                {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                              </div>
                              <div className="summary-copy">
                                <h3 className="full-name">
                                  {emp.firstName} {emp.lastName}
                                </h3>
                                <p className="summary-role">{emp.position}</p>
                                <p className="summary-note">
                                  Update the employee record using the fields on the right.
                                </p>
                              </div>
                            </aside>

                            <form className="edit-form-grid">
                              <div className="credentials-section">
                                <h3 className="section-title">Identity</h3>
                                <div className="credentials-grid-2">
                                  <label>
                                    First Name
                                    <input
                                      type="text"
                                      value={editingCredentialsForm.firstName}
                                      onChange={(event) =>
                                        setEditingCredentialsForm((current) => ({
                                          ...current,
                                          firstName: event.target.value,
                                        }))
                                      }
                                      placeholder="First name"
                                      required
                                    />
                                  </label>

                                  <label>
                                    Last Name
                                    <input
                                      type="text"
                                      value={editingCredentialsForm.lastName}
                                      onChange={(event) =>
                                        setEditingCredentialsForm((current) => ({
                                          ...current,
                                          lastName: event.target.value,
                                        }))
                                      }
                                      placeholder="Last name"
                                      required
                                    />
                                  </label>
                                </div>
                              </div>

                              <div className="credentials-section">
                                <h3 className="section-title">Employment</h3>
                                <label>
                                  Position
                                  <input
                                    type="text"
                                    value={editingCredentialsForm.position}
                                    onChange={(event) =>
                                      setEditingCredentialsForm((current) => ({
                                        ...current,
                                        position: event.target.value,
                                      }))
                                    }
                                    placeholder="e.g., Sales Associate"
                                    required
                                  />
                                </label>
                              </div>

                              <div className="credentials-section">
                                <h3 className="section-title">Contact Information</h3>
                                <label>
                                  Email
                                  <input
                                    type="email"
                                    value={editingCredentialsForm.email}
                                    onChange={(event) =>
                                      setEditingCredentialsForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                      }))
                                    }
                                    placeholder="employee@orlando.com"
                                    required
                                  />
                                </label>

                                <label>
                                  Phone Number
                                  <input
                                    type="text"
                                    value={editingCredentialsForm.contactNumber}
                                    onChange={(event) =>
                                      setEditingCredentialsForm((current) => ({
                                        ...current,
                                        contactNumber: event.target.value,
                                      }))
                                    }
                                    placeholder="+63 917 123 4567"
                                    required
                                  />
                                </label>

                                <label>
                                  Address
                                  <input
                                    type="text"
                                    value={editingCredentialsForm.address}
                                    onChange={(event) =>
                                      setEditingCredentialsForm((current) => ({
                                        ...current,
                                        address: event.target.value,
                                      }))
                                    }
                                    placeholder="City, Province"
                                    required
                                  />
                                </label>
                              </div>
                            </form>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  <div className="modal-actions">
                    {!credentialsEditMode ? (
                      <button
                        className="primary-btn"
                        onClick={handleEnterEditMode}
                      >
                        Edit Credentials
                      </button>
                    ) : (
                      <>
                        <button
                          className="primary-btn"
                          onClick={handleSaveCredentials}
                        >
                          Update Credentials
                        </button>
                        <button
                          className="secondary-btn"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
          </Modal>

          <Modal
            isOpen={proofPreviewOpen}
            onClose={closeProofPreview}
            title={proofPreviewTitle}
          >
            {proofPreviewUrl ? (
              <div className="proof-preview">
                <img
                  className="proof-preview-image"
                  src={proofPreviewUrl}
                  alt={proofPreviewTitle}
                />
              </div>
            ) : null}
            {proofPreviewError ? (
              <p className="error-text">{proofPreviewError}</p>
            ) : null}
          </Modal>
        </>
      )}
    </main>
  )
}

export default App
