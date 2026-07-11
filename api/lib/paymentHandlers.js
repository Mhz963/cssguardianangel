import {
  ACTIVATION_FEE_STRIPE_AMOUNT,
  getAuthUserFromRequest,
  getSiteOrigin,
  getStripeClient,
  getSupabaseAdmin,
  hasActiveSubscription,
  MONTHLY_STRIPE_AMOUNT,
  parseJsonBody,
  readRawBody,
  sendJson,
  syncSubscriptionFromStripe,
  upsertSubscriptionRecord,
} from './payment.js'

export async function handleCreateCheckoutSession(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { user, error: authError } = await getAuthUserFromRequest(req)
    if (!user) {
      sendJson(res, 401, { error: authError || 'Unauthorized.' })
      return
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingPayment } = await supabaseAdmin
      .from('user_payments')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (hasActiveSubscription(existingPayment?.status)) {
      sendJson(res, 200, { alreadySubscribed: true, url: null })
      return
    }

    const stripe = getStripeClient()
    const origin = getSiteOrigin()
    const email = String(user.email || '').trim()
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY

    const recurringLineItem = monthlyPriceId
      ? { price: monthlyPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'pkr',
            unit_amount: MONTHLY_STRIPE_AMOUNT,
            recurring: { interval: 'month' },
            product_data: {
              name: 'Guardian Study Planner Premium',
              description: 'Monthly access to Guardian Study Planner (PKR 500/month after first month).',
            },
          },
          quantity: 1,
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email || undefined,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        product: 'guardian_study_planner_premium',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          product: 'guardian_study_planner_premium',
        },
      },
      line_items: [
        recurringLineItem,
        {
          price_data: {
            currency: 'pkr',
            unit_amount: ACTIVATION_FEE_STRIPE_AMOUNT,
            product_data: {
              name: 'First Month Activation',
              description: 'One-time fee on your first payment (first month total: PKR 1,000).',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment?canceled=1`,
    })

    await upsertSubscriptionRecord({
      userId: user.id,
      stripeSessionId: session.id,
      status: 'pending',
    })

    sendJson(res, 200, { url: session.url, alreadySubscribed: false })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to start checkout.' })
  }
}

export async function handleStripeWebhook(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    sendJson(res, 500, { error: 'Missing STRIPE_WEBHOOK_SECRET server configuration.' })
    return
  }

  try {
    const stripe = getStripeClient()
    const signature = req.headers['stripe-signature']
    const rawBody = await readRawBody(req)
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(session.subscription))
          await syncSubscriptionFromStripe(subscription, {
            stripeSessionId: session.id,
            stripeCustomerId: session.customer,
          })
        }
        break
      }
      case 'invoice.paid': {
        const invoice = event.data.object
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription))
          await syncSubscriptionFromStripe(subscription)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await syncSubscriptionFromStripe(subscription)
        break
      }
      default:
        break
    }

    sendJson(res, 200, { received: true })
  } catch (error) {
    sendJson(res, 400, { error: error?.message || 'Webhook error.' })
  }
}

export async function handleVerifyCheckoutSession(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { user, error: authError } = await getAuthUserFromRequest(req)
    if (!user) {
      sendJson(res, 401, { error: authError || 'Unauthorized.' })
      return
    }

    const body = parseJsonBody(req)
    const sessionId = String(body?.sessionId || req.query?.sessionId || '').trim()
    if (!sessionId) {
      sendJson(res, 400, { error: 'Missing sessionId.' })
      return
    }

    const stripe = getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    })
    const sessionUserId = session.metadata?.user_id || session.client_reference_id

    if (sessionUserId !== user.id) {
      sendJson(res, 403, { error: 'Session does not belong to this account.' })
      return
    }

    const subscription = session.subscription
    if (!subscription || typeof subscription === 'string') {
      sendJson(res, 200, { active: false, status: 'pending' })
      return
    }

    await syncSubscriptionFromStripe(subscription, {
      stripeSessionId: session.id,
      stripeCustomerId: session.customer,
    })

    sendJson(res, 200, {
      active: hasActiveSubscription(subscription.status),
      status: subscription.status,
    })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to verify payment.' })
  }
}

function getConfiguredVoucherCode() {
  return String(process.env.PREMIUM_VOUCHER_CODE || 'secretperson').trim().toLowerCase()
}

export async function handleRedeemVoucher(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' })
    return
  }

  try {
    const { user, error: authError } = await getAuthUserFromRequest(req)
    if (!user) {
      sendJson(res, 401, { error: authError || 'Unauthorized.' })
      return
    }

    const body = parseJsonBody(req)
    const submittedCode = String(body?.code || '').trim().toLowerCase()
    if (!submittedCode) {
      sendJson(res, 400, { error: 'Please enter a voucher code.' })
      return
    }

    const validCode = getConfiguredVoucherCode()
    if (!validCode || submittedCode !== validCode) {
      sendJson(res, 400, { error: 'Invalid voucher code.' })
      return
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: existingPayment } = await supabaseAdmin
      .from('user_payments')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (hasActiveSubscription(existingPayment?.status)) {
      sendJson(res, 200, { redeemed: true, alreadyActive: true, status: existingPayment.status })
      return
    }

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin.from('user_payments').upsert(
      {
        user_id: user.id,
        status: 'voucher',
        paid_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )
    if (error) {
      if (String(error.message || '').includes('user_payments_status_check')) {
        throw new Error(
          'Voucher status is not enabled in the database yet. Run supabase/migrations/20250711_user_payments_voucher.sql in Supabase SQL Editor.',
        )
      }
      throw error
    }

    sendJson(res, 200, { redeemed: true, alreadyActive: false, status: 'voucher' })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to redeem voucher.' })
  }
}
