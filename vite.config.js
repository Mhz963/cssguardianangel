import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// Stripe / payment serverless routes disabled for Vercel Hobby (see api-disabled/).
// Local admin middleware is loaded only when server/ is present (Vercel may omit it).

async function loadLocalAdminHandlers() {
  const adminPath = join(process.cwd(), 'server', 'adminHandlers.js')
  const paymentPath = join(process.cwd(), 'server', 'payment.js')
  const accountPath = join(process.cwd(), 'server', 'accountHandlers.js')
  if (!existsSync(adminPath) || !existsSync(paymentPath) || !existsSync(accountPath)) return null

  const [admin, payment, account] = await Promise.all([
    import(pathToFileURL(adminPath).href),
    import(pathToFileURL(paymentPath).href),
    import(pathToFileURL(accountPath).href),
  ])

  return {
    handleAdminDashboardStats: admin.handleAdminDashboardStats,
    handleAdminUserAction: admin.handleAdminUserAction,
    handleDeleteAccount: account.handleDeleteAccount,
    readRawBody: payment.readRawBody,
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    build: {
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
              return 'react-vendor'
            }
            if (id.includes('node_modules/react-router')) {
              return 'router-vendor'
            }
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
              return 'leaflet-vendor'
            }
            // jsPDF / PDF.js / pptx2html / transformers are deliberately NOT grouped here:
            // forcing them into named chunks made Vite modulepreload them on every page.
            // Left alone, they are split per dynamic import and load only when used.
            if (id.includes('node_modules/@supabase')) {
              return 'supabase-vendor'
            }
          },
        },
      },
    },
    plugins: [
      react(),
      {
        // Guardian News Desk: same RSS aggregation the /api/news Vercel function runs in production.
        name: 'news-desk-middleware',
        configureServer(server) {
          server.middlewares.use('/api/news', async (req, res) => {
            const { handleNews } = await import(pathToFileURL(join(process.cwd(), 'server', 'newsHandler.js')).href)
            await handleNews(req, res)
          })
        },
      },
      {
        name: 'admin-dashboard-middleware',
        async configureServer(server) {
          Object.assign(process.env, env)
          const handlers = await loadLocalAdminHandlers()
          if (!handlers) return

          const attachJsonBody = async (req) => {
            if (req.body !== undefined) return
            const raw = await handlers.readRawBody(req)
            try {
              req.body = JSON.parse(raw || '{}')
            } catch {
              req.body = {}
            }
          }

          server.middlewares.use('/api/admin-dashboard', async (req, res) => {
            try {
              await handlers.handleAdminDashboardStats(req, res)
            } catch (error) {
              if (res.writableEnded) return
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Unable to load admin dashboard.' }))
            }
          })

          server.middlewares.use('/api/delete-account', async (req, res) => {
            try {
              await attachJsonBody(req)
              await handlers.handleDeleteAccount(req, res)
            } catch (error) {
              if (res.writableEnded) return
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Unable to delete account.' }))
            }
          })

          server.middlewares.use('/api/admin-user-action', async (req, res) => {
            try {
              await attachJsonBody(req)
              await handlers.handleAdminUserAction(req, res)
            } catch (error) {
              if (res.writableEnded) return
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Unable to complete admin action.' }))
            }
          })
        },
      },
      // {
      //   name: 'stripe-payment-middleware',
      //   configureServer(server) {
      //     Object.assign(process.env, env)
      //     server.middlewares.use('/api/create-checkout-session', async (req, res) => {
      //       await handleCreateCheckoutSession(req, res)
      //     })
      //     server.middlewares.use('/api/stripe-webhook', async (req, res) => {
      //       await handleStripeWebhook(req, res)
      //     })
      //     server.middlewares.use('/api/verify-checkout-session', async (req, res) => {
      //       await handleVerifyCheckoutSession(req, res)
      //     })
      //     server.middlewares.use('/api/redeem-voucher', async (req, res) => {
      //       await handleRedeemVoucher(req, res)
      //     })
      //     server.middlewares.use('/api/release-recurring-subscription', async (req, res) => {
      //       await handleReleaseRecurringSubscription(req, res)
      //     })
      //   },
      // },
    ],
    optimizeDeps: {
      exclude: ['@huggingface/transformers', 'onnxruntime-web'],
    },
    worker: {
      format: 'es',
    },
    server: {
      host: true,
      port: 5173,
    },
  }
})
