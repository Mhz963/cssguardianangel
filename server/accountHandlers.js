import {
  getAuthUserFromRequest,
  getSiteOrigin,
  getStripeClient,
  getSupabaseAdmin,
  parseJsonBody,
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

const USER_STORAGE_BUCKETS = ['ga-portfolio', 'ga-pdf-downloads']

async function listUserFiles(storage, bucket, prefix, depth = 0) {
  if (depth > 6) return []
  const files = []
  for (let offset = 0; offset < 5000; offset += 100) {
    const { data, error } = await storage.from(bucket).list(prefix, { limit: 100, offset })
    if (error || !data?.length) break
    for (const item of data) {
      const path = `${prefix}/${item.name}`
      // Folders have no id in the Storage list API.
      if (item.id) files.push(path)
      else files.push(...(await listUserFiles(storage, bucket, path, depth + 1)))
    }
    if (data.length < 100) break
  }
  return files
}

/**
 * Permanently deletes the signed-in user's account: their uploaded files, then the auth user.
 * All user tables reference auth.users with ON DELETE CASCADE (payment_orders keeps the
 * order with user_id set to null), so removing the auth user removes the rest of their data.
 */
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

    const body = parseJsonBody(req)
    if (String(body?.confirm || '') !== 'DELETE') {
      sendJson(res, 400, { error: 'Type DELETE to confirm account deletion.' })
      return
    }

    const supabaseAdmin = getSupabaseAdmin()
    for (const bucket of USER_STORAGE_BUCKETS) {
      try {
        const files = await listUserFiles(supabaseAdmin.storage, bucket, user.id)
        for (let i = 0; i < files.length; i += 100) {
          await supabaseAdmin.storage.from(bucket).remove(files.slice(i, i + 100))
        }
      } catch {
        // A missing bucket must not block account deletion.
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError

    sendJson(res, 200, { deleted: true })
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Unable to delete account.' })
  }
}
