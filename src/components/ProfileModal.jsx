import { resolveProofUrl } from '../services/api'

export default function ProfileModal({
  employee,
  editingCredentialsForm,
  setEditingCredentialsForm,
  profileAvatarPreview,
  handleAvatarChange,
  isSavingCredentials,
  handleSaveCredentials,
}) {
  if (!employee) return null

  return (
    <form onSubmit={handleSaveCredentials}>
      {/* Profile Avatar */}
      <div className="profile-avatar-container">
        <div className="profile-avatar-xl">
          {profileAvatarPreview ? (
            <img src={profileAvatarPreview} alt="Profile" />
          ) : employee.avatarUrl ? (
            <img src={resolveProofUrl(employee.avatarUrl)} alt="Profile" />
          ) : (
            <span>{employee.firstName.charAt(0)}{employee.lastName.charAt(0)}</span>
          )}
        </div>
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{ display: 'none' }}
        />
        <label htmlFor="avatar-upload" className="avatar-upload-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Upload Photo
        </label>
      </div>

      {/* Editable Profile Form */}
      <div className="profile-info-form">
        <div className="profile-form-row">
          <div className="profile-form-field">
            <label className="profile-field-label">First Name</label>
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
          </div>
          <div className="profile-form-field">
            <label className="profile-field-label">Last Name</label>
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
          </div>
        </div>
        <div className="profile-form-row">
          <div className="profile-form-field">
            <label className="profile-field-label">Email</label>
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
          </div>
          <div className="profile-form-field">
            <label className="profile-field-label">Phone Number</label>
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
          </div>
        </div>
        <div className="profile-form-row">
          <div className="profile-form-field">
            <label className="profile-field-label">Position</label>
            <input
              type="text"
              value={editingCredentialsForm.position}
              onChange={(e) =>
                setEditingCredentialsForm((prev) => ({
                  ...prev,
                  position: e.target.value,
                }))
              }
              placeholder="e.g., Sales Associate"
              required
            />
          </div>
          <div className="profile-form-field">
            <label className="profile-field-label">Address</label>
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
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <button
          type="button"
          className="deactivate-btn"
          onClick={() => {
            const password = window.prompt('To deactivate this account, please enter your admin password:')
            if (password) {
              window.alert('Account deactivation functionality will be implemented soon.')
            }
          }}
        >
          Deactivate Account
        </button>
        <button
          type="submit"
          className="primary-btn"
          disabled={isSavingCredentials}
        >
          {isSavingCredentials ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
