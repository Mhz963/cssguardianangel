import { handleRedeemVoucher } from '../server/paymentHandlers.js'

export default async function handler(req, res) {
  await handleRedeemVoucher(req, res)
}
