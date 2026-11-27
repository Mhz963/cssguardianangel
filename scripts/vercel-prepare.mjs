import { existsSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const apiDir = join(root, 'api')

// Keep super-admin, account-deletion and News Desk APIs on Vercel Hobby (4 of the 12 allowed functions). Stripe/payment routes stay in api-disabled/.
const KEEP_API_FILES = new Set(['admin-dashboard.js', 'admin-user-action.js', 'delete-account.js', 'news.js'])

if (existsSync(apiDir)) {
  for (const name of readdirSync(apiDir)) {
    if (KEEP_API_FILES.has(name)) continue
    rmSync(join(apiDir, name), { recursive: true, force: true })
    console.log(`[vercel-prepare] Removed api/${name} (payment APIs stay disabled).`)
  }
}
