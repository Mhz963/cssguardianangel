import { handleDeleteAccount } from './lib/accountHandlers.js'

export default async function handler(req, res) {
  await handleDeleteAccount(req, res)
}
