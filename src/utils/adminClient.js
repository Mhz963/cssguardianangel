import { supabase } from './supabaseClient.js'

export const SUPER_ADMIN_EMAIL = String(
  import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'muhammadhasan963@gmail.com',
)
  .trim()
  .toLowerCase()

const ADMIN_API_DISABLED_MESSAGE =
  'Admin serverless API is disabled on this deployment (Vercel Hobby plan). Use the Supabase dashboard for admin tasks, or restore api/admin-*.js on Vercel Pro.'

export function isSuperAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL
}

async function getAccessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

export async function fetchAdminDashboard() {
  await getAccessToken()
  throw new Error(ADMIN_API_DISABLED_MESSAGE)
}

export async function adminUserAction(_payload) {
  await getAccessToken()
  throw new Error(ADMIN_API_DISABLED_MESSAGE)
}
