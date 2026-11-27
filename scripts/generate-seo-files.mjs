// Writes public/robots.txt and public/sitemap.xml for the canonical site origin.
// Runs before every build (see package.json "build"). Origin: VITE_PUBLIC_SITE_URL or https://www.cssguardianangel.com.
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { compulsorySubjects, optionalGroups, slugify } from '../src/data/syllabusData.js'

const origin = String(process.env.VITE_PUBLIC_SITE_URL || 'https://www.cssguardianangel.com').replace(/\/+$/, '')
const today = new Date().toISOString().slice(0, 10)

const pages = [
  ['/', 'daily', '1.0'],
  ['/css-syllabus', 'weekly', '0.9'],
  ['/css-rules', 'monthly', '0.8'],
  ['/css-past-papers', 'weekly', '0.9'],
  ['/css-study-material', 'weekly', '0.9'],
  ['/key-documents', 'monthly', '0.8'],
  ['/global-affairs', 'daily', '0.8'],
  ['/pakistan-affairs', 'daily', '0.8'],
  ['/blogs', 'weekly', '0.8'],
  ['/guardian-english', 'weekly', '0.9'],
  ['/guardian-english/grammar', 'monthly', '0.7'],
  ['/guardian-english/punctuation', 'monthly', '0.7'],
  ['/guardian-english/sentence-correction', 'monthly', '0.7'],
  ['/guardian-english/pairs-of-words', 'monthly', '0.7'],
  ['/guardian-english/synonyms-antonyms', 'monthly', '0.7'],
  ['/guardian-english/vocabulary', 'monthly', '0.7'],
  ['/guardian-english/past-papers', 'monthly', '0.7'],
  ['/guardian-conflict-atlas', 'daily', '0.8'],
  ['/guardian-study-planner', 'monthly', '0.7'],
  ['/guardian-portfolio', 'weekly', '0.7'],
  ['/guardian-portfolio/browse', 'daily', '0.6'],
  ['/guardian-portfolio/example', 'monthly', '0.4'],
  ['/about-guardian-angel', 'monthly', '0.6'],
  ['/privacy-policy', 'yearly', '0.3'],
  ['/terms', 'yearly', '0.3'],
  ['/delete-account', 'yearly', '0.3'],
]
const subjects = [...compulsorySubjects, ...optionalGroups.flatMap((g) => g.subjects)]
for (const title of subjects) pages.push([`/css-syllabus/${slugify(title)}`, 'monthly', '0.6'])

const urls = pages
  .map(([path, freq, prio]) =>
    `  <url>\n    <loc>${origin}${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`)
  .join('\n')

writeFileSync(join('public', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
writeFileSync(join('public', 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /profile\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`)
console.log(`[seo] sitemap.xml (${pages.length} URLs) and robots.txt for ${origin}`)
