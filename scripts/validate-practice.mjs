// Validates the Topic-wise Past Papers (public/past-papers) and Test Centre MCQs (public/mcq).
// Run: npm run check:practice   (also runs in CI)
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const errors = []
const fail = (where, msg) => errors.push(`${where}: ${msg}`)
const read = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    fail(path, `invalid JSON (${e.message})`)
    return null
  }
}

// Past papers
const ppIndex = read(join('public', 'past-papers', 'index.json'))
for (const s of ppIndex?.subjects || []) {
  const file = join('public', 'past-papers', `${s.subject}.json`)
  if (!existsSync(file)) {
    fail(file, 'missing')
    continue
  }
  const d = read(file)
  if (!d) continue
  const topics = new Set(d.topics.map((t) => t.id))
  const ids = new Set()
  d.questions.forEach((q) => {
    if (ids.has(q.id)) fail(file, `duplicate id ${q.id}`)
    ids.add(q.id)
    if (!Number.isInteger(q.year) || !q.text || !q.number) fail(file, `${q.id}: missing year/text/number`)
    if (!q.topics?.length || q.topics.some((t) => !topics.has(t))) fail(file, `${q.id}: bad topics`)
  })
  console.log(`[practice] past papers ${s.subject}: ${d.questions.length} questions`)
}

// MCQs
const mcqIndex = read(join('public', 'mcq', 'index.json'))
let total = 0
for (const b of mcqIndex?.banks || []) {
  const file = join('public', 'mcq', `${b.id}.json`)
  const d = existsSync(file) ? read(file) : (fail(file, 'missing'), null)
  if (!d) continue
  const ids = new Set()
  d.questions.forEach((q) => {
    if (ids.has(q.id)) fail(file, `duplicate id ${q.id}`)
    ids.add(q.id)
    if (!q.prompt) fail(file, `${q.id}: no prompt`)
    if (!Array.isArray(q.options) || q.options.length !== 4 || new Set(q.options).size !== 4) fail(file, `${q.id}: needs 4 distinct options`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) fail(file, `${q.id}: answer out of range`)
  })
  total += d.questions.length
}
if (mcqIndex?.mpt) {
  const sum = mcqIndex.mpt.areas.reduce((n, a) => n + a.percent, 0)
  if (Math.abs(sum - 100) > 0.5) fail('mcq/index.json', `MPT area percentages add up to ${sum}, not 100`)
}
console.log(`[practice] MCQs: ${total} in ${mcqIndex?.banks?.length || 0} banks`)

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.slice(0, 50).join('\n- ')}`)
  process.exit(1)
}
console.log('[practice] content OK')
