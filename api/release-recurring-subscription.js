import { handleReleaseRecurringSubscription } from '../server/paymentHandlers.js'

export default async function handler(req, res) {
  await handleReleaseRecurringSubscription(req, res)
}
