import { supabase } from './supabaseClient.js'

export const SUPER_ADMIN_EMAIL = String(
  import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'muhammadhasan963@gmail.com',
)
  .trim()
  .toLowerCase()

export function isSuperAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL
}

async function getAccessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

export async function fetchAdminDashboard() {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Please sign in as super admin.')
  }

  const response = await fetch('/api/admin-dashboard', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to load admin dashboard.')
  }
  return payload
}

export async function adminUserAction({ action, userId, blogId }) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Please sign in as super admin.')
  }

  const response = await fetch('/api/admin-user-action', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ action, userId, blogId }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to complete admin action.')
  }
  return payload
}
