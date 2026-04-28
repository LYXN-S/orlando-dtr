import { useState, useEffect } from 'react'
import orlandoLogo from '../assets/orlando_logo.jpg'
import { AUTH_API_BASE_URL } from '../utils/constants'

export default function Login({
  loginForm,
  setLoginForm,
  keepLoggedIn,
  setKeepLoggedIn,
  loginError,
  isLoggingIn,
  handleLogin,
  handleForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)

  useEffect(() => {
    fetch(`${AUTH_API_BASE_URL}/app/download`)
      .then((r) => r.json())
      .then((data) => {
        if (data.available === 'true' && data.url) setDownloadUrl(data.url)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <div className="login-page-wrapper">
        <div className="login-bg-diagonal" />

        <div className="login-card">
          <div className="login-content-grid">

            {/* Left column */}
            <div className="login-logo-column">
              <img src={orlandoLogo} alt="Orlando Prestige" className="login-logo" />
            </div>

            {/* Right column */}
            <div className="login-form-column">
              <div className="login-form-container">

                <h1 className="login-heading">DTR Admin Portal</h1>

                {loginError && (
                  <div className="login-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '2px', flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="login-form">

                  <div>
                    <label htmlFor="email" className="login-label">Email address</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                      required
                      autoFocus
                      disabled={isLoggingIn}
                      className="login-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="login-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                        required
                        disabled={isLoggingIn}
                        className="login-input"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="login-password-toggle"
                      >
                        {showPassword ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="login-submit-btn"
                  >
                    {isLoggingIn ? (
                      <>
                        <svg style={{ width: '15px', height: '15px', animation: 'lspin 1s linear infinite' }} viewBox="0 0 24 24" fill="none">
                          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in...
                      </>
                    ) : 'Sign In'}
                  </button>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="login-download-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Mobile App
                    </a>
                  )}

                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
