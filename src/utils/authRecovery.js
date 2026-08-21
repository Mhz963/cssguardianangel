const PASSWORD_RECOVERY_KEY = 'ga-password-recovery'

export function markPasswordRecovery() {
  try {
    sessionStorage.setItem(PASSWORD_RECOVERY_KEY, '1')
  } catch {
    // Ignore storage failures.
  }
}

export function clearPasswordRecovery() {
  try {
    sessionStorage.removeItem(PASSWORD_RECOVERY_KEY)
  } catch {
    // Ignore storage failures.
  }
}

export function isPasswordRecoveryPending() {
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === '1'
  } catch {
    return false
  }
}

export function detectPasswordRecoveryFromUrl() {
  if (typeof window === 'undefined') return false

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  if (hashParams.get('type') === 'recovery') return true

  const searchParams = new URLSearchParams(window.location.search)
  if (searchParams.get('type') === 'recovery') return true

  const hasAuthPayload =
    searchParams.has('code') || hashParams.has('access_token') || hashParams.has('refresh_token')

  if (searchParams.get('mode') === 'reset' && hasAuthPayload) return true

  return false
}
