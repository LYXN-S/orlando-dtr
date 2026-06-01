// Application constants

// VITE_API_BASE_URL should include the full base path (e.g. https://api.example.com/api/v1)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
export const AUTH_API_BASE_URL = API_BASE_URL

// Bare origin without the /api/v1 path — used for static file URLs (avatars, images, etc.)
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+$/, '')
