import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  FIRST_MONTH_PRICE_PKR,
  getAuthUserFromRequest,
  getStripeClient,
  getSupabaseAdmin,
  hasActiveSubscription,
  parseJsonBody,
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
    const [paymentsResult, ordersResult, blogsResult, authUsers, stripeRevenue] = await Promise.all([
      supabaseAdmin.from('user_payments').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('payment_orders').select('*').order('paid_at', { ascending: false }).limit(200),
      supabaseAdmin
        .from('user_blogs')
        .select('id, owner_user_id, owner_key, author_name, slug, title, excerpt, categories, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(300),
      listAllAuthUsers(supabaseAdmin),
      fetchStripeRevenueSummary(),
    ])

    if (paymentsResult.error) throw paymentsResult.error
    if (ordersResult.error && !String(ordersResult.error.message || '').includes('payment_orders')) {
      throw ordersResult.error
    }
    if (blogsResult.error) throw blogsResult.error

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

    const paymentByUser = new Map(payments.map((payment) => [payment.user_id, payment]))

    const users = authUsers
      .map((user) => {
        const profile = mapUserProfile(user)
        const payment = paymentByUser.get(user.id)
        const orderStats = ordersByUser.get(user.id) || { count: 0, totalPaidPkr: 0 }
        const status = payment?.status || 'none'
        const estimatedPaidPkr =
          orderStats.totalPaidPkr > 0
            ? orderStats.totalPaidPkr
            : payment?.paid_at
              ? Number(payment.first_month_amount_pkr || FIRST_MONTH_PRICE_PKR)
              : 0

        return {
          userId: user.id,
          email: profile.email || '—',
          fullName: profile.fullName || '—',
          username: profile.username || '',
          createdAt: profile.createdAt,
          lastSignInAt: user.last_sign_in_at || null,
          emailConfirmedAt: user.email_confirmed_at || null,
          status,
          isActiveSubscriber: hasActiveSubscription(status),
          paidAt: payment?.paid_at || null,
          currentPeriodEnd: payment?.current_period_end || null,
          orderCount: orderStats.count,
          totalPaidPkr: estimatedPaidPkr,
          stripeCustomerId: payment?.stripe_customer_id || null,
          stripeSubscriptionId: payment?.stripe_subscription_id || null,
        }
      })
      .sort((a, b) => {
        if (a.isActiveSubscriber !== b.isActiveSubscriber) return a.isActiveSubscriber ? -1 : 1
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
      })

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

    const blogs = (blogsResult.data || []).map((blog) => {
      const profile = userMap.get(blog.owner_user_id) || {}
      const categories = Array.isArray(blog.categories) ? blog.categories : []
      return {
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        excerpt: blog.excerpt || '',
        authorName: blog.author_name || profile.fullName || 'Guardian User',
        ownerUserId: blog.owner_user_id,
        ownerEmail: profile.email || '—',
        categories,
        createdAt: blog.created_at,
        updatedAt: blog.updated_at,
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
        totalBlogs: blogs.length,
        statusCounts,
      },
      users,
      subscriptions,
      recentOrders,
      blogs,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to load admin dashboard.' })
  }
}

async function cancelStripeSubscriptionIfAny(stripeSubscriptionId) {
  if (!stripeSubscriptionId) return { canceled: false }
  try {
    const stripe = getStripeClient()
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    if (subscription.status !== 'canceled') {
      await stripe.subscriptions.cancel(stripeSubscriptionId)
    }
    return { canceled: true }
  } catch (stripeError) {
    const message = String(stripeError?.message || '')
    if (message.toLowerCase().includes('no such subscription')) {
      return { canceled: false, missing: true }
    }
    throw stripeError
  }
}

async function refundLatestStripePayment({ stripeCustomerId, stripeSubscriptionId }) {
  const stripe = getStripeClient()
  let invoice = null

  if (stripeSubscriptionId) {
    const invoices = await stripe.invoices.list({
      subscription: stripeSubscriptionId,
      status: 'paid',
      limit: 1,
    })
    invoice = invoices.data?.[0] || null
  }

  if (!invoice && stripeCustomerId) {
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      status: 'paid',
      limit: 1,
    })
    invoice = invoices.data?.[0] || null
  }

  if (!invoice) {
    return { refunded: false, reason: 'No paid Stripe invoice found to refund.' }
  }

  const paymentIntentId =
    typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : invoice.payment_intent?.id || null

  if (!paymentIntentId) {
    return { refunded: false, reason: 'Invoice has no payment intent to refund.' }
  }

  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: 'requested_by_customer',
  })

  return {
    refunded: true,
    refundId: refund.id,
    amountPkr: Math.round(Number(invoice.amount_paid || 0) / 100),
    invoiceId: invoice.id,
  }
}

export async function handleAdminUserAction(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { user: adminUser, error: accessError } = await assertSuperAdmin(req)
    if (accessError) {
      sendJson(res, accessError === 'Forbidden.' ? 403 : 401, { error: accessError })
      return
    }

    const body = parseJsonBody(req)
    const action = String(body?.action || '').trim().toLowerCase()
    const targetUserId = String(body?.userId || '').trim()
    const blogId = String(body?.blogId || '').trim()

    if (action !== 'delete' && action !== 'refund' && action !== 'delete_blog') {
      sendJson(res, 400, { error: 'Unsupported action. Use delete, refund, or delete_blog.' })
      return
    }

    const supabaseAdmin = getSupabaseAdmin()

    if (action === 'delete_blog') {
      if (!blogId) {
        sendJson(res, 400, { error: 'Missing blogId.' })
        return
      }

      const { data: blog, error: blogError } = await supabaseAdmin
        .from('user_blogs')
        .select('id, slug, title')
        .eq('id', blogId)
        .maybeSingle()
      if (blogError) throw blogError
      if (!blog) {
        sendJson(res, 404, { error: 'Blog not found.' })
        return
      }

      const slug = blog.slug
      await Promise.all([
        supabaseAdmin.from('blog_comments').delete().eq('blog_slug', slug),
        supabaseAdmin.from('blog_reactions').delete().eq('blog_slug', slug),
      ])

      const { error: deleteBlogError } = await supabaseAdmin.from('user_blogs').delete().eq('id', blogId)
      if (deleteBlogError) throw deleteBlogError

      sendJson(res, 200, {
        ok: true,
        action: 'delete_blog',
        blogId,
        slug,
        title: blog.title,
        deleted: true,
      })
      return
    }

    if (!targetUserId) {
      sendJson(res, 400, { error: 'Missing userId.' })
      return
    }
    if (targetUserId === adminUser.id) {
      sendJson(res, 400, { error: 'You cannot perform this action on your own admin account.' })
      return
    }

    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('user_payments')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle()
    if (paymentError) throw paymentError

    if (action === 'refund') {
      if (paymentRecord?.status === 'voucher') {
        sendJson(res, 400, { error: 'Voucher access cannot be refunded.' })
        return
      }

      const stripeSubscriptionId = paymentRecord?.stripe_subscription_id || null
      const stripeCustomerId = paymentRecord?.stripe_customer_id || null

      if (!stripeSubscriptionId && !stripeCustomerId) {
        sendJson(res, 400, { error: 'No Stripe billing profile found for this user.' })
        return
      }

      const refundResult = await refundLatestStripePayment({
        stripeCustomerId,
        stripeSubscriptionId,
      })

      await cancelStripeSubscriptionIfAny(stripeSubscriptionId)

      const now = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin.from('user_payments').upsert(
        {
          user_id: targetUserId,
          status: 'canceled',
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      )
      if (updateError) throw updateError

      if (refundResult.invoiceId) {
        await supabaseAdmin
          .from('payment_orders')
          .update({ status: 'refunded', updated_at: now })
          .eq('stripe_invoice_id', refundResult.invoiceId)
      }

      sendJson(res, 200, {
        ok: true,
        action: 'refund',
        userId: targetUserId,
        subscriptionCanceled: true,
        ...refundResult,
      })
      return
    }

    // delete
    await cancelStripeSubscriptionIfAny(paymentRecord?.stripe_subscription_id || null)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) throw deleteError

    sendJson(res, 200, {
      ok: true,
      action: 'delete',
      userId: targetUserId,
      deleted: true,
    })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to complete admin action.' })
  }
}
