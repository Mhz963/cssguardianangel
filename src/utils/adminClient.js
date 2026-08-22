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

async function readJson(response) {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { error: text }
  }
}

export async function fetchAdminDashboard() {
  const token = await getAccessToken()
  if (!token) throw new Error('Sign in with the super admin account to open this dashboard.')

  const response = await fetch('/api/admin-dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to load admin dashboard.')
  }
  return payload
}

export async function adminUserAction(payload) {
  const token = await getAccessToken()
  if (!token) throw new Error('Sign in with the super admin account to continue.')

  const response = await fetch('/api/admin-user-action', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload || {}),
  })
  const result = await readJson(response)
  if (!response.ok) {
    throw new Error(result.error || 'Unable to complete admin action.')
  }
  return result
}
