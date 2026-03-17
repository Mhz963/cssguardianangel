const WORLD_NEWS_SEARCH_ENDPOINT = 'https://api.worldnewsapi.com/search-news'
const REST_COUNTRIES_ENDPOINT = 'https://restcountries.com/v3.1/all?fields=name,cca2,latlng'
let countryCoordCache = null

function normalizeCountryLabel(code, fallbackLabel) {
  const normalizedCode = (code || '').toLowerCase()
  if (normalizedCode === 'il' || normalizedCode === 'ps') return 'Occupied Palestine'
  return fallbackLabel
}

async function getCountryCoordinateMap() {
  if (countryCoordCache) return countryCoordCache
  const res = await fetch(REST_COUNTRIES_ENDPOINT, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Country endpoint returned ${res.status}`)
  const rows = await res.json()
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

function isoDateTimeDaysAgo(days) {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 19).replace('T', ' ')
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

    const query = new URLSearchParams({
      text: 'war',
      language: 'en',
      sort: 'publish-time',
      number: '100',
      'earliest-publish-date': isoDateTimeDaysAgo(21),
    }).toString()

    const upstream = await fetch(`${WORLD_NEWS_SEARCH_ENDPOINT}?${query}`, {
      headers: {
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    })

    const text = await upstream.text()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

    if (!upstream.ok) {
      res.statusCode = upstream.status
      res.end(text || JSON.stringify({ error: `Upstream error ${upstream.status}` }))
      return
    }

    const parsed = text ? JSON.parse(text) : {}
    const articles = Array.isArray(parsed?.news) ? parsed.news : []
    const coordMap = await getCountryCoordinateMap()
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
    res.end(JSON.stringify({ error: error?.message || 'Server error' }))
  }
}

