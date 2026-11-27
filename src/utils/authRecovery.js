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

function urlParams() {
  if (typeof window === 'undefined') return { hash: new URLSearchParams(), search: new URLSearchParams() }
  return {
    hash: new URLSearchParams(window.location.hash.replace(/^#/, '')),
    search: new URLSearchParams(window.location.search),
  }
}

export function detectPasswordRecoveryFromUrl() {
  if (typeof window === 'undefined') return false
  const { hash, search } = urlParams()

  if (hash.get('type') === 'recovery') return true
  if (search.get('type') === 'recovery') return true

  const hasAuthPayload =
    search.has('code') || search.has('token_hash') || hash.has('access_token') || hash.has('refresh_token')

  if (search.get('mode') === 'reset' && hasAuthPayload) return true

  return false
}

/**
 * The token from a reset email whose link points straight at this site
 * (`/signin?mode=reset&token_hash=…&type=recovery`). The page verifies it itself, so the link works on any
 * device and is not used up when an inbox's link scanner opens it first.
 */
export function readRecoveryTokenHash() {
  const { search } = urlParams()
  const tokenHash = search.get('token_hash')
  if (!tokenHash) return null
  const type = search.get('type') || 'recovery'
  return type === 'recovery' ? tokenHash : null
}

/** Supabase sends people back with `#error=…&error_code=otp_expired` when a link is expired or already used. */
export function readAuthLinkError() {
  const { hash, search } = urlParams()
  const code = hash.get('error_code') || search.get('error_code') || hash.get('error') || search.get('error')
  if (!code) return ''
  return friendlyAuthError({ code, message: hash.get('error_description') || search.get('error_description') || '' })
}

/** Plain-language messages for the errors people actually meet while resetting a password. */
export function friendlyAuthError(error) {
  const code = String(error?.code || '').toLowerCase()
  const message = String(error?.message || error || '').toLowerCase()
  const status = Number(error?.status || 0)

  if (code === 'otp_expired' || message.includes('expired') || (message.includes('invalid') && message.includes('token'))) {
    return 'This reset link or code has expired or was already used. Please request a new reset email.'
  }
  if (code === 'over_email_send_rate_limit' || status === 429 || message.includes('rate limit')) {
    return 'Too many reset emails were requested just now. Please wait a minute and try again.'
  }
  if (message.includes('not authorized') || code === 'email_address_not_authorized') {
    return 'We could not send an email to this address right now. Please try again later or contact us.'
  }
  if (code === 'same_password' || message.includes('different from the old password')) {
    return 'Your new password must be different from your old one.'
  }
  if (code === 'weak_password' || message.includes('password should')) {
    return error?.message || 'Please choose a stronger password.'
  }
  if (message.includes('auth session missing') || code === 'session_not_found') {
    return 'Your reset session has ended. Request a new email, or enter the code from your email below.'
  }
  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Could not reach the server. Check your internet connection and try again.'
  }
  return error?.message || 'Unable to continue. Please try again.'
}

/** Remove reset tokens from the address bar so a refresh or a shared URL never reuses them. */
export function cleanRecoveryUrl() {
  if (typeof window === 'undefined') return
  window.history.replaceState(window.history.state, '', `${window.location.pathname}?mode=reset`)
}
