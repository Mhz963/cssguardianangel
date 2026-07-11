import { handleRedeemVoucher } from './lib/paymentHandlers.js'

export default async function handler(req, res) {
  await handleRedeemVoucher(req, res)
}
