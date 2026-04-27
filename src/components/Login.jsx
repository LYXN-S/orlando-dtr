import orlandoLogo from '../assets/orlando_logo.jpg'

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
  return (
    <section className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src={orlandoLogo} alt="Orlando Logo" className="login-logo" />
            <h1>Orlando DTR</h1>
            <p>Admin Portal</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            {loginError && <div className="login-error">{loginError}</div>}

            <div className="form-group">
              <label htmlFor="email">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="admin@orlando.com"
                required
                disabled={isLoggingIn}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter your password"
                required
                disabled={isLoggingIn}
              />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  disabled={isLoggingIn}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={handleForgotPassword}
                disabled={isLoggingIn}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={isLoggingIn}>
              {isLoggingIn ? 'SIGNING IN...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
