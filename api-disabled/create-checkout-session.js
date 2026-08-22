import { handleCreateCheckoutSession } from '../server/paymentHandlers.js'

export default async function handler(req, res) {
  await handleCreateCheckoutSession(req, res)
}
