import { useMemo, useState } from 'react'
import Modal from './Modal'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const AUTH_API_BASE_URL = API_BASE_URL.replace(/\/?api\/v1\/?$/, '')

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem('dtr_admin_token'),
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
    new Date().toISOString().split('T')[0],
  )
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)

  const [employees, setEmployees] = useState([
    {
      id: 1,
      email: 'ana.reyes@orlando.com',
      firstName: 'Ana',
      lastName: 'Reyes',
      position: 'Sales Associate',
      contactNumber: '+63 917 111 2345',
      address: 'Taguig City',
    },
    {
      id: 2,
      email: 'miguel.santos@orlando.com',
      firstName: 'Miguel',
      lastName: 'Santos',
      position: 'Store Manager',
      contactNumber: '+63 917 222 3456',
      address: 'Makati City',
    },
    {
      id: 3,
      email: 'carlo.rodriguez@orlando.com',
      firstName: 'Carlo',
      lastName: 'Rodriguez',
      position: 'Sales Associate',
      contactNumber: '+63 917 333 4567',
      address: 'Quezon City',
    },
  ])

  const [attendanceLogs, setAttendanceLogs] = useState([
    {
      id: 101,
      employeeId: 1,
      timeIn: '2026-04-07T08:03:00',
      timeOut: '2026-04-07T17:18:00',
      photoUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 102,
      employeeId: 2,
      timeIn: '2026-04-07T08:11:00',
      timeOut: '2026-04-07T17:09:00',
      photoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 103,
      employeeId: 1,
      timeIn: '2026-04-06T08:12:00',
      timeOut: '2026-04-06T17:20:00',
      photoUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 104,
      employeeId: 3,
      timeIn: '2026-04-07T08:25:00',
      timeOut: null,
      photoUrl:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    },
  ])

  const formatTimeShort = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    return date.toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (value) => {
    const date = new Date(value)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (value) => {
    const date = new Date(value)
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDateOnly = (dateString) => dateString.split('T')[0]

  const logsWithEmployee = useMemo(
    () =>
      attendanceLogs.map((log) => {
        const employee = employees.find((e) => e.id === log.employeeId)
        return {
          ...log,
          fullName: employee
            ? `${employee.firstName} ${employee.lastName}`
            : 'Unknown',
          position: employee?.position || '—',
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
    const today = new Date().toISOString().split('T')[0]
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

  const handleRegisterSubmit = (event) => {
    event.preventDefault()

    const nextEmployee = {
      id: Date.now(),
      email: registerForm.email.trim(),
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      position: registerForm.position.trim(),
      contactNumber: registerForm.contactNumber.trim(),
      address: registerForm.address.trim(),
    }

    setEmployees((current) => [nextEmployee, ...current])
    setRegisterForm({
      email: '',
      firstName: '',
      lastName: '',
      position: '',
      contactNumber: '',
      address: '',
    })
    setRegisterModalOpen(false)
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

  const openProofPreview = (entry) => {
    setProofPreviewUrl(entry.photoUrl)
    setProofPreviewTitle(`${entry.fullName} - Proof`)
    setProofPreviewOpen(true)
  }

  const closeProofPreview = () => {
    setProofPreviewOpen(false)
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

  const todayDate = new Date().toISOString().split('T')[0]

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
                                    <img
                                      className="thumb"
                                      src={entry.photoUrl}
                                      alt="Attendance proof"
                                    />
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
                              <img
                                className="thumb"
                                src={entry.photoUrl}
                                alt="Attendance proof"
                              />
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
          </Modal>
        </>
      )}
    </main>
  )
}

export default App
