export const SUPER_ADMIN_EMAIL = 'muhammadhasan963@gmail.com'

export function isSuperAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

export function isSuperAdminUser(authUser) {
  return isSuperAdminEmail(authUser?.email)
}
