import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const FIRST_MONTH_PRICE_PKR = 1000
export const MONTHLY_PRICE_PKR = 500
export const ACTIVATION_FEE_PKR = 500

export const MONTHLY_STRIPE_AMOUNT = MONTHLY_PRICE_PKR * 100
export const ACTIVATION_FEE_STRIPE_AMOUNT = ACTIVATION_FEE_PKR * 100

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'voucher'])

export const PREMIUM_FEATURES = [
  'Subject Locker — compulsory & optional subject selection',
  'Strategy Builder — personalized CSS study timetable',
  'Performance Analysis — Survivor / Contender / Topper tracking',
  'Timer & Analytics — study session tracking',
  'Social Balance — screen-time discipline tools',
  'Guardian Calendar — daily plan & revision tracking',
  'Guardian Angel Report — PDF progress export',
  'AI Examiner — exam readiness scoring',
]

export function hasActiveSubscription(status) {
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status)
}

export function getSiteOrigin() {
  const siteUrl = process.env.VITE_PUBLIC_SITE_URL
  if (siteUrl) return siteUrl.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '')
  return 'http://localhost:5173'
}

let stripeClient = null

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY server configuration.')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey)
  }
  return stripeClient
}

export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration.')
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getAuthUserFromRequest(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || ''
  const token = String(authHeader).replace(/^Bearer\s+/i, '').trim()
  if (!token) return { user: null, error: 'Missing authorization token.' }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return { user: null, error: 'Missing Supabase configuration.' }
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) {
    return { user: null, error: error?.message || 'Invalid session.' }
  }
  return { user: data.user, error: null }
}

export async function readRawBody(req) {
  if (typeof req.text === 'function') {
    return req.text()
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8')
  }
  if (typeof req.body === 'string') {
    return req.body
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export async function upsertSubscriptionRecord({
  userId,
  stripeCustomerId,
  stripeSessionId,
  stripeSubscriptionId,
  status,
  currentPeriodEnd,
  paidAt,
}) {
  const supabaseAdmin = getSupabaseAdmin()
  const now = new Date().toISOString()
  const payload = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId || null,
    stripe_session_id: stripeSessionId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    first_month_amount_pkr: FIRST_MONTH_PRICE_PKR,
    monthly_amount_pkr: MONTHLY_PRICE_PKR,
    status: status || 'pending',
    current_period_end: currentPeriodEnd || null,
    updated_at: now,
  }
  if (paidAt) payload.paid_at = paidAt
  else if (hasActiveSubscription(status)) payload.paid_at = now

  const { error } = await supabaseAdmin.from('user_payments').upsert(payload, { onConflict: 'user_id' })
  if (error) throw error
}

export async function syncSubscriptionFromStripe(subscription, extras = {}) {
  const userId = subscription.metadata?.user_id
  if (!userId) return null

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null

  await upsertSubscriptionRecord({
    userId,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd,
    paidAt: hasActiveSubscription(subscription.status) ? new Date().toISOString() : null,
    ...extras,
  })
  return userId
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export function parseJsonBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'object') return req.body
  try {
    return JSON.parse(req.body || '{}')
  } catch {
    return {}
  }
}
