// API service functions
import { AUTH_API_BASE_URL } from '../utils/constants'
import { getCookie } from '../utils/cookies'

export const resolveProofUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/api/v1')) {
    const baseUrl = AUTH_API_BASE_URL.replace('/api/v1', '')
    return `${baseUrl}${value}`
  }
  return `${AUTH_API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

export const fetchEmployees = async (token) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/employees`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Failed to fetch employees: ${response.status}`)
  return response.json()
}

export const fetchAttendanceLogs = async (token) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/attendance`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Failed to fetch attendance logs: ${response.status}`)
  return response.json()
}

export const loginAdmin = async (email, password) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    let message = 'Invalid email or password.'
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json()
        if (errorBody?.message) message = errorBody.message
      } else {
        const textBody = await response.text()
        if (textBody) message = textBody
      }
    } catch {}
    throw new Error(message)
  }

  return response.json()
}

export const registerEmployee = async (token, employeeData) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(employeeData),
  })

  if (!response.ok) {
    let message = 'Unable to register employee.'
    try {
      const errorBody = await response.json()
      if (errorBody?.message) message = errorBody.message
    } catch {}
    throw new Error(message)
  }

  return response.json()
}

export const updateEmployee = async (token, employeeId, employeeData) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/employees/${employeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(employeeData),
  })

  if (!response.ok) {
    let message = 'Unable to update employee credentials.'
    try {
      const errorBody = await response.json()
      if (errorBody?.message) message = errorBody.message
    } catch {}
    throw new Error(message)
  }

  return response.json()
}

export const uploadAvatar = async (token, employeeId, file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/employees/${employeeId}/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!response.ok) throw new Error('Failed to upload avatar image.')
  return response.json()
}

export const fetchProofImage = async (token, proofUrl) => {
  const response = await fetch(proofUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to fetch proof image.')
  return response.blob()
}

export const fetchAuthenticatedImage = async (imageUrl, token) => {
  const response = await fetch(imageUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Failed to fetch image.')
  return response.blob()
}

export const fetchRoles = async (token) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Failed to fetch roles: ${response.status}`)
  return response.json()
}

export const verifyPassword = async (token, password) => {
  const response = await fetch(`${AUTH_API_BASE_URL}/auth/verify-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    let message = 'Incorrect password. Please try again.'
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json()
        if (errorBody?.message) message = errorBody.message
      } else {
        const textBody = await response.text()
        if (textBody) message = textBody
      }
    } catch {}
    throw new Error(message)
  }

  return response.json()
}
