# Disabled Vercel API routes

These files were moved out of `/api` so Vercel Hobby deployments do not count them as serverless functions.

| File | Former route | Purpose |
|------|--------------|---------|
| `create-checkout-session.js` | POST `/api/create-checkout-session` | Stripe checkout (disabled — app is free) |
| `verify-checkout-session.js` | POST `/api/verify-checkout-session` | Stripe session verify |
| `stripe-webhook.js` | POST `/api/stripe-webhook` | Stripe webhooks |
| `create-billing-portal-session.js` | POST `/api/create-billing-portal-session` | Stripe billing portal |
| `redeem-voucher.js` | POST `/api/redeem-voucher` | Voucher redemption |
| `release-recurring-subscription.js` | POST `/api/release-recurring-subscription` | Cancel recurring billing |
| `admin-dashboard.js` | GET `/api/admin-dashboard` | Super admin dashboard |
| `admin-user-action.js` | POST `/api/admin-user-action` | Admin user actions |

To re-enable on Vercel Pro, move needed files back into `/api`.
