import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import {
  handleCreateCheckoutSession,
  handleRedeemVoucher,
  handleStripeWebhook,
  handleVerifyCheckoutSession,
} from './api/lib/paymentHandlers.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.WORLDNEWSAPI_KEY || ''
  let countryCoordCache = null
  const normalizeCountryLabel = (code, fallbackLabel) => {
    const normalizedCode = (code || '').toLowerCase()
    if (normalizedCode === 'il' || normalizedCode === 'ps') return 'Occupied Palestine'
    return fallbackLabel
  }

  return {
    build: {
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
            if (id.includes('node_modules/jspdf')) {
              return 'jspdf-vendor'
            }
          },
        },
      },
    },
    plugins: [
      react(),
      {
        name: 'current-affairs-worldnewsapi-middleware',
        configureServer(server) {
          server.middlewares.use('/api/current-affairs', async (req, res) => {
            try {
              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing WORLDNEWSAPI_KEY in .env.local' }))
                return
              }

              const url = new URL(req.originalUrl || req.url || '', 'http://localhost')
              const q = (url.searchParams.get('q') || 'pakistan').trim() || 'pakistan'
              const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get('pageSize') || 24) || 24))
              const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
              const feed = (url.searchParams.get('feed') || 'top').trim().toLowerCase()
              const offset = (page - 1) * pageSize
              const earliest = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ')

              const normalize = (item) => ({
                title: item?.title || '',
                url: item?.url || '',
                publishedAt: item?.publish_date || '',
                urlToImage: item?.image || '',
                description: item?.summary || '',
                source: { name: item?.source_country || '' },
              })

              let upstreamUrl = ''
              if (feed === 'top') {
                upstreamUrl =
                  'https://api.worldnewsapi.com/top-news?' +
                  new URLSearchParams({
                    'source-country': 'pk',
                    language: 'en',
                  }).toString()
              } else {
                const params = new URLSearchParams({
                  'source-country': 'pk',
                  language: 'en',
                  sort: 'publish-time',
                  offset: String(offset),
                  number: String(pageSize),
                  'earliest-publish-date': earliest,
                })
                if (feed === 'politics') params.set('categories', 'politics')
                if (q) params.set('text', q)
                upstreamUrl = `https://api.worldnewsapi.com/search-news?${params.toString()}`
              }

              const upstream = await fetch(upstreamUrl, {
                headers: { 'x-api-key': apiKey, Accept: 'application/json' },
              })

              const text = await upstream.text()
              res.setHeader('Content-Type', 'application/json')
              if (!upstream.ok) {
                res.statusCode = upstream.status
                res.end(text || JSON.stringify({ error: `Upstream error ${upstream.status}` }))
                return
              }

              const parsed = text ? JSON.parse(text) : {}
              if (feed === 'top') {
                const clusters = Array.isArray(parsed?.top_news) ? parsed.top_news : []
                const flattened = []
                const seen = new Set()
                clusters.forEach((cluster) => {
                  const clusterNews = Array.isArray(cluster?.news) ? cluster.news : []
                  clusterNews.forEach((item) => {
                    const urlValue = item?.url || ''
                    if (!urlValue || seen.has(urlValue)) return
                    seen.add(urlValue)
                    flattened.push(normalize(item))
                  })
                })
                res.statusCode = 200
                res.end(JSON.stringify({ totalResults: flattened.length, articles: flattened.slice(0, pageSize) }))
                return
              }

              const news = Array.isArray(parsed?.news) ? parsed.news : []
              const totalResults = typeof parsed?.available === 'number' ? parsed.available : 0
              res.statusCode = 200
              res.end(JSON.stringify({ totalResults, articles: news.map(normalize) }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Dev server error' }))
            }
          })
        },
      },
      {
        name: 'global-affairs-worldnewsapi-middleware',
        configureServer(server) {
          server.middlewares.use('/api/global-affairs', async (req, res) => {
            try {
              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing WORLDNEWSAPI_KEY in .env.local' }))
                return
              }

              const url = new URL(req.originalUrl || req.url || '', 'http://localhost')
              const q = (url.searchParams.get('q') || 'global').trim() || 'global'
              const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get('pageSize') || 24) || 24))
              const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
              const offset = (page - 1) * pageSize
              const earliest = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 19)
                .replace('T', ' ')

              const upstreamUrl =
                'https://api.worldnewsapi.com/search-news?' +
                new URLSearchParams({
                  text: q,
                  language: 'en',
                  sort: 'publish-time',
                  offset: String(offset),
                  number: String(pageSize),
                  'earliest-publish-date': earliest,
                }).toString()

              const upstream = await fetch(upstreamUrl, {
                headers: { 'x-api-key': apiKey, Accept: 'application/json' },
              })

              const text = await upstream.text()
              res.setHeader('Content-Type', 'application/json')
              if (!upstream.ok) {
                res.statusCode = upstream.status
                res.end(text || JSON.stringify({ error: `Upstream error ${upstream.status}` }))
                return
              }

              const parsed = text ? JSON.parse(text) : {}
              const news = Array.isArray(parsed?.news) ? parsed.news : []
              const totalResults = typeof parsed?.available === 'number' ? parsed.available : 0
              const normalize = (item) => ({
                title: item?.title || '',
                url: item?.url || '',
                publishedAt: item?.publish_date || '',
                urlToImage: item?.image || '',
                description: item?.summary || '',
                source: { name: item?.source_country || '' },
              })

              res.statusCode = 200
              res.end(JSON.stringify({ totalResults, articles: news.map(normalize) }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Dev server error' }))
            }
          })
        },
      },
      {
        name: 'global-conflicts-worldnewsapi-middleware',
        configureServer(server) {
          server.middlewares.use('/api/global-conflicts', async (req, res) => {
            try {
              if (!apiKey) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Missing WORLDNEWSAPI_KEY in .env.local' }))
                return
              }

              const ensureCoordMap = async () => {
                if (countryCoordCache) return countryCoordCache
                const countryRes = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,latlng', {
                  headers: { Accept: 'application/json' },
                })
                if (!countryRes.ok) throw new Error(`Country endpoint returned ${countryRes.status}`)
                const rows = await countryRes.json()
                const map = new Map()
                ;(Array.isArray(rows) ? rows : []).forEach((row) => {
                  const code = typeof row?.cca2 === 'string' ? row.cca2.toLowerCase() : ''
                  const lat = Array.isArray(row?.latlng) ? Number(row.latlng[0]) : NaN
                  const lon = Array.isArray(row?.latlng) ? Number(row.latlng[1]) : NaN
                  const countryName = normalizeCountryLabel(code, row?.name?.common || code.toUpperCase())
                  if (!code || !Number.isFinite(lat) || !Number.isFinite(lon)) return
                  map.set(code, { lat, lon, countryName })
                })
                countryCoordCache = map
                return map
              }

              const upstreamUrl =
                'https://api.worldnewsapi.com/search-news?' +
                new URLSearchParams({
                  text: 'war',
                  language: 'en',
                  sort: 'publish-time',
                  number: '100',
                  'earliest-publish-date': new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 19)
                    .replace('T', ' '),
                }).toString()

              const upstream = await fetch(upstreamUrl, {
                headers: { 'x-api-key': apiKey, Accept: 'application/json' },
              })
              const text = await upstream.text()
              res.setHeader('Content-Type', 'application/json')
              if (!upstream.ok) {
                res.statusCode = upstream.status
                res.end(text || JSON.stringify({ error: `Upstream error ${upstream.status}` }))
                return
              }
              const parsed = text ? JSON.parse(text) : {}
              const articles = Array.isArray(parsed?.news) ? parsed.news : []
              const coordMap = await ensureCoordMap()
              const countries = new Map()

              articles.forEach((article) => {
                const code = typeof article?.source_country === 'string' ? article.source_country.toLowerCase() : ''
                if (!code) return
                const coord = coordMap.get(code)
                if (!coord) return

                const countryId = `country_${code}`
                const current =
                  countries.get(countryId) ||
                  {
                    countryId,
                    country: coord.countryName || code.toUpperCase(),
                    lat: coord.lat,
                    lon: coord.lon,
                    conflicts: [],
                  }

                const conflictId = article?.url || `${countryId}_${current.conflicts.length + 1}`
                if (!current.conflicts.some((item) => item.id === conflictId)) {
                  current.conflicts.push({
                    id: conflictId,
                    title: article?.title || 'Conflict update',
                    summary: article?.summary || article?.text || 'No summary available yet.',
                    startedAt: article?.publish_date || '',
                    country: current.country,
                    articleUrl: article?.url || '',
                  })
                }

                countries.set(countryId, current)
              })

              const result = Array.from(countries.values())
                .filter((country) => Number.isFinite(country.lat) && Number.isFinite(country.lon) && country.conflicts.length > 0)
                .sort((a, b) => b.conflicts.length - a.conflicts.length)
                .slice(0, 80)

              res.statusCode = 200
              res.end(JSON.stringify({ countries: result }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Dev server error' }))
            }
          })
        },
      },
      {
        name: 'stripe-payment-middleware',
        configureServer(server) {
          Object.assign(process.env, env)
          server.middlewares.use('/api/create-checkout-session', async (req, res) => {
            await handleCreateCheckoutSession(req, res)
          })
          server.middlewares.use('/api/stripe-webhook', async (req, res) => {
            await handleStripeWebhook(req, res)
          })
          server.middlewares.use('/api/verify-checkout-session', async (req, res) => {
            await handleVerifyCheckoutSession(req, res)
          })
          server.middlewares.use('/api/redeem-voucher', async (req, res) => {
            await handleRedeemVoucher(req, res)
          })
        },
      },
    ],
    server: {
      host: true,
      port: 5173,
    },
  }
})
