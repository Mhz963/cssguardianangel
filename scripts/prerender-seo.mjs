// After `vite build`: write a copy of dist/index.html for every public page, with that page's own title,
// description, canonical link, Open Graph tags and structured data already in the <head>.
// Google renders the SPA either way; this is for crawlers and link previews that don't run JavaScript
// (Bing, WhatsApp, Facebook, LinkedIn), which otherwise see the home page's tags on every URL.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { resolveRouteSeo, routeJsonLd } from '../src/seo/routeSeo.js'

const origin = String(process.env.VITE_PUBLIC_SITE_URL || 'https://www.cssguardianangel.com').replace(/\/+$/, '')
const dist = 'dist'
const template = readFileSync(join(dist, 'index.html'), 'utf8')

const sitemap = readFileSync(join('public', 'sitemap.xml'), 'utf8')
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
paths.push('/signin')

const attr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const text = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function setMeta(html, key, value, kind = 'name') {
  const re = new RegExp(`(<meta\\s+${kind}="${key}"\\s+content=")[^"]*(")`)
  const multi = new RegExp(`(<meta\\s+${kind}="${key}"\\s*\\n\\s*content=")[^"]*(")`)
  if (re.test(html)) return html.replace(re, `$1${attr(value)}$2`)
  if (multi.test(html)) return html.replace(multi, `$1${attr(value)}$2`)
  throw new Error(`meta ${kind}=${key} not found in index.html`)
}

let written = 0
for (const path of [...new Set(paths)]) {
  const seo = resolveRouteSeo(path)
  const url = `${origin}${path === '/' ? '/' : path}`
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${text(seo.title)}</title>`)
  html = setMeta(html, 'description', seo.description)
  html = setMeta(html, 'og:title', seo.title, 'property')
  html = setMeta(html, 'og:description', seo.description, 'property')
  html = setMeta(html, 'og:url', url, 'property')
  html = setMeta(html, 'twitter:title', seo.title)
  html = setMeta(html, 'twitter:description', seo.description)
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${attr(url)}" />`)
  const blocks = routeJsonLd(path, origin)
    .map((data) => `<script type="application/ld+json" data-route-jsonld="true">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ')
  html = html.replace('<!--route-seo-->', blocks)

  const file = path === '/' ? join(dist, 'index.html') : join(dist, path.replace(/^\//, ''), 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  written += 1
}
console.log(`[seo] pre-rendered <head> for ${written} pages`)
