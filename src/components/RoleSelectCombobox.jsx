import { useState, useRef, useEffect } from 'react'
import { AUTH_API_BASE_URL } from '../utils/constants'
import { getCookie } from '../utils/cookies'

export default function RoleSelectCombobox({ 
  value, 
  onChange, 
  onBlur,
  hasError,
  placeholder = 'Select a position...' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableRoles, setAvailableRoles] = useState([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [roleFetchError, setRoleFetchError] = useState(null)
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch roles from Admin System API
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true)
      setRoleFetchError(null)
      
      try {
        const token = getCookie('authToken')
        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await fetch(`${AUTH_API_BASE_URL}/admin/roles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.status}`)
        }

        const data = await response.json()
        
        // Map the roles data to combobox options format
        // Assuming API returns array of role objects with 'id' and 'name' properties
        const roleOptions = Array.isArray(data) 
          ? data.map(role => ({
              value: role.id || role.name,
              label: role.name || role.roleName || role.title
            }))
          : []

        setAvailableRoles(roleOptions)
      } catch (error) {
        console.error('Error fetching roles:', error)
        setRoleFetchError(error.message)
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  // Filter options based on search query
  const filteredOptions = availableRoles.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
        if (onBlur) onBlur()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onBlur])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault()
      handleSelect(filteredOptions[0].value, filteredOptions[0].label)
    }
  }

  const handleSelect = (optionValue, optionLabel) => {
    onChange(optionLabel) // Store the role name for form submission
    setIsOpen(false)
    setSearchQuery('')
    if (onBlur) onBlur()
  }

  const selectedOption = availableRoles.find(opt => opt.label === value)
  const displayText = selectedOption ? selectedOption.label : ''

  return (
    <div className="role-select-combobox" ref={comboboxRef}>
      <div className={`combobox-input-wrapper ${hasError ? 'input-error' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className="combobox-input"
          placeholder={isLoadingRoles ? 'Loading roles...' : placeholder}
          value={isOpen ? searchQuery : displayText}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (!isLoadingRoles && !roleFetchError) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoadingRoles || !!roleFetchError}
          aria-label="Position"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        {isLoadingRoles && (
          <div className="combobox-spinner">
            <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2 A10 10 0 0 1 22 12" opacity="0.75" />
            </svg>
          </div>
        )}
        {!isLoadingRoles && !roleFetchError && (
          <button
            type="button"
            className="combobox-toggle"
            onClick={() => {
              setIsOpen(!isOpen)
              if (!isOpen) {
                inputRef.current?.focus()
              }
            }}
            aria-label="Toggle dropdown"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`combobox-chevron ${isOpen ? 'open' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>
      
      {roleFetchError && (
        <div className="combobox-error-message">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Failed to load positions. Please refresh.
        </div>
      )}

      {isOpen && !isLoadingRoles && !roleFetchError && (
        <div className="combobox-dropdown role-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`combobox-option ${value === option.label ? 'active' : ''}`}
                onClick={() => handleSelect(option.value, option.label)}
              >
                {option.label}
                {value === option.label && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))
          ) : (
            <div className="combobox-empty">
              {searchQuery ? 'No matching positions found' : 'No positions available'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
