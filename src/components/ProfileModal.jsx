import { useState, useEffect } from 'react'
import { resolveProofUrl, fetchAuthenticatedImage } from '../services/api'
import { getCookie } from '../utils/cookies'
import RoleCombobox from './RoleCombobox'
import Toast from './Toast'

export default function ProfileModal({
  employee,
  editingCredentialsForm,
  setEditingCredentialsForm,
  profileAvatarPreview,
  handleAvatarChange,
  isSavingCredentials,
  handleSaveCredentials,
}) {
  const [avatarBlobUrl, setAvatarBlobUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [originalFormData, setOriginalFormData] = useState(null)

  useEffect(() => {
    if (employee?.avatarUrl && !profileAvatarPreview) {
      const token = getCookie('dtr_admin_token')
      if (token) {
        const fullUrl = resolveProofUrl(employee.avatarUrl)
        fetchAuthenticatedImage(fullUrl, token)
          .then(blob => {
            const url = URL.createObjectURL(blob)
            setAvatarBlobUrl(url)
          })
          .catch(err => {
          })
      }
    }

    return () => {
      if (avatarBlobUrl) {
        URL.revokeObjectURL(avatarBlobUrl)
      }
    }
  }, [employee?.avatarUrl, profileAvatarPreview])

  if (!employee) return null

  const handleEditClick = () => {
    // Save original data before entering edit mode
    setOriginalFormData({ ...editingCredentialsForm })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    // Restore original data
    if (originalFormData) {
      setEditingCredentialsForm(originalFormData)
    }
    setIsEditing(false)
    setOriginalFormData(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    await handleSaveCredentials(e)
    // After successful save, exit edit mode and show success toast
    setIsEditing(false)
    setOriginalFormData(null)
    setShowSuccessToast(true)
  }

  const handleDeactivateClick = () => {
    setShowDeactivateConfirm(true)
  }

  const handleConfirmDeactivate = () => {
    // TODO: Implement actual deactivation API call
    window.alert('Account deactivation functionality will be implemented soon.')
    setShowDeactivateConfirm(false)
  }

  const handleCancelDeactivate = () => {
    setShowDeactivateConfirm(false)
  }

  return (
    <>
      <form onSubmit={onSubmit}>
        {/* Profile Avatar */}
        <div className="profile-avatar-container">
          <div className="profile-avatar-xl">
            {profileAvatarPreview ? (
              <img src={profileAvatarPreview} alt="Profile" />
            ) : avatarBlobUrl ? (
              <img src={avatarBlobUrl} alt="Profile" />
            ) : (
              <span>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
            )}
          </div>
          <input
            type="file"
            id="avatar-upload"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
            disabled={!isEditing}
          />
          {isEditing && (
            <label htmlFor="avatar-upload" className="avatar-upload-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Upload Photo
            </label>
          )}
        </div>

        {/* Profile Form - Read-Only or Edit Mode */}
        <div className="profile-info-form">
          <div className="profile-form-row">
            <div className="profile-form-field">
              <label className="profile-field-label">First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editingCredentialsForm.firstName}
                  onChange={(e) =>
                    setEditingCredentialsForm((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="First name"
                  required
                />
              ) : (
                <div className="profile-field-value">{editingCredentialsForm.firstName}</div>
              )}
            </div>
            <div className="profile-form-field">
              <label className="profile-field-label">Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editingCredentialsForm.lastName}
                  onChange={(e) =>
                    setEditingCredentialsForm((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  placeholder="Last name"
                  required
                />
              ) : (
                <div className="profile-field-value">{editingCredentialsForm.lastName}</div>
              )}
            </div>
          </div>
          <div className="profile-form-row">
            <div className="profile-form-field">
              <label className="profile-field-label">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editingCredentialsForm.email}
                  onChange={(e) =>
                    setEditingCredentialsForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="employee@orlando.com"
                  required
                />
              ) : (
                <div className="profile-field-value">{editingCredentialsForm.email}</div>
              )}
            </div>
            <div className="profile-form-field">
              <label className="profile-field-label">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editingCredentialsForm.contactNumber}
                  onChange={(e) =>
                    setEditingCredentialsForm((prev) => ({
                      ...prev,
                      contactNumber: e.target.value,
                    }))
                  }
                  placeholder="+63 917 123 4567"
                  required
                />
              ) : (
                <div className="profile-field-value">{editingCredentialsForm.contactNumber}</div>
              )}
            </div>
          </div>
          <div className="profile-form-row">
            <div className="profile-form-field">
              <label className="profile-field-label">Position</label>
              {isEditing ? (
                <RoleCombobox
                  value={editingCredentialsForm.position}
                  onChange={(selectedRole) =>
                    setEditingCredentialsForm((prev) => ({
                      ...prev,
                      position: selectedRole,
                    }))
                  }
                  placeholder="Select a position..."
                  includeAllOption={false}
                />
              ) : (
                <div className="profile-field-value">{editingCredentialsForm.position}</div>
              )}
            </div>
            <div className="profile-form-field">
              <label className="profile-field-label">Address</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editingCredentialsForm.address}
                  onChange={(e) =>
                    setEditingCredentialsForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="City, Province"
                  required
                />
              ) : (
                <div className="profile-field-value">{editingCredentialsForm.address}</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button
            type="button"
            className="deactivate-btn"
            onClick={handleDeactivateClick}
          >
            Deactivate Account
          </button>
          {isEditing ? (
            <div className="profile-actions-group">
              <button
                type="button"
                className="secondary-btn"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={isSavingCredentials}
              >
                {isSavingCredentials ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="primary-btn"
              onClick={handleEditClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </form>

      {/* Deactivate Confirmation Dialog */}
      {showDeactivateConfirm && (
        <div className="confirm-discard-overlay" onClick={handleCancelDeactivate}>
          <div className="confirm-discard-content" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-discard-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3>Deactivate Account?</h3>
            <p>
              Are you sure you want to deactivate this account? This action cannot be undone and the employee will lose access to the system.
            </p>
            <div className="confirm-discard-actions">
              <button
                type="button"
                className="discard-btn"
                onClick={handleConfirmDeactivate}
              >
                Confirm Deactivate
              </button>
              <button
                type="button"
                className="keep-editing-btn"
                onClick={handleCancelDeactivate}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      <Toast
        message="Profile updated successfully"
        type="success"
        isVisible={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        duration={3000}
      />
    </>
  )
}
