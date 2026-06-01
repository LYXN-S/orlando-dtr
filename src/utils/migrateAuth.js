/**
 * Clears legacy client-side JWT cookies. Auth uses HttpOnly cookies from the backend.
 */
export function migrateLegacyAuth() {
  const legacyCookieNames = ['dtr_admin_token', 'dtr_admin_role']
  legacyCookieNames.forEach((name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  })

  const legacyStorageKeys = ['authToken', 'token', 'dtr_admin_token']
  legacyStorageKeys.forEach((key) => localStorage.removeItem(key))
}
