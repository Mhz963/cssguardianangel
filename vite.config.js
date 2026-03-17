import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.WORLDNEWSAPI_KEY || ''

  return {
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
              const q = (url.searchParams.get('q') || 'global').trim() || 'global'
              const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get('pageSize') || 24) || 24))
              const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
              const offset = (page - 1) * pageSize
              const earliest = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()

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

              res.statusCode = 200
              res.end(
                JSON.stringify({
                  totalResults,
                  articles: news.map((item) => ({
                    title: item?.title || '',
                    url: item?.url || '',
                    publishedAt: item?.publish_date || '',
                    urlToImage: item?.image || '',
                    description: item?.summary || '',
                    source: { name: item?.source_country || '' },
                  })),
                }),
              )
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: error?.message || 'Dev server error' }))
            }
          })
        },
      },
    ],
    server: {
      // handled by middleware above
    },
  }
})
