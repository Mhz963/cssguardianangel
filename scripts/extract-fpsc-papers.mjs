import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const apiUrl =
  'https://www.fpsc.gov.pk/api/schedules?section=Previous%20Question%20Papers/CSS'

const response = await fetch(apiUrl, {
  headers: { 'User-Agent': 'GuardianAngelWebsite/1.0' },
})
if (!response.ok) {
  throw new Error(`FPSC API request failed with status ${response.status}`)
}
const json = await response.json()
const base = 'https://www.fpsc.gov.pk'
const sourceUrl = `${base}/Schedule?section=Previous%20Question%20Papers/CSS`

function extractPapers(html) {
  const papers = []
  const seen = new Set()
  const re = /<a[^>]*title="([^"]*)"[^>]*href="([^"]+)"[^>]*>/gi
  let match = re.exec(html)
  while (match) {
    const title = match[1].replace(/&amp;/g, '&').trim()
    let href = match[2].trim()
    if (!href.startsWith('http')) href = `${base}${href}`
    if (!/\.pdf(?:$|[?#])/i.test(href)) {
      match = re.exec(html)
      continue
    }
    if (!seen.has(href)) {
      seen.add(href)
      papers.push({ title, url: href })
    }
    match = re.exec(html)
  }
  return papers.sort((a, b) => a.title.localeCompare(b.title))
}

const years = json.data
  .filter((item) => item.category === 'PREVIOUS_PAPERS_CSS')
  .map((item) => {
    const yearMatch = item.title.match(/CSS-(\d{4})/i) || item.title.match(/(\d{4})/)
    const year = yearMatch ? yearMatch[1] : item.title
    return {
      year,
      sourceUrl,
      apiTitle: item.title,
      uploadDate: item.uploadDate,
      papers: extractPapers(item.description || ''),
    }
  })
  .filter((item) => item.papers.length > 0)
  .sort((a, b) => Number(b.year) - Number(a.year))

fs.writeFileSync(path.join(projectRoot, 'src/data/cssPastPapersData.json'), JSON.stringify(years, null, 2))

console.log(
  JSON.stringify(
    years.map((item) => ({ year: item.year, count: item.papers.length, apiTitle: item.apiTitle })),
    null,
    2,
  ),
)
