import { supabase } from './supabaseClient.js'

/** Permanently deletes the signed-in user's account (server checks the session token). */
export async function deleteMyAccount() {
  if (!supabase) throw new Error('Sign-in is not configured.')
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('Please sign in again, then retry.')
  const response = await fetch('/api/delete-account', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: 'DELETE' }),
  })
  const text = await response.text()
  let payload = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { error: text }
  }
  if (!response.ok) throw new Error(payload.error || 'Unable to delete account.')
  await supabase.auth.signOut({ scope: 'local' })
  return payload
}
