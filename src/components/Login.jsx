import { useState } from 'react'
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
  const [showPassword, setShowPassword] = useState(false)

  const inputStyle = {
    height: '46px',
    width: '100%',
    borderRadius: '10px',
    border: '1px solid rgba(212,184,150,0.45)',
    background: '#faf7f4',
    padding: '0 16px',
    fontSize: '14px',
    color: '#2c1a0e',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <>
      {/* PAGE WRAPPER */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#BF8D56',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        
        {/* Background diagonal extension */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(105deg, #ffffff 0%, #ffffff 46.5%, transparent 46%)',
          zIndex: 0,
        }} />

        {/* MAIN CARD - diagonal gradient */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '90%',
          maxWidth: '1100px',
          minHeight: '600px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          background: 'linear-gradient(105deg, #ffffff 0%, #ffffff 45%, #BF8D56 45%, #BF8D56 100%)',
        }}>

          {/* CONTENT GRID */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            height: '100%',
            minHeight: '600px',
          }}>

            {/* LEFT COLUMN - logo centered in white half */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px',
              paddingRight: '120px',
            }}>
              <img
                src={orlandoLogo}
                alt="Orlando Prestige"
                style={{ height: '300px', width: '300px', objectFit: 'contain' }}
              />
            </div>

            {/* RIGHT COLUMN - form + tagline centered in bronze half */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 56px',
              overflowY: 'auto',
            }}>
              <div style={{ width: '100%', maxWidth: '340px' }}>

                {/* Heading */}
                <h1 style={{
                  fontFamily: 'Roboto',
                  fontSize: '35px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                }}>
                  DTR Admin Portal
                </h1>

                {/* Error */}
                {loginError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    color: '#fff',
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '2px', flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  <div>
                    <label htmlFor="email" style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: 'rgba(255,255,255,0.80)',
                      marginBottom: '6px',
                    }}>
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                      autoFocus
                      disabled={isLoggingIn}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" style={{
                      display: 'block',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: 'rgba(255,255,255,0.80)',
                      marginBottom: '6px',
                    }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        disabled={isLoggingIn}
                        style={{ ...inputStyle, paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9b7a5f',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
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
                    style={{
                      height: '46px',
                      width: '100%',
                      borderRadius: '10px',
                      background: '#2c1a0e',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      letterSpacing: '0.06em',
                      cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                      opacity: isLoggingIn ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '4px',
                    }}
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
                </form>

              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`@keyframes lspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
