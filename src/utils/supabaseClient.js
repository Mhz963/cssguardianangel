import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const REFRESH_SKEW_MS = 60 * 1000

const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

let sessionRefreshPromise = null

export function isJwtExpiredError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const code = String(error?.code || '')
  return (
    code === 'PGRST301' ||
    message.includes('jwt expired') ||
    message.includes('invalid jwt') ||
    Number(error?.status) === 401
  )
}

export async function ensureFreshSession() {
  if (!supabase) return null
  if (sessionRefreshPromise) return sessionRefreshPromise

  sessionRefreshPromise = (async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      await supabase.auth.signOut({ scope: 'local' })
      return null
    }

    const session = data?.session || null
    if (!session) return null

    const expiresAtMs = Number(session.expires_at || 0) * 1000
    const needsRefresh = !expiresAtMs || expiresAtMs <= Date.now() + REFRESH_SKEW_MS
    if (!needsRefresh) return session

    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError || !refreshed?.session) {
      await supabase.auth.signOut({ scope: 'local' })
      return null
    }
    return refreshed.session
  })().finally(() => {
    sessionRefreshPromise = null
  })

  return sessionRefreshPromise
}

export async function recoverFromExpiredJwt() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.refreshSession()
  if (!error && data?.session) return data.session
  await supabase.auth.signOut({ scope: 'local' })
  return null
}

export { supabase, hasSupabaseConfig }
