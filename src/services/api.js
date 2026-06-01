import { AUTH_API_BASE_URL } from '../utils/constants'

let refreshPromise = null

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${AUTH_API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null
    })
  }
  const response = await refreshPromise
  if (!response.ok) {
    throw new Error('Session expired')
  }
}

/**
 * Authenticated fetch — sends HttpOnly cookies set by the backend on login.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${AUTH_API_BASE_URL}${path}`
  const isFormData = options.body instanceof FormData

  const buildConfig = () => ({
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let config = buildConfig()
  if (config.body && typeof config.body === 'object' && !isFormData) {
    config = { ...config, body: JSON.stringify(config.body) }
  }

  let response = await fetch(url, config)

  if (
    response.status === 401 &&
    !path.includes('/auth/login') &&
    !path.includes('/auth/refresh')
  ) {
    try {
      await refreshSession()
      config = buildConfig()
      if (config.body && typeof config.body === 'object' && !isFormData) {
        config = { ...config, body: JSON.stringify(config.body) }
      }
      response = await fetch(url, config)
    } catch {
      throw new Error('Session expired. Please sign in again.')
    }
  }

  return response
}

async function parseJsonResponse(response, fallbackMessage) {
  if (!response.ok) {
    let message = fallbackMessage
    try {
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json()
        if (errorBody?.message) message = errorBody.message
      } else {
        const textBody = await response.text()
        if (textBody) message = textBody
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

export const resolveProofUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/api/v1')) {
    const baseUrl = AUTH_API_BASE_URL.replace('/api/v1', '')
    return `${baseUrl}${value}`
  }
  return `${AUTH_API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

export const fetchCurrentUser = async () => {
  const response = await apiFetch('/auth/me')
  return parseJsonResponse(response, 'Unable to load profile.')
}

export const loginAdmin = async (email, password) => {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  return parseJsonResponse(response, 'Invalid email or password.')
}

export const logoutAdmin = async () => {
  const response = await apiFetch('/auth/logout', { method: 'POST' })
  if (!response.ok && response.status !== 204) {
    await parseJsonResponse(response, 'Logout failed.')
  }
}

export const fetchEmployees = async () => {
  const response = await apiFetch('/admin/dtr/employees')
  return parseJsonResponse(response, `Failed to fetch employees: ${response.status}`)
}

export const fetchAttendanceLogs = async () => {
  const response = await apiFetch('/admin/dtr/attendance')
  return parseJsonResponse(response, `Failed to fetch attendance logs: ${response.status}`)
}

export const registerEmployee = async (employeeData) => {
  const response = await apiFetch('/admin/dtr/employees', {
    method: 'POST',
    body: employeeData,
  })
  return parseJsonResponse(response, 'Unable to register employee.')
}

export const updateEmployee = async (employeeId, employeeData) => {
  const response = await apiFetch(`/admin/dtr/employees/${employeeId}`, {
    method: 'PUT',
    body: employeeData,
  })
  return parseJsonResponse(response, 'Unable to update employee credentials.')
}

export const uploadAvatar = async (employeeId, file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await apiFetch(`/admin/dtr/employees/${employeeId}/avatar`, {
    method: 'POST',
    body: formData,
  })
  return parseJsonResponse(response, 'Failed to upload avatar image.')
}

export const fetchProofImage = async (proofUrl) => {
  const response = await apiFetch(proofUrl.startsWith('http') ? proofUrl : resolveProofUrl(proofUrl))
  if (!response.ok) throw new Error('Failed to fetch proof image.')
  return response.blob()
}

export const fetchAuthenticatedImage = async (imageUrl) => {
  const response = await apiFetch(imageUrl.startsWith('http') ? imageUrl : resolveProofUrl(imageUrl))
  if (!response.ok) throw new Error('Failed to fetch image.')
  return response.blob()
}

export const fetchRoles = async () => {
  const response = await apiFetch('/roles')
  return parseJsonResponse(response, `Failed to fetch roles: ${response.status}`)
}

export const verifyPassword = async (password) => {
  const response = await apiFetch('/auth/verify-password', {
    method: 'POST',
    body: { password },
  })
  return parseJsonResponse(response, 'Incorrect password. Please try again.')
}

export const deleteEmployeeAttendance = async (employeeId) => {
  const response = await apiFetch(`/admin/dtr/attendance/employee/${employeeId}`, {
    method: 'DELETE',
  })
  return parseJsonResponse(response, `Failed to delete records: ${response.status}`)
}

export const exportAttendancePdf = async (startDate, endDate, search) => {
  let url = `/admin/dtr/attendance/export-pdf?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  if (search?.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`
  }
  const response = await apiFetch(url)
  if (!response.ok) throw new Error('Failed to generate PDF')
  return response.blob()
}
