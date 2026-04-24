import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import orlandoLogo from './assets/orlando_logo.jpg'

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

const parseDateKeyToUtcDate = (dateKey) => {
  if (!dateKey) return null
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(Date.UTC(year, month - 1, day))
}

const formatUtcDateToDateKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`

const shiftDateKeyByDays = (dateKey, days) => {
  const date = parseDateKeyToUtcDate(dateKey)
  if (!date) return dateKey
  date.setUTCDate(date.getUTCDate() + days)
  return formatUtcDateToDateKey(date)
}

const getWeekRangeFromDateKey = (dateKey) => {
  const date = parseDateKeyToUtcDate(dateKey)
  if (!date) {
    return { startKey: '', endKey: '' }
  }

  // Monday-based week range.
  const weekday = date.getUTCDay()
  const daysFromMonday = (weekday + 6) % 7
  const weekStart = new Date(date)
  weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday)

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)

  return {
    startKey: formatUtcDateToDateKey(weekStart),
    endKey: formatUtcDateToDateKey(weekEnd),
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () =>
      !!localStorage.getItem('dtr_admin_token') &&
      localStorage.getItem('dtr_admin_role') === 'ROLE_SUPER_ADMIN',
  )
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false)
  const [isSavingCredentials, setIsSavingCredentials] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [keepLoggedIn, setKeepLoggedIn] = useState(
    () => localStorage.getItem('dtr_keep_logged_in') === 'true'
  )
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
  const [employeeSearch, setEmployeeSearch] = useState('')

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

  const selectedWeekRange = useMemo(
    () => getWeekRangeFromDateKey(selectedDate),
    [selectedDate],
  )

  const logsByWeek = useMemo(() => {
    if (!selectedWeekRange.startKey || !selectedWeekRange.endKey) {
      return []
    }

    return logsWithEmployee.filter((log) => {
      const dateOnly = getDateOnly(log.timeIn)
      return (
        dateOnly >= selectedWeekRange.startKey &&
        dateOnly <= selectedWeekRange.endKey
      )
    })
  }, [logsWithEmployee, selectedWeekRange])

  const logsByEmployee = useMemo(
    () =>
      selectedEmployeeId
        ? logsWithEmployee.filter(
            (log) => log.employeeId === selectedEmployeeId,
          )
        : [],
    [logsWithEmployee, selectedEmployeeId],
  )

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId],
  )

  const filteredEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase()
    if (!term) return employees

    return employees.filter((emp) => {
      const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase()
      return (
        fullName.includes(term) ||
        (emp.position || '').toLowerCase().includes(term) ||
        (emp.email || '').toLowerCase().includes(term)
      )
    })
  }, [employees, employeeSearch])

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

  const presentCount = useMemo(
    () => employeeStatus.filter((emp) => emp.timedIn).length,
    [employeeStatus],
  )

  const absentCount = useMemo(
    () => employeeStatus.length - presentCount,
    [employeeStatus, presentCount],
  )

  const todayLogsCount = useMemo(() => {
    const today = MANILA_DATE_KEY_FORMATTER.format(new Date())
    return attendanceLogs.filter(
      (log) => getDateOnly(log.timeIn) === today,
    ).length
  }, [attendanceLogs])

  const weeklyUniqueEmployees = useMemo(
    () => new Set(logsByWeek.map((log) => log.employeeId)).size,
    [logsByWeek],
  )

  const weeklyCompletedSessions = useMemo(
    () => logsByWeek.filter((log) => !!log.timeOut).length,
    [logsByWeek],
  )

  useEffect(() => {
    return () => {
      if (proofPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proofPreviewUrl)
      }
    }
  }, [proofPreviewUrl])

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoadingDashboard(false)
      return
    }

    const token = localStorage.getItem('dtr_admin_token')
    if (!token) {
      setIsLoadingDashboard(false)
      return
    }

    let cancelled = false
    setIsLoadingDashboard(true)

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

    Promise.all([loadEmployees(), loadAttendance()]).finally(() => {
      if (!cancelled) {
        setIsLoadingDashboard(false)
      }
    })

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
      if (keepLoggedIn) {
        localStorage.setItem('dtr_keep_logged_in', 'true')
      } else {
        localStorage.removeItem('dtr_keep_logged_in')
      }
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
      setIsSavingCredentials(false)
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
    localStorage.removeItem('dtr_keep_logged_in')
    setIsLoggedIn(false)
    setIsLoadingDashboard(false)
    setIsSavingCredentials(false)
    setLoginForm({ email: '', password: '' })
    setKeepLoggedIn(false)
    setActiveTab('overview')
  }

  const handleForgotPassword = (event) => {
    event.preventDefault()
    // Placeholder for password recovery flow
    window.alert('Password recovery feature coming soon. Please contact your administrator.')
  }

  const handleCloseCredentialsModal = () => {
    setCredentialsModalOpen(false)
    setViewingCredentialsEmployeeId(null)
    setCredentialsEditMode(false)
    setIsSavingCredentials(false)
    setEditingCredentialsForm({
      email: '',
      firstName: '',
      lastName: '',
      position: '',
      contactNumber: '',
      address: '',
    })
  }

  const handleSaveCredentials = async (event) => {
    event.preventDefault()

    const employeeId = viewingCredentialsEmployeeId
    if (!employeeId) {
      return
    }

    const token = localStorage.getItem('dtr_admin_token')
    if (!token) {
      window.alert('Admin session expired. Please login again.')
      return
    }

    const requestBody = {
      email: editingCredentialsForm.email.trim().toLowerCase(),
      firstName: editingCredentialsForm.firstName.trim(),
      lastName: editingCredentialsForm.lastName.trim(),
      position: editingCredentialsForm.position.trim(),
      contactNumber: editingCredentialsForm.contactNumber.trim(),
      address: editingCredentialsForm.address.trim(),
    }

    setIsSavingCredentials(true)

    try {
      const response = await fetch(
        `${AUTH_API_BASE_URL}/api/v1/admin/dtr/employees/${employeeId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      )

      if (!response.ok) {
        let message = 'Unable to update employee credentials.'
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

      const updatedEmployee = await response.json()
      setEmployees((current) =>
        current.map((emp) =>
          emp.id === updatedEmployee.id ? updatedEmployee : emp,
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update employee credentials.'
      window.alert(message)
    } finally {
      setIsSavingCredentials(false)
    }
  }

  const todayDate = MANILA_DATE_KEY_FORMATTER.format(new Date())

  const handlePreviousWeek = () => {
    setSelectedDate((current) => shiftDateKeyByDays(current, -7))
  }

  const handleNextWeek = () => {
    setSelectedDate((current) => {
      const next = shiftDateKeyByDays(current, 7)
      return next > todayDate ? todayDate : next
    })
  }

  const handleCurrentWeek = () => {
    setSelectedDate(todayDate)
  }

  const weeklyRangeLabel =
    selectedWeekRange.startKey && selectedWeekRange.endKey
      ? `${formatDate(`${selectedWeekRange.startKey}T00:00:00`)} - ${formatDate(`${selectedWeekRange.endKey}T00:00:00`)}`
      : '—'

  return (
    <main className={`app-shell ${!isLoggedIn ? 'login-shell' : ''}`}>
      {isLoggedIn ? (
        <>
          <aside className="sidebar">
            <div className="sidebar-header">
              <img
                src={orlandoLogo}
                alt="Orlando logo"
                className="sidebar-logo"
              />
            </div>

            <nav className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Dashboard</span>
              </button>
              <button
                className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
                onClick={() => setActiveTab('employees')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Employees</span>
              </button>
              <button
                className={`nav-item ${activeTab === 'date' ? 'active' : ''}`}
                onClick={() => setActiveTab('date')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Weekly Audit</span>
              </button>
            </nav>
          </aside>

          <div className="main-content">
            <header className="top-header">
              <h1>Orlando DTR</h1>
              <button className="logout-btn" onClick={handleLogout}>
                <span>Logout</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </header>

            <div className="content-area">
              <section className="navigation-strip card">
            <p>
              <strong>Active staff:</strong> {presentCount} present, {absentCount} absent, {employees.length} total employees.
            </p>
            <p>
              Use <strong>Overview</strong> for live status, <strong>Employees</strong> for individual records and credentials, and <strong>Weekly Audit</strong> for date-range review.
            </p>
          </section>

          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="tab-title">Overview</span>
              <span className="tab-caption">Live attendance pulse</span>
            </button>
            <button
              className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <span className="tab-title">Employee View</span>
              <span className="tab-caption">Timeline and credentials</span>
            </button>
            <button
              className={`tab ${activeTab === 'weeklyAudit' ? 'active' : ''}`}
              onClick={() => setActiveTab('weeklyAudit')}
            >
              <span className="tab-title">Weekly Audit</span>
              <span className="tab-caption">Cross-team review</span>
            </button>
          </div>

          {isLoadingDashboard ? (
            <section className="card loading-state" aria-busy="true">
              <div className="loading-spinner" />
              <h2>Loading DTR data</h2>
              <p className="helper-text">
                Fetching employees and attendance records.
              </p>
            </section>
          ) : activeTab === 'overview' ? (
            <section className="card">
              <div className="tab-header">
                <div>
                  <h2>Today's Attendance Status</h2>
                  <p className="section-guide">
                    Start here. Review attendance health, then click a card to open the employee timeline.
                  </p>
                  <p className="helper-text">
                    {formatDate(`${todayDate}T00:00:00`)}
                  </p>
                </div>
                <div className="kpi-grid">
                  <article className="kpi-card kpi-good">
                    <span>Present</span>
                    <strong>{presentCount}</strong>
                  </article>
                  <article className="kpi-card kpi-warn">
                    <span>Absent</span>
                    <strong>{absentCount}</strong>
                  </article>
                  <article className="kpi-card">
                    <span>Logs Today</span>
                    <strong>{todayLogsCount}</strong>
                  </article>
                </div>
              </div>

              <div className="next-step-banner">
                <strong>Next action:</strong> pick any employee card below to continue to Employee View.
              </div>

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
          ) : activeTab === 'employees' ? (
            <div className="two-column">
              <section className="card">
                <div className="tab-header compact">
                  <div>
                    <h2>Employee Directory</h2>
                    <p className="section-guide">
                      Pick a profile to inspect timeline entries and manage credentials.
                    </p>
                  </div>
                </div>

                <label className="search-label">
                  Search Employee
                  <input
                    type="text"
                    value={employeeSearch}
                    onChange={(event) => setEmployeeSearch(event.target.value)}
                    placeholder="Name, role, or email"
                  />
                </label>

                <div className="employee-list">
                  {filteredEmployees.map((emp) => (
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

                {filteredEmployees.length === 0 ? (
                  <p className="empty-state">No employee matched your search.</p>
                ) : null}
              </section>

              {selectedEmployeeId ? (
                <section className="card">
                  <div className="employee-header-section">
                    <div>
                      <h2>
                        {`${selectedEmployee?.firstName || ''} ${selectedEmployee?.lastName || ''}`}{' '}
                        Timeline
                      </h2>
                      <p className="helper-text">
                        {logsByEmployee.length} records found
                      </p>
                    </div>

                    <div className="employee-actions">
                      <button
                        className="secondary-btn"
                        onClick={() => {
                          setViewingCredentialsEmployeeId(selectedEmployeeId)
                          setCredentialsModalOpen(true)
                        }}
                      >
                        View Credentials
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => setActiveTab('weeklyAudit')}
                      >
                        Open Weekly Audit
                      </button>
                    </div>
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
              ) : (
                <section className="card selection-placeholder">
                  <h2>Choose An Employee To Continue</h2>
                  <p className="helper-text">
                    Select a name on the left panel to load their attendance timeline and credential actions.
                  </p>
                </section>
              )}
            </div>
          ) : activeTab === 'weeklyAudit' ? (
            <section className="card">
              <div className="tab-header">
                <div>
                  <h2>Weekly Audit</h2>
                  <p className="section-guide">
                    Adjust the week, review attendance consistency, and verify proof activity.
                  </p>
                </div>
                <div className="kpi-grid">
                  <article className="kpi-card">
                    <span>Total Records</span>
                    <strong>{logsByWeek.length}</strong>
                  </article>
                  <article className="kpi-card">
                    <span>Employees Logged</span>
                    <strong>{weeklyUniqueEmployees}</strong>
                  </article>
                  <article className="kpi-card">
                    <span>Completed Sessions</span>
                    <strong>{weeklyCompletedSessions}</strong>
                  </article>
                </div>
              </div>

              <div className="filter-controls">
                <label>
                  Week Anchor Date
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={todayDate}
                  />
                </label>
                <div className="week-actions">
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handlePreviousWeek}
                  >
                    Previous Week
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleCurrentWeek}
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={handleNextWeek}
                    disabled={selectedDate >= todayDate}
                  >
                    Next Week
                  </button>
                </div>
                <span className="date-display">{weeklyRangeLabel}</span>
              </div>

              {logsByWeek.length > 0 ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logsByWeek
                        .sort((a, b) => new Date(b.timeIn) - new Date(a.timeIn))
                        .map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.timeIn)}</td>
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
                  No records found for the selected week ({weeklyRangeLabel}).
                </p>
              )}
            </section>
          ) : null}

            </div>
          </div>

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
            onClose={handleCloseCredentialsModal}
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
                    <form className="credentials-edit-layout" onSubmit={handleSaveCredentials}>
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

                            <div className="credentials-edit-content">
                              <div className="edit-form-grid">
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
                              </div>

                              <div className="modal-actions">
                                <button
                                  type="submit"
                                  className="primary-btn"
                                  disabled={isSavingCredentials}
                                >
                                  {isSavingCredentials ? 'Updating...' : 'Update Credentials'}
                                </button>
                                <button
                                  type="button"
                                  className="secondary-btn"
                                  onClick={handleCancelEdit}
                                  disabled={isSavingCredentials}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </form>
                  )}
                  {!credentialsEditMode ? (
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={handleEnterEditMode}
                      >
                        Edit Credentials
                      </button>
                    </div>
                  ) : null}
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
      ) : (
        <section className="login-container">
          <div className="glass-login-card">
            <div className="login-logo-section">
              <img
                src={orlandoLogo}
                alt="Orlando logo"
                className="login-logo"
              />
            </div>
            
            <div className="login-form-section">
              <form className="glass-form" onSubmit={handleLoginSubmit}>
                <label htmlFor="login-email" className="glass-label">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Username"
                    aria-required="true"
                    required
                  />
                </label>
                
                <label htmlFor="login-password" className="glass-label">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    placeholder="••••••••••••"
                    aria-required="true"
                    required
                  />
                </label>
                
                <div className="login-options">
                  <label className="glass-checkbox-label">
                    <input
                      type="checkbox"
                      id="keep-logged-in"
                      checked={keepLoggedIn}
                      onChange={(event) => setKeepLoggedIn(event.target.checked)}
                      aria-label="Remember me"
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="glass-forgot-link" onClick={handleForgotPassword}>
                    Forgot Password?
                  </a>
                </div>
                
                {loginError ? <p className="glass-error-text" role="alert" aria-live="polite">{loginError}</p> : null}
                
                <button type="submit" className="glass-login-btn" disabled={isLoggingIn}>
                  {isLoggingIn ? 'SIGNING IN...' : 'LOGIN'}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default App
