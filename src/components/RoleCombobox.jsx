import { useState, useRef, useEffect } from 'react'
import { AUTH_API_BASE_URL } from '../utils/constants'
import { getCookie } from '../utils/cookies'

// Shared cache for roles to avoid redundant API calls
let rolesCache = null
let rolesCachePromise = null

const fetchRolesWithCache = async () => {
  // Return cached data if available
  if (rolesCache) {
    return rolesCache
  }

  // Return existing promise if fetch is in progress
  if (rolesCachePromise) {
    return rolesCachePromise
  }

  // Create new fetch promise
  rolesCachePromise = (async () => {
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
      const roleOptions = Array.isArray(data) 
        ? data.map(role => ({
            value: role.id || role.name,
            label: role.name || role.roleName || role.title
          }))
        : []

      rolesCache = roleOptions
      return roleOptions
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    } finally {
      rolesCachePromise = null
    }
  })()

  return rolesCachePromise
}

export default function RoleCombobox({ 
  value, 
  onChange, 
  onBlur,
  hasError,
  placeholder = 'Select a position...',
  includeAllOption = false,
  allOptionLabel = 'All Positions',
  disabled = false,
  className = '',
  showInlineError = true
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableRoles, setAvailableRoles] = useState([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [roleFetchError, setRoleFetchError] = useState(null)
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch roles from Admin System API with caching
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoadingRoles(true)
      setRoleFetchError(null)
      
      try {
        const roleOptions = await fetchRolesWithCache()
        
        // Add "All" option if needed (for filter mode)
        const finalOptions = includeAllOption
          ? [{ value: 'all', label: allOptionLabel }, ...roleOptions]
          : roleOptions

        setAvailableRoles(finalOptions)
      } catch (error) {
        setRoleFetchError(error.message)
      } finally {
        setIsLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [includeAllOption, allOptionLabel])

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
    // For filter mode with "all" option, pass the value for "all" but label for specific roles
    // This ensures the filter works correctly with employee.position (which is a name string)
    if (includeAllOption) {
      onChange(optionValue === 'all' ? 'all' : optionLabel)
    } else {
      // For form mode, pass the label
      onChange(optionLabel)
    }
    setIsOpen(false)
    setSearchQuery('')
    if (onBlur) onBlur()
  }

  const selectedOption = includeAllOption
    ? (value === 'all' 
        ? availableRoles.find(opt => opt.value === 'all')
        : availableRoles.find(opt => opt.label === value))
    : availableRoles.find(opt => opt.label === value)
  
  const displayText = selectedOption ? selectedOption.label : ''

  return (
    <div className={`role-combobox ${className}`} ref={comboboxRef}>
      <div className={`combobox-input-wrapper ${hasError ? 'input-error' : ''} ${roleFetchError ? 'has-fetch-error' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className="combobox-input"
          placeholder={isLoadingRoles ? 'Loading roles...' : placeholder}
          value={isOpen ? searchQuery : displayText}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (!isLoadingRoles && !roleFetchError && !disabled) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoadingRoles || !!roleFetchError || disabled}
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
              if (!disabled) {
                setIsOpen(!isOpen)
                if (!isOpen) {
                  inputRef.current?.focus()
                }
              }
            }}
            disabled={disabled}
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
      
      {roleFetchError && showInlineError && (
        <div className="combobox-error-message-inline">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Failed to load positions
        </div>
      )}

      {isOpen && !isLoadingRoles && !roleFetchError && (
        <div className="combobox-dropdown role-combobox-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = includeAllOption 
                ? (value === 'all' && option.value === 'all') || (value === option.label)
                : value === option.label
              
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`combobox-option ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelect(option.value, option.label)}
                >
                  {option.label}
                  {isSelected && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })
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

// Export function to clear cache (useful for testing or when roles are updated)
export const clearRolesCache = () => {
  rolesCache = null
  rolesCachePromise = null
}
