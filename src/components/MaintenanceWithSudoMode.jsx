import { useState } from 'react'
import { getCookie } from '../utils/cookies'
import { verifyPassword } from '../services/api'
import Maintenance from './Maintenance'
import '../styles/SudoMode.css'

function MaintenanceWithSudoMode({ employees = [] }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Please enter your password.')
      return
    }

    const token = getCookie('dtr_admin_token')
    if (!token) {
      setError('Admin session expired. Please login again.')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      await verifyPassword(token, password)
      setIsUnlocked(true)
      setPassword('')
    } catch (err) {
      setError(err.message || 'Incorrect password. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <>
      {/* Blurred Maintenance Background */}
      <div
        inert={!isUnlocked ? '' : undefined}
        className={`sudo-maintenance-wrapper ${!isUnlocked ? 'sudo-locked' : ''}`}
      >
        <Maintenance employees={employees} />
      </div>

      {/* Password Gate Modal Overlay */}
      {!isUnlocked && (
        <div className="sudo-modal-overlay">
          <div className="sudo-mode-card">
            <div className="sudo-mode-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <h2 className="sudo-mode-title">Admin Verification Required</h2>
            <p className="sudo-mode-description">
              The Maintenance section contains destructive actions that cannot be undone.
              Please confirm your password to access this area.
            </p>

            <form onSubmit={handlePasswordSubmit} className="sudo-mode-form">
              <div className="sudo-form-group">
                <label htmlFor="sudo-password">Admin Password</label>
                <div className="sudo-password-input-wrapper">
                  <input
                    id="sudo-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`sudo-input ${error ? 'error' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    disabled={isVerifying}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="sudo-password-toggle"
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
                {error && (
                  <div className="sudo-error-message">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="sudo-submit-btn"
                disabled={isVerifying || !password.trim()}
              >
                {isVerifying ? (
                  <>
                    <span className="sudo-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                      <polyline points="10 17 15 12 10 7"></polyline>
                      <line x1="15" y1="12" x2="3" y2="12"></line>
                    </svg>
                    Unlock Maintenance
                  </>
                )}
              </button>
            </form>

            <div className="sudo-mode-warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>This verification will reset if you navigate away from this page.</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MaintenanceWithSudoMode
