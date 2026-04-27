export default function RegisterEmployeeModal({
  registerForm,
  setRegisterForm,
  isRegistering,
  handleRegisterEmployee,
}) {
  return (
    <form onSubmit={handleRegisterEmployee}>
      <div className="modal-form-grid">
        <label>
          First Name
          <input
            type="text"
            value={registerForm.firstName}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))
            }
            placeholder="First name"
            required
          />
        </label>
        <label>
          Last Name
          <input
            type="text"
            value={registerForm.lastName}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))
            }
            placeholder="Last name"
            required
          />
        </label>
        <label className="full-width">
          Email
          <input
            type="email"
            value={registerForm.email}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="employee@orlando.com"
            required
          />
        </label>
        <label>
          Phone Number
          <input
            type="text"
            value={registerForm.contactNumber}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, contactNumber: e.target.value }))
            }
            placeholder="+63 917 123 4567"
            required
          />
        </label>
        <label>
          Position
          <input
            type="text"
            value={registerForm.position}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, position: e.target.value }))
            }
            placeholder="e.g., Sales Associate"
            required
          />
        </label>
        <label className="full-width">
          Address
          <input
            type="text"
            value={registerForm.address}
            onChange={(e) =>
              setRegisterForm((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="City, Province"
            required
          />
        </label>
      </div>
      <div className="modal-actions">
        <button
          type="submit"
          className="primary-btn full-width"
          disabled={isRegistering}
        >
          {isRegistering ? 'Registering...' : 'Register Employee'}
        </button>
      </div>
    </form>
  )
}
