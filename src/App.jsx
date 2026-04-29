import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import EmployeesList from './components/EmployeesList'
import EmployeeDetails from './components/EmployeeDetails'
import SummaryView from './components/SummaryView'
import MaintenanceWithSudoMode from './components/MaintenanceWithSudoMode'
import RegisterEmployeeModal from './components/RegisterEmployeeModal'
import ProfileModal from './components/ProfileModal'
import ConfirmDiscardModal from './components/ConfirmDiscardModal'
import Toast from './components/Toast'
import ZoomableImage from './components/ZoomableImage'
import { setCookie, getCookie, deleteCookie } from './utils/cookies'
import { 
  MANILA_DATE_KEY_FORMATTER, 
  formatTimeShort, 
  formatDate, 
  formatDateTime, 
  getDateOnly,
  shiftDateKeyByDays 
} from './utils/dateHelpers'
import { 
  loginAdmin, 
  registerEmployee, 
  updateEmployee, 
  uploadAvatar,
  fetchProofImage,
  resolveProofUrl,
  fetchRoles,
} from './services/api'
import { useAttendanceData } from './hooks/useAttendanceData'

// Import styles
import './styles/base.css'
import './styles/Login.css'
import './styles/Sidebar.css'
import './styles/Dashboard.css'
import './styles/Employees.css'
import './styles/Summary.css'
import './styles/Modal.css'
import './styles/Maintenance.css'
import './styles/SudoMode.css'
import './styles/Toast.css'

function App() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!getCookie('dtr_admin_token') && getCookie('dtr_admin_role') === 'ROLE_SUPER_ADMIN'
  )
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [keepLoggedIn, setKeepLoggedIn] = useState(() => getCookie('dtr_keep_logged_in') === 'true')
  const [loginError, setLoginError] = useState('')

  // Toast notification state
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })
  const [newEmployeeId, setNewEmployeeId] = useState(null)

  // Loading states
  const [isRegistering, setIsRegistering] = useState(false)
  const [isSavingCredentials, setIsSavingCredentials] = useState(false)
  const [isLoadingProof, setIsLoadingProof] = useState(false)

  // Modal states
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerFormHasChanges, setRegisterFormHasChanges] = useState(false)
  const [showRegisterConfirmClose, setShowRegisterConfirmClose] = useState(false)
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)
  const [viewingCredentialsEmployeeId, setViewingCredentialsEmployeeId] = useState(null)
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false)
  const [proofPreviewUrl, setProofPreviewUrl] = useState('')
  const [proofPreviewTitle, setProofPreviewTitle] = useState('Proof Preview')
  const [proofPreviewError, setProofPreviewError] = useState('')
  const [isProofFullscreen, setIsProofFullscreen] = useState(false)

  // Form states
  const [editingCredentialsForm, setEditingCredentialsForm] = useState({
    email: '', firstName: '', lastName: '', position: '', contactNumber: '', address: ''
  })
  const [profileAvatarFile, setProfileAvatarFile] = useState(null)
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('')
  const [registerForm, setRegisterForm] = useState({
    email: '', firstName: '', lastName: '', position: '', contactNumber: '', address: ''
  })

  // Roles for position dropdown
  const [roles, setRoles] = useState([])

  // Navigation and filter states
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState(MANILA_DATE_KEY_FORMATTER.format(new Date()))
  const [toDate, setToDate] = useState(MANILA_DATE_KEY_FORMATTER.format(new Date()))
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [summarySearch, setSummarySearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState('all')
  const [employeeViewMode, setEmployeeViewMode] = useState('cards')
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Data from custom hook
  const { employees, setEmployees, attendanceLogs, setAttendanceLogs, isLoadingDashboard } = 
    useAttendanceData(isLoggedIn)

  // Fetch roles when logged in
  useEffect(() => {
    if (!isLoggedIn) return
    const token = getCookie('dtr_admin_token')
    fetchRoles(token).then(setRoles).catch(() => setRoles([]))
  }, [isLoggedIn])

  // Computed data
  const logsWithEmployee = useMemo(
    () =>
      attendanceLogs.map((log) => {
        const employee = employees.find((e) => e.id === log.employeeId)
        return {
          ...log,
          photoUrl: resolveProofUrl(log.photoUrl || log.proofUrl),
          fullName: employee ? `${employee.firstName} ${employee.lastName}` : log.employeeName || 'Unknown',
          position: employee?.position || log.employeePosition || '—',
        }
      }),
    [attendanceLogs, employees]
  )

  const todayDate = MANILA_DATE_KEY_FORMATTER.format(new Date())

  const logsByWeek = useMemo(() => {
    if (!selectedDate || !toDate) return []
    return logsWithEmployee.filter((log) => {
      const dateOnly = getDateOnly(log.timeIn)
      return dateOnly >= selectedDate && dateOnly <= toDate
    })
  }, [logsWithEmployee, selectedDate, toDate])

  const logsByEmployee = useMemo(
    () => selectedEmployeeId ? logsWithEmployee.filter((log) => log.employeeId === selectedEmployeeId) : [],
    [logsWithEmployee, selectedEmployeeId]
  )

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  )

  const filteredEmployees = useMemo(() => {
    let result = employees
    if (employeeSearch.trim()) {
      const query = employeeSearch.toLowerCase()
      result = result.filter((emp) =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query) ||
        emp.position.toLowerCase().includes(query)
      )
    }
    if (employeeFilterStatus !== 'all') {
      const todayLogs = logsWithEmployee.filter((log) => getDateOnly(log.timeIn) === todayDate)
      const presentIds = new Set(todayLogs.map((log) => log.employeeId))
      result = result.filter((emp) =>
        employeeFilterStatus === 'present' ? presentIds.has(emp.id) : !presentIds.has(emp.id)
      )
    }
    return result
  }, [employees, employeeSearch, employeeFilterStatus, logsWithEmployee, todayDate])

  const employeeStatus = useMemo(() => {
    const todayLogs = logsWithEmployee.filter((log) => getDateOnly(log.timeIn) === todayDate)
    return employees.map((emp) => {
      const log = todayLogs.find((l) => l.employeeId === emp.id)
      return {
        ...emp,
        timedIn: !!log,
        timeInValue: log?.timeIn || null,
        timeOutValue: log?.timeOut || null,
      }
    })
  }, [employees, logsWithEmployee, todayDate])

  const presentCount = employeeStatus.filter((emp) => emp.timedIn).length
  const absentCount = employees.length - presentCount
  const todayLogsCount = logsWithEmployee.filter((log) => getDateOnly(log.timeIn) === todayDate).length

  const filteredSummaryLogs = useMemo(() => {
    let result = logsByWeek
    if (summarySearch.trim()) {
      const query = summarySearch.toLowerCase()
      result = result.filter((log) => log.fullName.toLowerCase().includes(query))
    }
    return result
  }, [logsByWeek, summarySearch])

  const paginatedSummaryLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSummaryLogs.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSummaryLogs, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredSummaryLogs.length / itemsPerPage)

  // Effects
  useEffect(() => {
    return () => {
      if (proofPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proofPreviewUrl)
      }
    }
  }, [proofPreviewUrl])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedDate, summarySearch])

  useEffect(() => {
    // Update date/time every minute
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (credentialsModalOpen && viewingCredentialsEmployeeId) {
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
      }
    }
  }, [credentialsModalOpen, viewingCredentialsEmployeeId, employees])

  // Handlers
  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const data = await loginAdmin(loginForm.email.trim().toLowerCase(), loginForm.password)
      const expiryDays = keepLoggedIn ? 30 : 7
      setCookie('dtr_admin_token', data.token, expiryDays)
      setCookie('dtr_admin_role', data.role, expiryDays)
      setCookie('dtr_keep_logged_in', keepLoggedIn ? 'true' : 'false', expiryDays)
      setIsLoggedIn(true)
      setLoginForm({ email: '', password: '' })
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    deleteCookie('dtr_admin_token')
    deleteCookie('dtr_admin_role')
    deleteCookie('dtr_keep_logged_in')
    setIsLoggedIn(false)
    setLoginForm({ email: '', password: '' })
    setKeepLoggedIn(false)
    setActiveTab('overview')
  }

  const handleForgotPassword = (event) => {
    event.preventDefault()
    window.alert('Password recovery feature coming soon. Please contact your administrator.')
  }

  const handleRegisterEmployee = async (event, formData) => {
    event.preventDefault()
    const token = getCookie('dtr_admin_token')
    if (!token) {
      setToast({ isVisible: true, message: 'Admin session expired. Please login again.', type: 'error' })
      return
    }

    setIsRegistering(true)
    try {
      const dataToSubmit = formData || {
        email: registerForm.email.trim().toLowerCase(),
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        position: registerForm.position.trim(),
        contactNumber: registerForm.contactNumber.trim(),
        address: registerForm.address.trim(),
      }

      const newEmployee = await registerEmployee(token, dataToSubmit)

      setEmployees((current) => [...current, newEmployee])
      setRegisterForm({ email: '', firstName: '', lastName: '', position: '', contactNumber: '', address: '' })
      setRegisterModalOpen(false)
      setRegisterFormHasChanges(false)
      
      // Show success toast and highlight new employee
      setToast({ 
        isVisible: true, 
        message: `✅ ${newEmployee.firstName} ${newEmployee.lastName} successfully registered!`, 
        type: 'success' 
      })
      setNewEmployeeId(newEmployee.id)
      
      // Remove highlight after 3 seconds
      setTimeout(() => {
        setNewEmployeeId(null)
      }, 3000)
    } catch (error) {
      setToast({ isVisible: true, message: error.message, type: 'error' })
    } finally {
      setIsRegistering(false)
    }
  }

  const handleCloseRegisterModal = () => {
    if (registerFormHasChanges) {
      setShowRegisterConfirmClose(true)
    } else {
      setRegisterModalOpen(false)
      setRegisterForm({ email: '', firstName: '', lastName: '', position: '', contactNumber: '', address: '' })
    }
  }

  const handleRegisterModalEscape = () => {
    handleCloseRegisterModal()
  }

  const handleKeepEditingRegister = () => {
    setShowRegisterConfirmClose(false)
  }

  const handleDiscardRegisterChanges = () => {
    setShowRegisterConfirmClose(false)
    setRegisterModalOpen(false)
    setRegisterFormHasChanges(false)
    setRegisterForm({ email: '', firstName: '', lastName: '', position: '', contactNumber: '', address: '' })
  }

  const handleCloseCredentialsModal = () => {
    setCredentialsModalOpen(false)
    setViewingCredentialsEmployeeId(null)
    setIsSavingCredentials(false)
    setEditingCredentialsForm({ email: '', firstName: '', lastName: '', position: '', contactNumber: '', address: '' })
    if (profileAvatarPreview) {
      URL.revokeObjectURL(profileAvatarPreview)
    }
    setProfileAvatarFile(null)
    setProfileAvatarPreview('')
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        window.alert('Please upload only PNG or JPEG images.')
        event.target.value = '' // Reset input
        return
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        window.alert('File size must be less than 5MB.')
        event.target.value = '' // Reset input
        return
      }
      
      if (profileAvatarPreview) {
        URL.revokeObjectURL(profileAvatarPreview)
      }
      setProfileAvatarFile(file)
      setProfileAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveCredentials = async (event) => {
    event.preventDefault()
    const employeeId = viewingCredentialsEmployeeId
    if (!employeeId) return

    const token = getCookie('dtr_admin_token')
    if (!token) {
      window.alert('Admin session expired. Please login again.')
      return
    }

    setIsSavingCredentials(true)
    try {
      if (profileAvatarFile) {
        await uploadAvatar(token, employeeId, profileAvatarFile)
      }

      const updatedEmployee = await updateEmployee(token, employeeId, {
        email: editingCredentialsForm.email.trim().toLowerCase(),
        firstName: editingCredentialsForm.firstName.trim(),
        lastName: editingCredentialsForm.lastName.trim(),
        position: editingCredentialsForm.position.trim(),
        contactNumber: editingCredentialsForm.contactNumber.trim(),
        address: editingCredentialsForm.address.trim(),
      })

      setEmployees((current) => current.map((emp) => emp.id === updatedEmployee.id ? updatedEmployee : emp))
      handleCloseCredentialsModal()
    } catch (error) {
      window.alert(error.message)
    } finally {
      setIsSavingCredentials(false)
    }
  }

  const openProofPreview = async (entry) => {
    const token = getCookie('dtr_admin_token')
    const rawProofUrl = resolveProofUrl(entry.photoUrl || entry.proofUrl)

    setProofPreviewError('')
    if (proofPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(proofPreviewUrl)
    }
    setProofPreviewUrl('')
    setProofPreviewTitle(`${entry.fullName} - Proof`)
    setProofPreviewOpen(true)
    setIsLoadingProof(true)

    if (!token || !rawProofUrl) {
      setProofPreviewError('Unable to load proof image.')
      setIsLoadingProof(false)
      return
    }

    try {
      const blob = await fetchProofImage(token, rawProofUrl)
      const objectUrl = URL.createObjectURL(blob)
      setProofPreviewUrl(objectUrl)
    } catch {
      setProofPreviewError('Failed to load proof image.')
    } finally {
      setIsLoadingProof(false)
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

  if (!isLoggedIn) {
    return (
      <Login
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        keepLoggedIn={keepLoggedIn}
        setKeepLoggedIn={setKeepLoggedIn}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        handleLogin={handleLogin}
        handleForgotPassword={handleForgotPassword}
      />
    )
  }

  return (
    <main className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />

      <section className="main-content">
        <header className="top-header">
          <h1 className="company-name">Orlando Prestige Inc.</h1>
          <div className="current-date">
            {currentDateTime.toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </header>

        {isLoadingDashboard ? (
          <section className="loading-state">
            <div className="loading-spinner" />
            <h2>Loading dashboard...</h2>
            <p>Please wait while we fetch your data.</p>
          </section>
        ) : activeTab === 'overview' ? (
          <Dashboard
            employees={employees}
            employeeStatus={employeeStatus}
            presentCount={presentCount}
            absentCount={absentCount}
            setActiveTab={setActiveTab}
            setSelectedEmployeeId={setSelectedEmployeeId}
          />
        ) : activeTab === 'employees' ? (
          selectedEmployeeId ? (
            <EmployeeDetails
              employee={selectedEmployee}
              logs={logsByEmployee}
              onBack={() => setSelectedEmployeeId(null)}
              onViewProfile={() => {
                setViewingCredentialsEmployeeId(selectedEmployeeId)
                setCredentialsModalOpen(true)
              }}
              openProofPreview={openProofPreview}
              formatDate={formatDate}
              formatTimeShort={formatTimeShort}
            />
          ) : (
            <EmployeesList
              employees={filteredEmployees}
              employeeStatus={employeeStatus}
              employeeSearch={employeeSearch}
              setEmployeeSearch={setEmployeeSearch}
              employeeFilterStatus={employeeFilterStatus}
              setEmployeeFilterStatus={setEmployeeFilterStatus}
              employeeViewMode={employeeViewMode}
              setEmployeeViewMode={setEmployeeViewMode}
              setRegisterModalOpen={setRegisterModalOpen}
              setSelectedEmployeeId={setSelectedEmployeeId}
              formatTimeShort={formatTimeShort}
              newEmployeeId={newEmployeeId}
            />
          )
        ) : activeTab === 'maintenance' ? (
          <MaintenanceWithSudoMode employees={employees} />
        ) : (
          <SummaryView
            logs={paginatedSummaryLogs}
            summarySearch={summarySearch}
            setSummarySearch={setSummarySearch}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            toDate={toDate}
            setToDate={setToDate}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            openProofPreview={openProofPreview}
            formatDate={formatDate}
            formatTimeShort={formatTimeShort}
          />
        )}
      </section>

      <Modal 
        isOpen={registerModalOpen} 
        onClose={handleCloseRegisterModal}
        onEscapeKey={handleRegisterModalEscape}
        disableBackdropClick={true}
        title="Register New Employee"
      >
        <RegisterEmployeeModal
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          isRegistering={isRegistering}
          handleRegisterEmployee={handleRegisterEmployee}
          onCancel={handleCloseRegisterModal}
          onFormChangeDetected={setRegisterFormHasChanges}
          roles={roles}
        />
      </Modal>

      <ConfirmDiscardModal
        isOpen={showRegisterConfirmClose}
        onKeepEditing={handleKeepEditingRegister}
        onDiscard={handleDiscardRegisterChanges}
      />

      <Modal isOpen={credentialsModalOpen} onClose={handleCloseCredentialsModal} title="Employee Profile">
        <ProfileModal
          employee={employees.find((e) => e.id === viewingCredentialsEmployeeId)}
          editingCredentialsForm={editingCredentialsForm}
          setEditingCredentialsForm={setEditingCredentialsForm}
          profileAvatarPreview={profileAvatarPreview}
          handleAvatarChange={handleAvatarChange}
          isSavingCredentials={isSavingCredentials}
          handleSaveCredentials={handleSaveCredentials}
          roles={roles}
        />
      </Modal>

      <Modal isOpen={proofPreviewOpen} onClose={closeProofPreview} title={proofPreviewTitle}>
        {isLoadingProof ? (
          <div className="proof-preview-loading">
            <div className="loading-spinner" />
            <p>Loading proof image...</p>
          </div>
        ) : proofPreviewError ? (
          <div className="proof-preview-error">
            <p>{proofPreviewError}</p>
          </div>
        ) : (
          <ZoomableImage src={proofPreviewUrl} alt="Attendance Proof" />
        )}
      </Modal>

      {isProofFullscreen && proofPreviewUrl && (
        <div className="fullscreen-overlay" onClick={() => setIsProofFullscreen(false)}>
          <button
            className="fullscreen-close-btn"
            onClick={() => setIsProofFullscreen(false)}
            aria-label="Exit fullscreen"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <ZoomableImage src={proofPreviewUrl} alt="Attendance Proof Fullscreen" />
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </main>
  )
}

export default App
