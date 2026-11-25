// Validates the Guardian English Lab content in public/english/*.json.
// Run: npm run check:english   (also runs in CI)
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const dir = join('public', 'english')
const errors = []
const counts = {}
const fail = (file, msg) => errors.push(`${file}: ${msg}`)

function load(name) {
  const path = join(dir, `${name}.json`)
  if (!existsSync(path)) {
    fail(name, 'file missing')
    return null
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    fail(name, `invalid JSON (${error.message})`)
    return null
  }
}

function uniqueIds(file, items) {
  const seen = new Set()
  for (const item of items) {
    if (!item.id) fail(file, 'item without id')
    else if (seen.has(item.id)) fail(file, `duplicate id ${item.id}`)
    seen.add(item.id)
  }
}

function checkQuestion(file, q) {
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) fail(file, `${q.id}: needs options`)
    else if (new Set(q.options).size !== q.options.length) fail(file, `${q.id}: duplicate options`)
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options || []).length) fail(file, `${q.id}: answer index out of range`)
    if (!q.prompt) fail(file, `${q.id}: missing prompt`)
  } else if (q.type === 'rewrite') {
    if (!q.sentence) fail(file, `${q.id}: missing sentence`)
    if (!Array.isArray(q.answers) || !q.answers.length) fail(file, `${q.id}: missing answers`)
    if ((q.answers || []).includes(q.sentence)) fail(file, `${q.id}: an answer equals the original sentence`)
  } else {
    fail(file, `${q.id}: unknown type ${q.type}`)
  }
  if (!q.explanation) fail(file, `${q.id}: missing explanation`)
}

const grammar = load('grammar')
if (grammar) {
  const topics = grammar.topics || []
  uniqueIds('grammar', topics)
  const all = topics.flatMap((t) => t.questions || [])
  uniqueIds('grammar', all)
  topics.forEach((t) => {
    if (!t.title || !t.summary) fail('grammar', `${t.id}: missing title/summary`)
    if (!(t.rules || []).length) fail('grammar', `${t.id}: no rules`)
    ;(t.questions || []).forEach((q) => checkQuestion('grammar', q))
  })
  counts.grammar = `${topics.length} topics, ${all.length} questions`
}

const punctuation = load('punctuation')
if (punctuation) {
  uniqueIds('punctuation', punctuation.questions || [])
  ;(punctuation.questions || []).forEach((q) => checkQuestion('punctuation', q))
  if (!(punctuation.rules || []).length) fail('punctuation', 'no rules')
  counts.punctuation = `${(punctuation.rules || []).length} rules, ${(punctuation.questions || []).length} questions`
}

const correction = load('sentence-correction')
if (correction) {
  const items = correction.items || []
  uniqueIds('sentence-correction', items)
  items.forEach((i) => {
    if (!i.sentence || !(i.answers || []).length || !i.explanation || !i.focus) fail('sentence-correction', `${i.id}: missing field`)
    if ((i.answers || []).includes(i.sentence)) fail('sentence-correction', `${i.id}: answer equals original`)
  })
  counts['sentence-correction'] = `${items.length} sentences`
}

const pairs = load('pairs-of-words')
if (pairs) {
  const list = pairs.pairs || []
  uniqueIds('pairs-of-words', list)
  const seenGroups = new Set()
  list.forEach((p) => {
    const words = (p.words || []).map((w) => w.word)
    if (words.length < 2 || words.length > 3) fail('pairs-of-words', `${p.id}: needs 2 or 3 words`)
    const groupKey = words.map((w) => w.toLowerCase()).sort().join('|')
    if (seenGroups.has(groupKey)) fail('pairs-of-words', `${p.id}: duplicate group ${groupKey}`)
    seenGroups.add(groupKey)
    if ((p.quiz || []).length !== words.length) fail('pairs-of-words', `${p.id}: needs one quiz sentence per word`)
    if (p.years && (!Array.isArray(p.years) || p.years.some((y) => !Number.isInteger(y) || y < 1950 || y > 2100))) {
      fail('pairs-of-words', `${p.id}: bad years`)
    }
    ;(p.words || []).forEach((w) => {
      if (!w.word || !w.meaning || !w.pos || !w.example) fail('pairs-of-words', `${p.id}: word missing a field`)
    })
    ;(p.quiz || []).forEach((q) => {
      if (!q.sentence?.includes('___')) fail('pairs-of-words', `${p.id}: quiz sentence without ___`)
      if (!words.includes(q.answer)) fail('pairs-of-words', `${p.id}: quiz answer "${q.answer}" is not one of the words`)
    })
  })
  counts['pairs-of-words'] = `${list.length} pairs (${list.filter((p) => p.years?.length).length} from past papers)`
}

const grouping = load('grouping')
if (grouping) {
  const sets = grouping.sets || []
  uniqueIds('grouping', sets)
  sets.forEach((s) => {
    if (!['synonyms', 'antonyms'].includes(s.type)) fail('grouping', `${s.id}: bad type`)
    const words = (s.pairs || []).flat()
    if ((s.pairs || []).some((p) => p.length !== 2)) fail('grouping', `${s.id}: every pair needs 2 words`)
    if (new Set(words).size !== words.length) fail('grouping', `${s.id}: repeated word inside the set`)
  })
  counts.grouping = `${sets.length} sets`
}

const vocabulary = load('vocabulary')
if (vocabulary) {
  const words = vocabulary.words || []
  uniqueIds('vocabulary', words)
  words.forEach((w) => {
    if (!w.word || !w.meaning || !w.pos || !w.example) fail('vocabulary', `${w.id}: missing field`)
  })
  counts.vocabulary = `${words.length} words`
}

for (const [file, summary] of Object.entries(counts)) console.log(`[english] ${file}: ${summary}`)
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log('[english] content OK')
