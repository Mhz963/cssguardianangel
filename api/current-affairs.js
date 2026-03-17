const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything'

function clampPageSize(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 24
  return Math.max(1, Math.min(50, Math.floor(num)))
}

function isoDaysAgo(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

export default async function handler(req, res) {
  try {
    const apiKey = process.env.NEWSAPI_KEY
    if (!apiKey) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing NEWSAPI_KEY server configuration.' }))
      return
    }

    const qRaw = typeof req.query?.q === 'string' ? req.query.q : ''
    const q = qRaw.trim() || 'global'
    const pageSize = clampPageSize(req.query?.pageSize)

    const url = new URL(NEWS_API_ENDPOINT)
    url.searchParams.set('q', q)
    url.searchParams.set('language', 'en')
    url.searchParams.set('sortBy', 'publishedAt')
    url.searchParams.set('pageSize', String(pageSize))
    url.searchParams.set('from', isoDaysAgo(2))

    const upstream = await fetch(url.toString(), {
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    })

    const bodyText = await upstream.text()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

    if (!upstream.ok) {
      res.statusCode = upstream.status
      res.end(bodyText || JSON.stringify({ error: `Upstream error ${upstream.status}` }))
      return
    }

    res.statusCode = 200
    res.end(bodyText)
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error?.message || 'Server error' }))
  }
}

