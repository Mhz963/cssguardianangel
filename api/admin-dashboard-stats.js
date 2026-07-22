import { handleAdminDashboardStats } from './lib/adminHandlers.js'

export default async function handler(req, res) {
  await handleAdminDashboardStats(req, res)
}
