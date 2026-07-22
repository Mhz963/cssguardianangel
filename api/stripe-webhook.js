import { handleStripeWebhook } from '../server/paymentHandlers.js'

export default async function handler(req, res) {
  await handleStripeWebhook(req, res)
}
