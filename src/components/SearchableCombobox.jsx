import { useState, useRef, useEffect } from 'react'

export default function SearchableCombobox({ 
  label, 
  options, 
  value, 
  onChange, 
  placeholder = 'Select...' 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const comboboxRef = useRef(null)
  const inputRef = useRef(null)

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      onChange(filteredOptions[0].value)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleSelect = (optionValue) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const selectedOption = options.find(opt => opt.value === value)
  const displayText = selectedOption ? selectedOption.label : placeholder

  return (
    <div className="searchable-combobox" ref={comboboxRef}>
      <div className="combobox-label">{label}</div>
      <div className="combobox-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="combobox-input"
          placeholder={displayText}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label={label}
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
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
      </div>
      
      {isOpen && (
        <div className="combobox-dropdown">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`combobox-option ${value === option.value ? 'active' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
                {value === option.value && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))
          ) : (
            <div className="combobox-empty">No matches found</div>
          )}
        </div>
      )}
    </div>
  )
}
