const WORLD_NEWS_SEARCH_ENDPOINT = 'https://api.worldnewsapi.com/search-news'

function clampPageSize(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 24
  return Math.max(1, Math.min(50, Math.floor(num)))
}

function clampPage(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 1
  return Math.max(1, Math.floor(num))
}

function isoDateTimeDaysAgo(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

function normalizeWorldNewsItem(item) {
  return {
    title: item?.title || '',
    url: item?.url || '',
    publishedAt: item?.publish_date || '',
    urlToImage: item?.image || '',
    description: item?.summary || '',
    source: { name: item?.source_country || '' },
  }
}

export default async function handler(req, res) {
  try {
    const apiKey = process.env.WORLDNEWSAPI_KEY
    if (!apiKey) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Missing WORLDNEWSAPI_KEY server configuration.' }))
      return
    }

    const qRaw = typeof req.query?.q === 'string' ? req.query.q : ''
    const q = qRaw.trim() || 'global'
    const pageSize = clampPageSize(req.query?.pageSize)
    const page = clampPage(req.query?.page)
    const offset = (page - 1) * pageSize

    const url = new URL(WORLD_NEWS_SEARCH_ENDPOINT)
    if (q) url.searchParams.set('text', q)
    url.searchParams.set('language', 'en')
    url.searchParams.set('sort', 'publish-time')
    url.searchParams.set('offset', String(offset))
    url.searchParams.set('number', String(pageSize))
    url.searchParams.set('earliest-publish-date', isoDateTimeDaysAgo(2))

    const upstream = await fetch(url.toString(), {
      headers: {
        'x-api-key': apiKey,
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

    const parsed = bodyText ? JSON.parse(bodyText) : {}
    const news = Array.isArray(parsed?.news) ? parsed.news : []
    const totalResults = typeof parsed?.available === 'number' ? parsed.available : 0

    const response = {
      totalResults,
      articles: news.map(normalizeWorldNewsItem),
    }

    res.statusCode = 200
    res.end(JSON.stringify(response))
  } catch (error) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error?.message || 'Server error' }))
  }
}

