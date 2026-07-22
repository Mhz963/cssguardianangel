import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  FIRST_MONTH_PRICE_PKR,
  getAuthUserFromRequest,
  getStripeClient,
  getSupabaseAdmin,
  hasActiveSubscription,
  sendJson,
} from './payment.js'

const SUPER_ADMIN_EMAIL = String(process.env.SUPER_ADMIN_EMAIL || 'muhammadhasan963@gmail.com')
  .trim()
  .toLowerCase()

export function isSuperAdminEmail(email) {
  return String(email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL
}

export async function assertSuperAdmin(req) {
  const { user, error: authError } = await getAuthUserFromRequest(req)
  if (!user) {
    return { user: null, error: authError || 'Unauthorized.' }
  }
  if (!isSuperAdminEmail(user.email)) {
    return { user: null, error: 'Forbidden.' }
  }
  return { user, error: null }
}

async function listAllAuthUsers(supabaseAdmin) {
  const users = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < perPage) break
    page += 1
    if (page > 50) break
  }

  return users
}

function mapUserProfile(user) {
  const meta = user?.user_metadata || {}
  return {
    email: String(user?.email || '').trim(),
    fullName: String(meta.full_name || meta.name || '').trim(),
    username: String(meta.username || '').trim(),
    createdAt: user?.created_at || null,
  }
}

function formatPkr(amount) {
  return `PKR ${Number(amount || 0).toLocaleString()}`
}

async function fetchStripeRevenueSummary() {
  try {
    const stripe = getStripeClient()
    let totalEarnedPkr = 0
    let stripeOrderCount = 0
    let startingAfter = undefined

    for (let page = 0; page < 20; page += 1) {
      const invoices = await stripe.invoices.list({
        status: 'paid',
        limit: 100,
        starting_after: startingAfter,
      })

      for (const invoice of invoices.data) {
        totalEarnedPkr += Math.round(Number(invoice.amount_paid || 0) / 100)
        stripeOrderCount += 1
      }

      if (!invoices.has_more || invoices.data.length === 0) break
      startingAfter = invoices.data[invoices.data.length - 1]?.id
    }

    return { totalEarnedPkr, stripeOrderCount, source: 'stripe' }
  } catch {
    return { totalEarnedPkr: 0, stripeOrderCount: 0, source: 'database' }
  }
}

export async function handleAdminDashboardStats(req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { error: accessError } = await assertSuperAdmin(req)
    if (accessError) {
      sendJson(res, accessError === 'Forbidden.' ? 403 : 401, { error: accessError })
      return
    }

    const supabaseAdmin = getSupabaseAdmin()
    const [paymentsResult, ordersResult, authUsers, stripeRevenue] = await Promise.all([
      supabaseAdmin.from('user_payments').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('payment_orders').select('*').order('paid_at', { ascending: false }).limit(200),
      listAllAuthUsers(supabaseAdmin),
      fetchStripeRevenueSummary(),
    ])

    if (paymentsResult.error) throw paymentsResult.error
    if (ordersResult.error && !String(ordersResult.error.message || '').includes('payment_orders')) {
      throw ordersResult.error
    }

    const payments = paymentsResult.data || []
    const orders = ordersResult.error ? [] : ordersResult.data || []
    const userMap = new Map(authUsers.map((user) => [user.id, mapUserProfile(user)]))

    const ordersByUser = new Map()
    for (const order of orders) {
      if (!order.user_id) continue
      const current = ordersByUser.get(order.user_id) || { count: 0, totalPaidPkr: 0 }
      current.count += 1
      current.totalPaidPkr += Number(order.amount_pkr || 0)
      ordersByUser.set(order.user_id, current)
    }

    const statusCounts = {
      active: 0,
      trialing: 0,
      voucher: 0,
      pending: 0,
      canceled: 0,
      past_due: 0,
      incomplete: 0,
      unpaid: 0,
    }

    let activeSubscribers = 0
    let paidSubscribers = 0

    const subscriptions = payments.map((payment) => {
      const profile = userMap.get(payment.user_id) || {}
      const orderStats = ordersByUser.get(payment.user_id) || { count: 0, totalPaidPkr: 0 }
      const status = payment.status || 'pending'

      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1
      }
      if (hasActiveSubscription(status)) {
        activeSubscribers += 1
      }
      if (payment.paid_at || hasActiveSubscription(status)) {
        paidSubscribers += 1
      }

      const estimatedPaidPkr =
        orderStats.totalPaidPkr > 0
          ? orderStats.totalPaidPkr
          : payment.paid_at
            ? Number(payment.first_month_amount_pkr || FIRST_MONTH_PRICE_PKR)
            : 0

      return {
        userId: payment.user_id,
        email: profile.email || '—',
        fullName: profile.fullName || '—',
        username: profile.username || '',
        status,
        paidAt: payment.paid_at,
        currentPeriodEnd: payment.current_period_end,
        firstMonthAmountPkr: payment.first_month_amount_pkr,
        monthlyAmountPkr: payment.monthly_amount_pkr,
        stripeCustomerId: payment.stripe_customer_id,
        stripeSubscriptionId: payment.stripe_subscription_id,
        orderCount: orderStats.count,
        totalPaidPkr: estimatedPaidPkr,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      }
    })

    const dbEarnedPkr = orders.reduce((sum, order) => sum + Number(order.amount_pkr || 0), 0)
    const totalEarnedPkr = stripeRevenue.totalEarnedPkr > 0 ? stripeRevenue.totalEarnedPkr : dbEarnedPkr
    const totalOrders = stripeRevenue.stripeOrderCount > 0 ? stripeRevenue.stripeOrderCount : orders.length

    const recentOrders = orders.slice(0, 50).map((order) => {
      const profile = userMap.get(order.user_id) || {}
      return {
        id: order.id,
        userId: order.user_id,
        email: profile.email || '—',
        amountPkr: order.amount_pkr,
        orderType: order.order_type,
        status: order.status,
        paidAt: order.paid_at,
        stripeInvoiceId: order.stripe_invoice_id,
        stripeSubscriptionId: order.stripe_subscription_id,
      }
    })

    sendJson(res, 200, {
      summary: {
        totalEarnedPkr,
        totalEarnedLabel: formatPkr(totalEarnedPkr),
        revenueSource: stripeRevenue.totalEarnedPkr > 0 ? 'stripe' : 'database',
        totalOrders,
        activeSubscribers,
        paidSubscribers,
        totalSubscriptionRecords: payments.length,
        totalRegisteredUsers: authUsers.length,
        statusCounts,
      },
      subscriptions,
      recentOrders,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to load admin dashboard.' })
  }
}
