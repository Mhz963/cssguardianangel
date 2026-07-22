import { handleAdminDashboardStats } from '../server/adminHandlers.js'
import { handleCreateBillingPortalSession, handleDeleteAccount } from '../server/accountHandlers.js'
import {
  handleCreateCheckoutSession,
  handleRedeemVoucher,
  handleStripeWebhook,
  handleVerifyCheckoutSession,
} from '../server/paymentHandlers.js'
import { handleCurrentAffairs } from '../server/currentAffairsHandler.js'
import { handleGlobalAffairs } from '../server/globalAffairsHandler.js'
import { handleGlobalConflicts } from '../server/globalConflictsHandler.js'
import { readRawBody, sendJson } from '../server/payment.js'

const ROUTES = {
  'create-checkout-session': handleCreateCheckoutSession,
  'stripe-webhook': handleStripeWebhook,
  'verify-checkout-session': handleVerifyCheckoutSession,
  'redeem-voucher': handleRedeemVoucher,
  'create-billing-portal-session': handleCreateBillingPortalSession,
  'delete-account': handleDeleteAccount,
  'admin-dashboard-stats': handleAdminDashboardStats,
  'global-affairs': handleGlobalAffairs,
  'current-affairs': handleCurrentAffairs,
  'global-conflicts': handleGlobalConflicts,
}

function resolveRoutePath(req) {
  const pathParam = req.query?.path
  if (Array.isArray(pathParam)) {
    return pathParam.join('/')
  }
  if (typeof pathParam === 'string' && pathParam.trim()) {
    return pathParam.trim()
  }

  const url = String(req.url || '')
  const match = url.match(/\/api\/([^?]+)/)
  return match?.[1] || ''
}

async function attachJsonBody(req, routePath) {
  if (routePath === 'stripe-webhook') return
  if (!['POST', 'PUT', 'PATCH'].includes(String(req.method || '').toUpperCase())) return
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return

  const rawBody = await readRawBody(req)
  if (!rawBody) {
    req.body = {}
    return
  }

  try {
    req.body = JSON.parse(rawBody)
  } catch {
    req.body = {}
  }
}

export default async function handler(req, res) {
  const routePath = resolveRoutePath(req)
  const routeHandler = ROUTES[routePath]

  if (!routeHandler) {
    sendJson(res, 404, { error: 'API route not found.' })
    return
  }

  await attachJsonBody(req, routePath)
  await routeHandler(req, res)
}

export const config = {
  api: {
    bodyParser: false,
  },
}
