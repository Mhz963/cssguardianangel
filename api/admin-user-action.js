import { handleAdminUserAction } from '../server/adminHandlers.js'

export default async function handler(req, res) {
  await handleAdminUserAction(req, res)
}
