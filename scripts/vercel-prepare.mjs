import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const apiDir = join(root, 'api')

if (existsSync(apiDir)) {
  rmSync(apiDir, { recursive: true, force: true })
  console.log('[vercel-prepare] Removed api/ — static-only deployment (no serverless functions).')
}
