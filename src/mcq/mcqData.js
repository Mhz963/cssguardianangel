// Guardian Test Centre: static MCQ banks in /public/mcq, loaded on demand and cached by the browser.
// Progress lives in localStorage (no account needed).
import { useEffect, useState } from 'react'

const cache = new Map()
let dataVersion = ''

/** index.json is always revalidated; bank files are cached by the version the index names. */
export function loadJson(path, version = '') {
  const key = `${path}?v=${version}`
  if (!cache.has(key)) {
    const p = fetch(version ? `${path}?v=${version}` : path, { cache: version ? 'force-cache' : 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json()
    })
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return cache.get(key)
}

export function useJson(path) {
  const [state, setState] = useState({ data: null, error: false })
  useEffect(() => {
    let live = true
    loadJson(path)
      .then((data) => {
        if (data?.version) dataVersion = data.version
        if (live) setState({ data, error: false })
      })
      .catch(() => live && setState({ data: null, error: true }))
    return () => {
      live = false
    }
  }, [path])
  return state
}

export async function loadBanks(ids) {
  const banks = await Promise.all(ids.map((id) => loadJson(`/mcq/${id}.json`, dataVersion)))
  return banks.flatMap((b) => b.questions)
}

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Shuffle options too, keeping track of the right answer. */
export function prepare(questions) {
  return questions.map((q) => {
    const order = shuffle(q.options.map((_, i) => i))
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
  })
}

/** Pick `count` questions across areas by percentage weight (for the MPT mock). */
export function sampleByAreas(pool, allAreas, count) {
  // Areas with no question bank yet (e.g. Urdu) are skipped; the others are scaled up proportionally.
  const areas = allAreas.filter((a) => a.banks?.length)
  const totalPercent = areas.reduce((n, a) => n + a.percent, 0) || 100
  const picked = []
  const used = new Set()
  let remaining = count
  areas.forEach((area, i) => {
    const want = i === areas.length - 1 ? remaining : Math.round((area.percent / totalPercent) * count)
    const candidates = shuffle(pool.filter((q) => area.banks.includes(q.bank) && !used.has(q.id)))
    candidates.slice(0, want).forEach((q) => {
      used.add(q.id)
      picked.push({ ...q, area: area.id })
    })
    remaining -= Math.min(want, candidates.length)
  })
  if (picked.length < count) {
    shuffle(pool.filter((q) => !used.has(q.id)))
      .slice(0, count - picked.length)
      .forEach((q) => picked.push({ ...q, area: areas.find((a) => a.banks.includes(q.bank))?.id || 'other' }))
  }
  return picked
}

const KEY = 'ga-test-centre-progress'

export function readProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { banks: p.banks || {}, mistakes: p.mistakes || [], mocks: p.mocks || [] }
  } catch {
    return { banks: {}, mistakes: [], mocks: [] }
  }
}

export function saveResult(result, kind) {
  const p = readProgress()
  result.items.forEach(({ q, choice }) => {
    if (choice === undefined || choice === null) return
    const b = p.banks[q.bank] || { answered: 0, correct: 0 }
    b.answered += 1
    if (choice === q.answer) b.correct += 1
    p.banks[q.bank] = b
    const wrong = choice !== q.answer
    p.mistakes = p.mistakes.filter((id) => id !== q.id)
    if (wrong) p.mistakes.unshift(q.id)
  })
  p.mistakes = p.mistakes.slice(0, 300)
  if (kind === 'mock') {
    p.mocks.unshift({ date: new Date().toISOString(), score: result.score, total: result.total, passed: result.passed })
    p.mocks = p.mocks.slice(0, 20)
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // storage full or disabled: progress is optional
  }
  return p
}
