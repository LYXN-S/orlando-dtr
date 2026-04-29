import { useState, useCallback } from 'react'

export function useFormValidation(initialValues, validationRules) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const validateField = useCallback((name, value) => {
    const rules = validationRules[name]
    if (!rules) return ''

    for (const rule of rules) {
      const error = rule(value)
      if (error) return error
    }
    return ''
  }, [validationRules])

  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }, [touched, validateField])

  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [values, validateField])

  const validateAll = useCallback(() => {
    const newErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}))
    return isValid
  }, [values, validationRules, validateField])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    resetForm,
    setValues
  }
}

// Common validation rules
export const validators = {
  required: (fieldName) => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`
    }
    return ''
  },

  email: (value) => {
    if (!value) return ''
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return ''
  },

  phone: (value) => {
    if (!value) return ''
    const phoneRegex = /^[\d\s\-+()]{10,}$/
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number (at least 10 digits)'
    }
    return ''
  },

  minLength: (min) => (value) => {
    if (!value) return ''
    if (value.length < min) {
      return `Must be at least ${min} characters`
    }
    return ''
  },

  maxLength: (max) => (value) => {
    if (!value) return ''
    if (value.length > max) {
      return `Must be no more than ${max} characters`
    }
    return ''
  }
}
