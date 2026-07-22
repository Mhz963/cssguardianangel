import { handleCreateBillingPortalSession } from './lib/accountHandlers.js'

export default async function handler(req, res) {
  await handleCreateBillingPortalSession(req, res)
}
