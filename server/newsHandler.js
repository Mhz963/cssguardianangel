// Guardian News Desk: latest Pakistan and world headlines from public RSS feeds.
// No API keys and no quotas: outlets publish these feeds for exactly this use. Responses are cached
// by Vercel's CDN (s-maxage), so each outlet is contacted at most a few times an hour however many
// people visit. Every item links to the original article on the publisher's site.

const FEEDS = [
  // Pakistan
  { region: 'pakistan', source: 'Dawn', url: 'https://www.dawn.com/feeds/home' },
  { region: 'pakistan', source: 'Dawn', url: 'https://www.dawn.com/feeds/pakistan' },
  { region: 'pakistan', source: 'Dawn', url: 'https://www.dawn.com/feeds/business', topic: 'economy' },
  { region: 'pakistan', source: 'The Express Tribune', url: 'https://tribune.com.pk/feed/pakistan' },
  { region: 'pakistan', source: 'The News', url: 'https://www.thenews.com.pk/rss/1/1' },
  // Business Recorder's feed is mostly global markets: keep only Pakistan-related items.
  { region: 'pakistan', source: 'Business Recorder', url: 'https://www.brecorder.com/feeds/latest-news', topic: 'economy', pakistanOnly: true },
  { region: 'pakistan', source: 'APP', url: 'https://www.app.com.pk/feed/' },
  { region: 'pakistan', source: 'Geo News', url: 'https://www.geo.tv/rss/1/1' },
  // World
  { region: 'world', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { region: 'world', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml' },
  { region: 'world', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml' },
  { region: 'world', source: 'BBC News', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', topic: 'technology' },
  { region: 'world', source: 'The Guardian', url: 'https://www.theguardian.com/environment/rss', topic: 'climate' },
  { region: 'world', source: 'The Guardian', url: 'https://www.theguardian.com/global-development/rss' },
  { region: 'world', source: 'UN News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
  { region: 'world', source: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  { region: 'world', source: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { region: 'world', source: 'DW', url: 'https://rss.dw.com/rdf/rss-en-world' },
  { region: 'world', source: 'NPR', url: 'https://feeds.npr.org/1004/rss.xml' },
]

// Topics that matter for CSS papers, matched on headline and summary words.
const TOPIC_RULES = [
  ['economy', /\b(econom|imf|budget|inflation|gdp|tax|tariff|trade|export|import|rupee|dollar|bank|sbp|stock|psx|market|debt|loan|investment|fiscal|revenue|petrol|price|ipo|business)/i],
  ['security', /\b(militan|terror|attack|army|military|ispr|soldier|security forces|operation|blast|bomb|killed|police|ttp|insurgen|missile|drone|war|ceasefire|strike|troops|defence|defense)/i],
  ['diplomacy', /\b(foreign minister|fo spokes|diplomat|summit|bilateral|talks|treaty|un general assembly|security council|ambassador|visit to|sco|saarc|oic|nato|brics|sanction|envoy|accord|agreement)/i],
  ['climate', /\b(climate|flood|heatwave|heat wave|monsoon|drought|smog|pollution|emission|glacier|cop\d|environment|earthquake|cyclone|wildfire|carbon|water crisis|dam)/i],
  ['governance', /\b(parliament|national assembly|senate|election|ecp|supreme court|high court|cabinet|prime minister|president|governor|chief minister|amendment|constitution|bill|ordinance|court|judge|party|ppp|pml|pti|government|minister|policy)/i],
  ['technology', /\b(\bai\b|artificial intelligence|tech|cyber|internet|digital|software|satellite|space|nuclear power|5g|startup|it exports)/i],
  ['science', /\b(health|polio|dengue|vaccine|disease|outbreak|who\b|science|research|scientist|medical|hospital|education|university|school)/i],
]

const PAKISTAN_WORDS = /\b(pakistan|pakistani|psx|kse|sbp|state bank|rupee|karachi|lahore|islamabad|punjab|sindh|khyber|balochistan|ogra|nepra|ecc|fbr)\b/i

const UA = 'GuardianAngelNewsDesk/1.0 (+https://www.cssguardianangel.com)'

const decode = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'))
  return m ? m[1] : ''
}

function attr(block, name, attribute) {
  const m = block.match(new RegExp(`<${name}\\b[^>]*\\b${attribute}=["']([^"']+)["']`, 'i'))
  return m ? m[1] : ''
}

function imageOf(block) {
  const direct =
    attr(block, 'media:content', 'url') || attr(block, 'media:thumbnail', 'url') || attr(block, 'enclosure', 'url')
  if (direct && /\.(jpe?g|png|webp|gif)(\?|$)|images|img|media/i.test(direct)) return direct.replace(/&amp;/g, '&')
  const inline = tag(block, 'description').match(/<img[^>]+src=["']([^"']+)["']/i) || tag(block, 'content:encoded').match(/<img[^>]+src=["']([^"']+)["']/i)
  return inline ? inline[1].replace(/&amp;/g, '&') : ''
}

function topicsOf(text, feedTopic) {
  const found = TOPIC_RULES.filter(([, re]) => re.test(text)).map(([t]) => t)
  if (feedTopic && !found.includes(feedTopic)) found.unshift(feedTopic)
  return found.slice(0, 3)
}

function parseFeed(xml, feed) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0])
  return blocks
    .map((b) => {
      const title = decode(tag(b, 'title'))
      let url = decode(tag(b, 'link')) || attr(b, 'link', 'href')
      if (!/^https?:/i.test(url)) url = decode(tag(b, 'guid'))
      const summary = decode(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content')).slice(0, 280)
      const rawDate = decode(tag(b, 'pubDate') || tag(b, 'dc:date') || tag(b, 'updated') || tag(b, 'published'))
      const date = new Date(rawDate)
      return {
        title,
        url,
        summary: summary === title ? '' : summary,
        source: feed.source,
        region: feed.region,
        date: Number.isNaN(date.getTime()) ? null : date.toISOString(),
        image: imageOf(b),
        topics: topicsOf(`${title} ${summary}`, feed.topic),
      }
    })
    .filter((i) => i.title && /^https?:/i.test(i.url))
    .filter((i) => !feed.pakistanOnly || PAKISTAN_WORDS.test(`${i.title} ${i.summary}`))
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
      signal: AbortSignal.timeout(6000), // stay well inside the function time limit
    })
    if (!res.ok) return { feed, items: [], ok: false }
    return { feed, items: parseFeed(await res.text(), feed), ok: true }
  } catch {
    return { feed, items: [], ok: false }
  }
}

const normTitle = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').slice(0, 70)

export async function buildNews() {
  const results = await Promise.all(FEEDS.map(fetchFeed))
  const seenUrl = new Set()
  const seenTitle = new Set()
  const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000
  const items = results
    .flatMap((r) => r.items)
    .filter((i) => !i.date || new Date(i.date).getTime() > cutoff)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .filter((i) => {
      const u = i.url.split('?')[0]
      const t = normTitle(i.title)
      if (seenUrl.has(u) || seenTitle.has(t)) return false
      seenUrl.add(u)
      seenTitle.add(t)
      return true
    })
  const pick = (region) => items.filter((i) => i.region === region).slice(0, 90)
  return {
    updatedAt: new Date().toISOString(),
    pakistan: pick('pakistan'),
    world: pick('world'),
    sources: results.map((r) => ({ source: r.feed.source, url: r.feed.url, region: r.feed.region, ok: r.ok, count: r.items.length })),
  }
}

export async function handleNews(req, res) {
  try {
    const data = await buildNews()
    const total = data.pakistan.length + data.world.length
    res.statusCode = total ? 200 : 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    // CDN cache: fresh for 15 minutes, then served stale for up to an hour while it refreshes.
    res.setHeader('Cache-Control', total ? 'public, s-maxage=900, stale-while-revalidate=3600' : 'no-store')
    res.end(JSON.stringify(data))
  } catch {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ error: 'Headlines could not be loaded right now.' }))
  }
}
