// Guardian English Lab: practice content is static JSON in /public/english,
// fetched only when a module opens and cached by the browser/CDN (no function calls).
import { useEffect, useState } from 'react'

const cache = new Map()

export function loadEnglishContent(name) {
  if (!cache.has(name)) {
    const promise = fetch(`/english/${name}.json`, { cache: 'force-cache' }).then((response) => {
      if (!response.ok) throw new Error(`Could not load ${name} (${response.status})`)
      return response.json()
    })
    promise.catch(() => cache.delete(name))
    cache.set(name, promise)
  }
  return cache.get(name)
}

/** { data, error, loading } for one content file. */
export function useEnglishContent(name) {
  const [state, setState] = useState({ data: null, error: '', loading: true })
  useEffect(() => {
    let cancelled = false
    setState({ data: null, error: '', loading: true })
    loadEnglishContent(name)
      .then((data) => {
        if (!cancelled) setState({ data, error: '', loading: false })
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, error: error.message || 'Could not load practice content.', loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [name])
  return state
}

export function shuffle(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Normalise a typed sentence for comparison: straight quotes, single spaces, trimmed. */
export function normaliseSentence(text) {
  return String(text || '')
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()
}

export function matchesAnswer(input, answers) {
  const value = normaliseSentence(input)
  return (answers || []).some((answer) => normaliseSentence(answer) === value)
}

/**
 * Word-level diff between what the student wrote and the expected sentence.
 * Returns [{ text, kind: 'same' | 'added' | 'removed' }] where added = in expected, removed = only in input.
 */
export function diffWords(input, expected) {
  const a = normaliseSentence(input).split(' ').filter(Boolean)
  const b = normaliseSentence(expected).split(' ').filter(Boolean)
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ text: a[i], kind: 'same' })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ text: a[i], kind: 'removed' })
      i += 1
    } else {
      out.push({ text: b[j], kind: 'added' })
      j += 1
    }
  }
  while (i < a.length) out.push({ text: a[i++], kind: 'removed' })
  while (j < b.length) out.push({ text: b[j++], kind: 'added' })
  return out
}
