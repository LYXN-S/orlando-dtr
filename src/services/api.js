// API service functions
import { AUTH_API_BASE_URL } from '../utils/constants'
import { getCookie } from '../utils/cookies'

export const resolveProofUrl = (value) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  
  // If the value already starts with /api/v1, use the base domain only
  if (value.startsWith('/api/v1')) {
    const baseUrl = AUTH_API_BASE_URL.replace('/api/v1', '')
    return `${baseUrl}${value}`
  }
  
  return `${AUTH_API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

export const fetchEmployees = async (token) => {
  console.log('Fetching from:', `${AUTH_API_BASE_URL}/admin/dtr/employees`)
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/employees`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Fetch employees error:', response.status, errorText)
    throw new Error(`Failed to fetch employees: ${response.status}`)
  }

  return response.json()
}

export const fetchAttendanceLogs = async (token) => {
  console.log('Fetching from:', `${AUTH_API_BASE_URL}/admin/dtr/attendance`)
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/dtr/attendance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Fetch logs error:', response.status, errorText)
    throw new Error(`Failed to fetch attendance logs: ${response.status}`)
  }

  return response.json()
}

export const loginAdmin = async (email, password) => {
  console.log('Login URL:', `${AUTH_API_BASE_URL}/auth/login`)
  console.log('Login payload:', { email, password: '***' })
  
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    console.log('Login response status:', response.status)
    console.log('Login response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      let message = 'Invalid email or password.'
      let errorBody = null
      
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          errorBody = await response.json()
          console.log('Login error body:', errorBody)
          if (errorBody?.message) {
            message = errorBody.message
          }
        } else {
          const textBody = await response.text()
          console.log('Login error text:', textBody)
          if (textBody) {
            message = textBody
          }
        }
      } catch (parseError) {
        console.error('Error parsing login error response:', parseError)
      }
      
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    console.error('Login request failed:', error)
    throw error
  }
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
      if (errorBody?.message) {
        message = errorBody.message
      }
    } catch {
      // Ignore
    }
    throw new Error(message)
  }

  return response.json()
}

export const updateEmployee = async (token, employeeId, employeeData) => {
  const response = await fetch(
    `${AUTH_API_BASE_URL}/admin/dtr/employees/${employeeId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(employeeData),
    },
  )

  if (!response.ok) {
    let message = 'Unable to update employee credentials.'
    try {
      const errorBody = await response.json()
      if (errorBody?.message) {
        message = errorBody.message
      }
    } catch {
      // Ignore
    }
    throw new Error(message)
  }

  return response.json()
}

export const uploadAvatar = async (token, employeeId, file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(
    `${AUTH_API_BASE_URL}/admin/dtr/employees/${employeeId}/avatar`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    throw new Error('Failed to upload avatar image.')
  }

  return response.json()
}

export const fetchProofImage = async (token, proofUrl) => {
  const response = await fetch(proofUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch proof image.')
  }

  return response.blob()
}

export const fetchAuthenticatedImage = async (imageUrl, token) => {
  const response = await fetch(imageUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch image.')
  }

  return response.blob()
}

export const fetchRoles = async (token) => {
  console.log('Fetching from:', `${AUTH_API_BASE_URL}/admin/roles`)
  const response = await fetch(`${AUTH_API_BASE_URL}/admin/roles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Fetch roles error:', response.status, errorText)
    throw new Error(`Failed to fetch roles: ${response.status}`)
  }

  return response.json()
}

export const verifyPassword = async (token, password) => {
  console.log('Verifying password at:', `${AUTH_API_BASE_URL}/auth/verify-password`)
  
  try {
    const response = await fetch(`${AUTH_API_BASE_URL}/auth/verify-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    })

    console.log('Verify password response status:', response.status)

    if (!response.ok) {
      let message = 'Incorrect password. Please try again.'
      
      try {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorBody = await response.json()
          console.log('Verify password error body:', errorBody)
          if (errorBody?.message) {
            message = errorBody.message
          }
        } else {
          const textBody = await response.text()
          console.log('Verify password error text:', textBody)
          if (textBody) {
            message = textBody
          }
        }
      } catch (parseError) {
        console.error('Error parsing verify password error response:', parseError)
      }
      
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    console.error('Verify password request failed:', error)
    throw error
  }
}
