import { useRef, useEffect, useState } from 'react'
import orlandoLogo from '../assets/orlando_logo.jpg'

export default function Sidebar({ activeTab, setActiveTab, handleLogout }) {
  const navRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ transform: 'translateY(0px)', height: '0px' })
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    )},
    { id: 'employees', label: 'Employees', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )},
    { id: 'summary', label: 'Summary', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    )},
    { id: 'maintenance', label: 'Maintenance', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    )}
  ]

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return

      const activeButton = navRef.current.querySelector('.sidebar-nav-item.active')
      if (activeButton) {
        const navRect = navRef.current.getBoundingClientRect()
        const buttonRect = activeButton.getBoundingClientRect()
        const offsetY = buttonRect.top - navRect.top
        
        setIndicatorStyle({
          transform: `translateY(${offsetY}px)`,
          height: `${buttonRect.height}px`
        })
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeTab])

  useEffect(() => {
    // Update CSS variable for sidebar width
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? '80px' : '240px'
    )
  }, [isCollapsed])

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <img src={orlandoLogo} alt="Orlando Prestige Inc." className="sidebar-logo" />
          <span className="sidebar-brand-text">Orlando Prestige Inc.</span>
        </div>
        <button 
          className="sidebar-collapse-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="collapse-icon"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav" ref={navRef}>
        <div 
          className="sidebar-nav-indicator" 
          style={indicatorStyle}
          aria-hidden="true"
        />
        
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            {item.icon}
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title={isCollapsed ? 'Logout' : ''}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="logout-btn-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}
