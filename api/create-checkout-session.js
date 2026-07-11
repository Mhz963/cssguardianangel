import { handleCreateCheckoutSession } from './lib/paymentHandlers.js'

export default async function handler(req, res) {
  await handleCreateCheckoutSession(req, res)
}
