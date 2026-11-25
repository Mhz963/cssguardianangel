// Guardian English Lab: progress store.
// Progress lives in localStorage for everyone; signed-in users also sync one row
// to Supabase (table english_progress, see supabase/migrations/20261126_english_progress.sql).
// No Vercel function is involved: the browser talks to Supabase directly under RLS.
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabaseClient.js'

const STORAGE_PREFIX = 'ga-english-progress'
const SYNC_DELAY_MS = 2000

/** Days until the next review for each Leitner box (box 0 = new). */
export const LEITNER_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30]
export const MASTERED_BOX = 5
export const NEW_WORDS_PER_DAY = 10

export function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysKey(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayKey(d)
}

export function emptyProgress() {
  return {
    version: 1,
    updatedAt: 0,
    totals: { answered: 0, correct: 0 },
    activityDays: [],
    grammar: {},
    punctuation: { best: 0, attempts: 0, last: 0 },
    correction: { solved: {}, attempts: 0 },
    pairs: { best: 0, attempts: 0, last: 0 },
    grouping: {},
    vocabulary: { cards: {}, newToday: { date: '', count: 0 } },
  }
}

function normalise(raw) {
  const base = emptyProgress()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    totals: { ...base.totals, ...(raw.totals || {}) },
    punctuation: { ...base.punctuation, ...(raw.punctuation || {}) },
    correction: { ...base.correction, ...(raw.correction || {}), solved: { ...(raw.correction?.solved || {}) } },
    pairs: { ...base.pairs, ...(raw.pairs || {}) },
    vocabulary: {
      ...base.vocabulary,
      ...(raw.vocabulary || {}),
      cards: { ...(raw.vocabulary?.cards || {}) },
      newToday: { ...base.vocabulary.newToday, ...(raw.vocabulary?.newToday || {}) },
    },
    activityDays: Array.isArray(raw.activityDays) ? raw.activityDays.slice(-120) : [],
  }
}

function readLocal(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? normalise(JSON.parse(raw)) : emptyProgress()
  } catch {
    return emptyProgress()
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: progress still works for this visit.
  }
}

/** Current streak of consecutive active days ending today or yesterday. */
export function streakFrom(activityDays) {
  const days = new Set(activityDays || [])
  let streak = 0
  const cursor = new Date()
  if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(todayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function markActive(progress) {
  const today = todayKey()
  if (progress.activityDays.includes(today)) return progress.activityDays
  return [...progress.activityDays, today].slice(-120)
}

/**
 * React hook giving the progress object and update helpers.
 * Guests use a device-only key; signed-in users get a per-user key plus Supabase sync.
 */
export function useEnglishProgress(authUser) {
  const userId = authUser?.id || ''
  const storageKey = userId ? `${STORAGE_PREFIX}-${userId}` : STORAGE_PREFIX
  const [progress, setProgress] = useState(() => readLocal(storageKey))
  const [syncState, setSyncState] = useState(userId ? 'loading' : 'local')
  const remoteReadyRef = useRef(!userId)
  const syncTimerRef = useRef(0)

  // Load the right local copy when the user changes, then merge the remote copy (newest wins).
  useEffect(() => {
    let cancelled = false
    const local = readLocal(storageKey)
    setProgress(local)
    remoteReadyRef.current = !userId
    if (!userId || !supabase) {
      setSyncState('local')
      remoteReadyRef.current = true
      return undefined
    }
    setSyncState('loading')
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('english_progress')
          .select('data, updated_at')
          .eq('user_id', userId)
          .maybeSingle()
        if (cancelled) return
        if (error) throw error
        const remote = data?.data ? normalise(data.data) : null
        if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
          setProgress(remote)
          writeLocal(storageKey, remote)
        }
        setSyncState('synced')
      } catch {
        // Table not created yet or offline: keep working on this device only.
        if (!cancelled) setSyncState('local')
      } finally {
        if (!cancelled) remoteReadyRef.current = true
      }
    })()
    return () => {
      cancelled = true
    }
  }, [storageKey, userId])

  const pushRemote = useCallback(
    (value) => {
      if (!userId || !supabase || !remoteReadyRef.current) return
      window.clearTimeout(syncTimerRef.current)
      syncTimerRef.current = window.setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('english_progress')
            .upsert({ user_id: userId, data: value, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
          setSyncState(error ? 'local' : 'synced')
        } catch {
          setSyncState('local')
        }
      }, SYNC_DELAY_MS)
    },
    [userId],
  )

  useEffect(() => () => window.clearTimeout(syncTimerRef.current), [])

  /** Apply a change: updater receives a copy of progress and returns the new progress. */
  const update = useCallback(
    (updater) => {
      setProgress((current) => {
        const next = normalise(updater(normalise(JSON.parse(JSON.stringify(current)))))
        next.updatedAt = Date.now()
        next.activityDays = markActive(next)
        writeLocal(storageKey, next)
        pushRemote(next)
        return next
      })
    },
    [storageKey, pushRemote],
  )

  /** Record a finished quiz round for a simple module (punctuation, pairs). */
  const recordRound = useCallback(
    (moduleKey, { correct, total }) => {
      update((p) => {
        const pct = total ? Math.round((correct / total) * 100) : 0
        const m = p[moduleKey] || { best: 0, attempts: 0, last: 0 }
        p[moduleKey] = { best: Math.max(m.best || 0, pct), attempts: (m.attempts || 0) + 1, last: pct }
        p.totals.answered += total
        p.totals.correct += correct
        return p
      })
    },
    [update],
  )

  const recordGrammarTopic = useCallback(
    (topicId, { correct, total }) => {
      update((p) => {
        const pct = total ? Math.round((correct / total) * 100) : 0
        const t = p.grammar[topicId] || { best: 0, attempts: 0, last: 0 }
        p.grammar[topicId] = { best: Math.max(t.best || 0, pct), attempts: (t.attempts || 0) + 1, last: pct }
        p.totals.answered += total
        p.totals.correct += correct
        return p
      })
    },
    [update],
  )

  const recordCorrection = useCallback(
    (itemId, isCorrect) => {
      update((p) => {
        p.correction.attempts += 1
        if (isCorrect) p.correction.solved[itemId] = true
        p.totals.answered += 1
        if (isCorrect) p.totals.correct += 1
        return p
      })
    },
    [update],
  )

  const recordGrouping = useCallback(
    (setId, { correct, total }) => {
      update((p) => {
        const pct = total ? Math.round((correct / total) * 100) : 0
        const s = p.grouping[setId] || { best: 0, attempts: 0, last: 0 }
        p.grouping[setId] = { best: Math.max(s.best || 0, pct), attempts: (s.attempts || 0) + 1, last: pct }
        p.totals.answered += total
        p.totals.correct += correct
        return p
      })
    },
    [update],
  )

  /** Leitner review: knew it -> next box; still learning -> back to box 1 (due tomorrow). */
  const reviewWord = useCallback(
    (wordId, knewIt) => {
      update((p) => {
        const card = p.vocabulary.cards[wordId] || { box: 0, due: todayKey() }
        const wasNew = !p.vocabulary.cards[wordId]
        const box = knewIt ? Math.min(card.box + 1, MASTERED_BOX) : 1
        p.vocabulary.cards[wordId] = { box, due: addDaysKey(knewIt ? LEITNER_INTERVAL_DAYS[box] : 1) }
        if (wasNew) {
          const today = todayKey()
          const nt = p.vocabulary.newToday
          p.vocabulary.newToday = { date: today, count: nt.date === today ? nt.count + 1 : 1 }
        }
        p.totals.answered += 1
        if (knewIt) p.totals.correct += 1
        return p
      })
    },
    [update],
  )

  const resetAll = useCallback(() => {
    update(() => emptyProgress())
  }, [update])

  return {
    progress,
    syncState,
    isSignedIn: Boolean(userId),
    recordRound,
    recordGrammarTopic,
    recordCorrection,
    recordGrouping,
    reviewWord,
    resetAll,
  }
}
