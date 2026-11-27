// Builds public/data/conflicts.json for the Guardian Conflict Atlas.
// Run by .github/workflows/conflicts.yml every 6 hours (and by hand: npm run build:conflicts).
// Visitors only ever read the cached JSON, so no API quota can run out on the live site.
//
// Free, keyless sources:
//   Wikipedia  "List of ongoing armed conflicts": the list, intensity, start year, countries, fatalities
//   Wikipedia  REST page summary: short description of each conflict
//   Wikidata   participants (P710) of each conflict: the sides involved
//   GDELT      DOC 2.0 API: latest English headlines (7 days)
//   Google News RSS: fallback for headlines when GDELT rate-limits the job
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join('public', 'data', 'conflicts.json')
const COUNTRIES = JSON.parse(readFileSync(join('public', 'data', 'world-countries.json'), 'utf8')).countries
const UA = 'GuardianAngelConflictAtlas/1.0 (https://www.cssguardianangel.com; educational, cached every 6 hours)'
const LIST_PAGE = 'List_of_ongoing_armed_conflicts'
const LIST_URL = `https://en.wikipedia.org/wiki/${LIST_PAGE}`
const TIERS = ['Major war', 'Minor war', 'Conflict', 'Skirmishes and clashes']
const GDELT_GAP_MS = 5500 // GDELT asks for one request every 5 seconds
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let lastStatus = 0

async function getJson(url, { tries = 3, timeoutMs = 25000, backoffMs = 1500 } = {}) {
  for (let i = 1; i <= tries; i += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      })
      lastStatus = res.status
      if (res.ok) {
        const text = await res.text()
        return text ? JSON.parse(text) : null
      }
      if (res.status === 404) return null
    } catch {
      lastStatus = 0
    }
    if (i < tries) await sleep(backoffMs * i)
  }
  return null
}

function readPrevious() {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'))
    return new Map((prev.conflicts || []).map((c) => [c.id, c]))
  } catch {
    return new Map()
  }
}

const decode = (s) =>
  String(s || '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<sup[\s\S]*?<\/sup>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim()

const links = (html) =>
  [...String(html).matchAll(/<a [^>]*href="\/wiki\/([^"#]+)[^"]*"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ page: decodeURIComponent(m[1]), text: decode(m[2]) }))
    .filter((l) => l.text && !l.page.includes(':'))

/** Display rule for this site: Israel is shown as Occupied Palestine (merged with Palestine). */
function displayCountry(name) {
  return /^(Israel|Palestine|State of Palestine|Gaza Strip|West Bank)$/i.test(name) ? 'Occupied Palestine' : name
}

function findCountry(name) {
  const n = name.toLowerCase()
  return COUNTRIES.find((c) => c.names.some((x) => x.toLowerCase() === n)) || null
}

function parseList(html) {
  const tables = [...html.matchAll(/<table class="wikitable[^"]*"[\s\S]*?<\/table>/g)].map((m) => m[0])
  const conflicts = []
  tables.slice(0, TIERS.length).forEach((table, tierIndex) => {
    const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => m[0])
    const header = [...rows[0].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => decode(m[1]))
    const col = (label) => header.findIndex((h) => h.toLowerCase().includes(label))
    const iStart = col('start')
    const iName = header.findIndex((h) => h.toLowerCase() === 'conflict')
    const iLoc = col('location')
    const iCum = col('cumulative')
    const yearCols = header.map((h, i) => ({ h, i })).filter((x) => /^\d{4} fatalities/i.test(x.h))
    rows.slice(1).forEach((row) => {
      const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => m[1])
      if (cells.length < header.length - 1) return
      const nameLinks = links(cells[iName])
      if (!nameLinks.length) return
      const main = nameLinks[0]
      const lines = decode(cells[iName].replace(/<br\s*\/?>|<\/li>|<\/p>/g, '\n'))
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      const countries = [...new Set(links(cells[iLoc]).map((l) => l.text).filter((t) => findCountry(t)))]
      if (!countries.length) return
      const fatalities = {}
      yearCols.forEach(({ h, i }) => {
        const v = decode(cells[i])
        if (v) fatalities[h.slice(0, 4)] = v
      })
      conflicts.push({
        id: main.page.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        name: lines[0] || main.text,
        article: main.page,
        includes: lines.slice(1, 7),
        intensity: TIERS[tierIndex],
        tier: tierIndex,
        started: decode(cells[iStart]),
        countries,
        cumulativeFatalities: decode(cells[iCum]) || null,
        fatalitiesByYear: fatalities,
      })
    })
  })
  const seen = new Set()
  return conflicts.filter((c) => (seen.has(c.id) ? false : seen.add(c.id)))
}

/** Place each conflict at its first country's label point; nudge points that would overlap. */
function place(conflicts) {
  const used = new Map()
  conflicts.forEach((c) => {
    const country = findCountry(c.countries[0])
    const key = country.label
    const n = used.get(key) || 0
    used.set(key, n + 1)
    const angle = n * 2.4
    const r = n ? 0.7 + n * 0.18 : 0
    c.lat = Number((country.lat + r * Math.sin(angle)).toFixed(3))
    c.lng = Number((country.lng + r * Math.cos(angle)).toFixed(3))
  })
}

async function wikidataParties(qids) {
  const parties = {}
  const ids = [...new Set(qids.filter(Boolean))]
  const entities = {}
  for (let i = 0; i < ids.length; i += 40) {
    const data = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.slice(i, i + 40).join('|')}&props=claims&format=json`,
    )
    Object.assign(entities, data?.entities || {})
  }
  const partyIds = new Set()
  Object.entries(entities).forEach(([qid, e]) => {
    const list = (e.claims?.P710 || []).map((cl) => cl.mainsnak?.datavalue?.value?.id).filter(Boolean)
    parties[qid] = list.slice(0, 12)
    list.forEach((id) => partyIds.add(id))
  })
  const labels = {}
  const all = [...partyIds]
  for (let i = 0; i < all.length; i += 50) {
    const data = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${all.slice(i, i + 50).join('|')}&props=labels&languages=en&format=json`,
    )
    Object.entries(data?.entities || {}).forEach(([id, e]) => {
      if (e.labels?.en?.value) labels[id] = e.labels.en.value
    })
  }
  const out = {}
  Object.entries(parties).forEach(([qid, list]) => {
    out[qid] = [...new Set(list.map((id) => labels[id]).filter(Boolean).map(displayCountry))]
  })
  return out
}

function gdeltQuery(c) {
  const name = c.name.replace(/\([^)]*\)/g, '').replace(/[–—]/g, ' ').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim()
  const words = name.split(' ').filter((w) => w.length > 2)
  const phrase = words.length >= 2 ? `"${words.slice(0, 4).join(' ')}"` : `"${c.countries[0]}" (war OR conflict OR clashes)`
  return `${phrase} sourcelang:english`
}

async function headlines(c) {
  const tryQuery = async (q) => {
    const data = await getJson(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=ArtList&format=json&maxrecords=5&timespan=7d&sort=DateDesc`,
      { tries: 2, timeoutMs: 20000, backoffMs: 12000 },
    )
    if (!data) return null
    return (data.articles || [])
      .filter((a) => a.url && a.title)
      .map((a) => ({
        title: a.title.trim(),
        url: a.url,
        source: a.domain || '',
        date: a.seendate ? `${a.seendate.slice(0, 4)}-${a.seendate.slice(4, 6)}-${a.seendate.slice(6, 8)}` : '',
      }))
  }
  let items = await tryQuery(gdeltQuery(c))
  if (items === null) return null // GDELT unavailable or rate-limited
  if (!items.length) {
    await sleep(GDELT_GAP_MS)
    items = (await tryQuery(`"${c.countries[0]}" (war OR conflict OR clashes OR insurgency) sourcelang:english`)) || []
  }
  const seen = new Set()
  return items.filter((a) => (seen.has(a.title) ? false : seen.add(a.title))).slice(0, 4)
}

function rssText(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  return m ? decode(m[1].replace(/<!\[CDATA\[|\]\]>/g, '')) : ''
}

/** Fallback headlines from Google News RSS (keyless). */
async function rssSearch(q) {
  try {
    const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-GB&gl=GB&ceid=GB:en`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 4)
      .map((m) => {
        const item = m[1]
        const source = rssText(item, 'source')
        let title = rssText(item, 'title')
        if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3))
        const date = new Date(rssText(item, 'pubDate'))
        return { title, url: rssText(item, 'link'), source, date: Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10) }
      })
      .filter((a) => a.title && a.url)
  } catch {
    return []
  }
}

/** Fallback headlines from Google News RSS (keyless): exact name first, then country + conflict words. */
async function rssHeadlines(c) {
  const name = c.name.replace(/\([^)]*\)/g, '').replace(/[–—/]/g, ' ').replace(/\s+/g, ' ').trim()
  let items = await rssSearch(`"${name}" when:7d`)
  if (!items.length) {
    await sleep(600)
    const place = c.countries[0] === 'Occupied Palestine' ? 'Gaza OR Palestine' : `"${c.countries[0]}"`
    items = await rssSearch(`(${place}) (war OR conflict OR insurgency OR clashes OR militants OR attack) when:7d`)
  }
  return items
}

async function main() {
  const parsed = await getJson(
    `https://en.wikipedia.org/w/api.php?action=parse&page=${LIST_PAGE}&prop=text|revid&format=json&formatversion=2`,
  )
  if (!parsed?.parse?.text) throw new Error('Could not load the Wikipedia conflict list')
  const conflicts = parseList(parsed.parse.text)
  if (conflicts.length < 10) throw new Error(`Only ${conflicts.length} conflicts parsed; refusing to overwrite`)
  place(conflicts)

  for (const c of conflicts) {
    const s = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(c.article)}`)
    c.summary = s?.extract || ''
    c.wikidata = s?.wikibase_item || null
    c.sources = [{ label: 'Wikipedia', url: s?.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${c.article}` }]
    c.countries = [...new Set(c.countries.map(displayCountry))]
  }
  const parties = await wikidataParties(conflicts.map((c) => c.wikidata))
  conflicts.forEach((c) => {
    c.sides = parties[c.wikidata] || []
    if (c.wikidata) c.sources.push({ label: 'Wikidata', url: `https://www.wikidata.org/wiki/${c.wikidata}` })
    c.sources.push({ label: 'List of ongoing armed conflicts', url: LIST_URL })
  })

  // Headlines for every conflict, spaced to respect GDELT's rate limit. If GDELT is unavailable,
  // keep the previous run's headlines rather than blanking them.
  const previous = readPrevious()
  let failures = process.env.HEADLINES === 'rss' ? 3 : 0 // HEADLINES=rss skips GDELT
  let fresh = 0
  for (const [i, c] of conflicts.entries()) {
    let news = null
    let via = 'GDELT news search'
    if (!SKIP_GDELT && failures >= 3) {
      await sleep(800)
      news = await rssHeadlines(c)
      via = 'Google News'
      if (news.length) fresh += 1
    } else if (!SKIP_GDELT) {
      if (i) await sleep(GDELT_GAP_MS)
      news = await headlines(c)
      if (news === null) {
        failures += 1
        console.log(`[conflicts] GDELT failed for ${c.name} (status ${lastStatus || 'timeout'})`)
      } else {
        failures = 0
        fresh += 1
      }
    }
    if (news && !news.length && via === 'Google News') news = null
    const prev = previous.get(c.id)
    c.news = news ?? prev?.news ?? []
    c.newsVia = news ? via : prev?.newsVia || via
    if (c.news.length) {
      c.sources.push(
        c.newsVia === 'Google News'
          ? { label: 'Google News', url: 'https://news.google.com/' }
          : { label: 'GDELT news search', url: 'https://www.gdeltproject.org/' },
      )
    }
  }
  if (failures >= 3) console.log('[conflicts] GDELT kept failing; used Google News RSS for the rest')
  console.log(`[conflicts] fresh headlines for ${fresh}/${conflicts.length} conflicts`)

  const out = {
    updatedAt: new Date().toISOString(),
    listRevision: parsed.parse.revid || null,
    sources: [
      { label: 'Wikipedia: List of ongoing armed conflicts', url: LIST_URL },
      { label: 'Wikidata (sides involved)', url: 'https://www.wikidata.org/' },
      { label: 'GDELT Project (latest headlines)', url: 'https://www.gdeltproject.org/' },
      { label: 'Google News (headline fallback)', url: 'https://news.google.com/' },
    ],
    conflicts: conflicts.map(({ article, ...c }) => c),
  }
  mkdirSync(join('public', 'data'), { recursive: true })
  writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n')
  const counts = TIERS.map((t) => `${t}: ${conflicts.filter((c) => c.intensity === t).length}`).join(', ')
  console.log(`[conflicts] wrote ${conflicts.length} conflicts (${counts})`)
}

const SKIP_GDELT = process.env.SKIP_GDELT === "1"
main().catch((error) => {
  console.error(`[conflicts] ${error.message}`)
  process.exit(1)
})
