import {
  getAuthUserFromRequest,
  getSiteOrigin,
  getStripeClient,
  getSupabaseAdmin,
  sendJson,
} from './payment.js'

export async function handleCreateBillingPortalSession(req, res) {
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
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('user_payments')
      .select('stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (paymentError) throw paymentError

    const stripeCustomerId = paymentRecord?.stripe_customer_id
    if (!stripeCustomerId) {
      sendJson(res, 400, {
        error: 'No billing profile found. Subscribe first to manage payments in Stripe.',
      })
      return
    }

    const stripe = getStripeClient()
    const origin = getSiteOrigin()
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/profile`,
    })

    sendJson(res, 200, { url: session.url })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to open billing portal.' })
  }
}

export async function handleDeleteAccount(req, res) {
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
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('user_payments')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (paymentError) throw paymentError

    const stripeSubscriptionId = paymentRecord?.stripe_subscription_id
    if (stripeSubscriptionId) {
      try {
        const stripe = getStripeClient()
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
        if (subscription.status !== 'canceled') {
          await stripe.subscriptions.cancel(stripeSubscriptionId)
        }
      } catch (stripeError) {
        const message = String(stripeError?.message || '')
        if (!message.toLowerCase().includes('no such subscription')) {
          throw stripeError
        }
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    sendJson(res, 200, { deleted: true })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to delete account.' })
  }
}
