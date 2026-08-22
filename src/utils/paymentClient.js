import { hasSupabaseConfig, supabase } from './supabaseClient.js'

export const FIRST_MONTH_PRICE_PKR = 1000
export const MONTHLY_PRICE_PKR = 500

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'voucher'])

const PAYMENTS_DISABLED_MESSAGE =
  'Stripe billing is disabled. Guardian Study Planner is free — sign in to use it.'

export function hasActiveSubscription(_status) {
  // Guardian Study Planner is free for all signed-in users.
  return true
}

export async function fetchSubscriptionStatus(userId) {
  if (!hasSupabaseConfig || !supabase || !userId) {
    return { status: null, currentPeriodEnd: null }
  }

  const { data, error } = await supabase
    .from('user_payments')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Unable to load subscription status:', error.message)
    return { status: null, currentPeriodEnd: null }
  }

  return {
    status: data?.status || null,
    currentPeriodEnd: data?.current_period_end || null,
  }
}

async function getAccessToken() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.access_token || null
}

export async function startSubscriptionCheckout() {
  await getAccessToken()
  throw new Error(PAYMENTS_DISABLED_MESSAGE)
}

export async function verifyCheckoutSession(_sessionId) {
  return { active: true, status: 'free' }
}

export async function redeemVoucherCode(_code) {
  throw new Error(PAYMENTS_DISABLED_MESSAGE)
}

export async function releaseRecurringSubscriptionIfAny() {
  // Serverless Stripe API disabled on Vercel Hobby; nothing to release.
  return { released: false, reason: 'payments_disabled' }
}

export async function openBillingPortal() {
  throw new Error(PAYMENTS_DISABLED_MESSAGE)
}
