import { handleDeleteAccount } from '../server/accountHandlers.js'

export default async function handler(req, res) {
  await handleDeleteAccount(req, res)
}
