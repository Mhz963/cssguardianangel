import { hasSupabaseConfig, supabase } from './supabaseClient.js'

export const FIRST_MONTH_PRICE_PKR = 1000
export const MONTHLY_PRICE_PKR = 500

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'voucher'])

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
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Please sign in to continue.')
  }

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to start checkout.')
  }
  if (payload.alreadySubscribed) {
    return { alreadySubscribed: true, url: null }
  }
  if (!payload.url) {
    throw new Error('Checkout URL was not returned.')
  }
  return { alreadySubscribed: false, url: payload.url }
}

export async function verifyCheckoutSession(sessionId) {
  const token = await getAccessToken()
  if (!token || !sessionId) {
    return { active: false, status: null }
  }

  const response = await fetch('/api/verify-checkout-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to verify payment.')
  }
  return payload
}

export async function redeemVoucherCode(code) {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Please sign in to continue.')
  }

  const response = await fetch('/api/redeem-voucher', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to redeem voucher.')
  }
  return payload
}

export async function releaseRecurringSubscriptionIfAny() {
  const token = await getAccessToken()
  if (!token) {
    return { released: false }
  }

  const response = await fetch('/api/release-recurring-subscription', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to release recurring subscription.')
  }
  return payload
}

export async function openBillingPortal() {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('Please sign in to continue.')
  }

  const response = await fetch('/api/create-billing-portal-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.error || 'Unable to open billing portal.')
  }
  return payload
}
