import { useFormValidation, validators } from '../hooks/useFormValidation'
import { useEffect, useState } from 'react'
import RoleCombobox from './RoleCombobox'
import ConfirmDiscardModal from './ConfirmDiscardModal'

const validationRules = {
  firstName: [validators.required('First name')],
  lastName: [validators.required('Last name')],
  email: [validators.required('Email'), validators.email],
  contactNumber: [validators.required('Phone number'), validators.phone],
  position: [validators.required('Position')],
  streetAddress: [validators.required('Street address')],
  city: [validators.required('City')],
  province: [validators.required('Province')]
}

export default function RegisterEmployeeModal({
  registerForm,
  setRegisterForm,
  isRegistering,
  handleRegisterEmployee,
  onCancel,
  onFormChangeDetected,
}) {
  const [hasFormChanges, setHasFormChanges] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues
  } = useFormValidation({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    position: '',
    streetAddress: '',
    city: '',
    province: ''
  }, validationRules)

  // Track if any form field has been modified
  useEffect(() => {
    const hasChanges = 
      values.firstName.trim() !== '' ||
      values.lastName.trim() !== '' ||
      values.email.trim() !== '' ||
      values.contactNumber.trim() !== '' ||
      values.position.trim() !== '' ||
      values.streetAddress.trim() !== '' ||
      values.city.trim() !== '' ||
      values.province.trim() !== ''
    
    setHasFormChanges(hasChanges)
    
    // Notify parent component about form changes
    if (onFormChangeDetected) {
      onFormChangeDetected(hasChanges)
    }
  }, [values, onFormChangeDetected])

  useEffect(() => {
    if (registerForm.firstName || registerForm.lastName || registerForm.email) {
      const addressParts = registerForm.address ? registerForm.address.split(',').map(s => s.trim()) : ['', '']
      setValues({
        firstName: registerForm.firstName || '',
        lastName: registerForm.lastName || '',
        email: registerForm.email || '',
        contactNumber: registerForm.contactNumber || '',
        position: registerForm.position || '',
        streetAddress: addressParts[0] || '',
        city: addressParts[1] || '',
        province: addressParts[2] || ''
      })
    }
  }, [registerForm, setValues])

  const onSubmit = (e) => {
    e.preventDefault()
    
    if (!validateAll()) {
      return
    }

    const combinedAddress = [values.streetAddress, values.city, values.province]
      .filter(Boolean)
      .join(', ')

    const formData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      contactNumber: values.contactNumber,
      position: values.position,
      address: combinedAddress
    }

    setRegisterForm(formData)
    handleRegisterEmployee(e, formData)
  }

  const handleCancel = () => {
    if (hasFormChanges) {
      setShowConfirmClose(true)
    } else {
      if (onCancel) {
        onCancel()
      }
    }
  }

  const handleKeepEditing = () => {
    setShowConfirmClose(false)
  }

  const handleDiscardChanges = () => {
    setShowConfirmClose(false)
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        <div className="modal-form-grid">
        <label>
          <span className="field-label-required">First Name *</span>
          <input
            type="text"
            value={values.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            onBlur={() => handleBlur('firstName')}
            placeholder="First name"
            className={touched.firstName && errors.firstName ? 'input-error' : ''}
          />
          {touched.firstName && errors.firstName && (
            <span className="field-error">{errors.firstName}</span>
          )}
        </label>
        <label>
          <span className="field-label-required">Last Name *</span>
          <input
            type="text"
            value={values.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            onBlur={() => handleBlur('lastName')}
            placeholder="Last name"
            className={touched.lastName && errors.lastName ? 'input-error' : ''}
          />
          {touched.lastName && errors.lastName && (
            <span className="field-error">{errors.lastName}</span>
          )}
        </label>
        <label className="full-width">
          <span className="field-label-required">Email *</span>
          <input
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="employee@orlando.com"
            className={touched.email && errors.email ? 'input-error' : ''}
          />
          {touched.email && errors.email && (
            <span className="field-error">{errors.email}</span>
          )}
          {touched.email && !errors.email && values.email && (
            <span className="field-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Valid email
            </span>
          )}
        </label>
        <label>
          <span className="field-label-required">Phone Number *</span>
          <input
            type="text"
            value={values.contactNumber}
            onChange={(e) => handleChange('contactNumber', e.target.value)}
            onBlur={() => handleBlur('contactNumber')}
            placeholder="+63 917 123 4567"
            className={touched.contactNumber && errors.contactNumber ? 'input-error' : ''}
          />
          {touched.contactNumber && errors.contactNumber && (
            <span className="field-error">{errors.contactNumber}</span>
          )}
          {touched.contactNumber && !errors.contactNumber && values.contactNumber && (
            <span className="field-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Valid phone
            </span>
          )}
        </label>
        <label>
          <span className="field-label-required">Position *</span>
          <RoleCombobox
            value={values.position}
            onChange={(selectedRole) => handleChange('position', selectedRole)}
            onBlur={() => handleBlur('position')}
            hasError={touched.position && !!errors.position}
            placeholder="Select a position..."
            includeAllOption={false}
            className="modal-role-combobox"
            showInlineError={false}
          />
          {touched.position && errors.position && (
            <span className="field-error">{errors.position}</span>
          )}
        </label>
        <label className="full-width">
          <span className="field-label-required">Street Address *</span>
          <input
            type="text"
            value={values.streetAddress}
            onChange={(e) => handleChange('streetAddress', e.target.value)}
            onBlur={() => handleBlur('streetAddress')}
            placeholder="123 Main Street"
            className={touched.streetAddress && errors.streetAddress ? 'input-error' : ''}
          />
          {touched.streetAddress && errors.streetAddress && (
            <span className="field-error">{errors.streetAddress}</span>
          )}
        </label>
        <label>
          <span className="field-label-required">City *</span>
          <input
            type="text"
            value={values.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            placeholder="Manila"
            className={touched.city && errors.city ? 'input-error' : ''}
          />
          {touched.city && errors.city && (
            <span className="field-error">{errors.city}</span>
          )}
        </label>
        <label>
          <span className="field-label-required">Province *</span>
          <input
            type="text"
            value={values.province}
            onChange={(e) => handleChange('province', e.target.value)}
            onBlur={() => handleBlur('province')}
            placeholder="Metro Manila"
            className={touched.province && errors.province ? 'input-error' : ''}
          />
          {touched.province && errors.province && (
            <span className="field-error">{errors.province}</span>
          )}
        </label>
      </div>
      <div className="modal-actions">
        <button
          type="button"
          className="secondary-btn"
          onClick={handleCancel}
          disabled={isRegistering}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="primary-btn"
          disabled={isRegistering}
        >
          {isRegistering ? 'Registering...' : 'Register Employee'}
        </button>
      </div>
    </form>

    <ConfirmDiscardModal
      isOpen={showConfirmClose}
      onKeepEditing={handleKeepEditing}
      onDiscard={handleDiscardChanges}
    />
  </>
  )
}
