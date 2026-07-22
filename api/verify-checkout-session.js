import { handleVerifyCheckoutSession } from '../server/paymentHandlers.js'

export default async function handler(req, res) {
  await handleVerifyCheckoutSession(req, res)
}
