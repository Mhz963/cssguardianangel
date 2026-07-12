import { useCallback, useEffect, useState } from 'react'
import {
  buildSlotReminderDescriptors,
  normalizePlannerPlanForReminders,
  plannerReminderDayKey,
} from './plannerReminderEngine.js'

export const GA_PLANNER_REMINDER_TOGGLE_KEY = 'ga-planner-slot-reminders'
export const GA_PLANNER_REMINDER_FIRE_EVENT = 'ga-planner-reminder-fire'
const FIRED_SESSION_KEY = 'ga-planner-fired-keys'

export function isPlannerNativeAppView() {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView?.postMessage)
}

export function dispatchPlannerReminderPopup(detail) {
  try {
    window.dispatchEvent(
      new CustomEvent(GA_PLANNER_REMINDER_FIRE_EVENT, {
        detail: {
          title: detail?.title || 'Guardian Angel — study slot',
          body: detail?.body || '',
          slotLabel: detail?.slotLabel || '',
        },
      }),
    )
  } catch {
    // ignore
  }
}

export function postNativePlannerReminderFire(detail) {
  try {
    if (!isPlannerNativeAppView()) return
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'ga_planner_reminder_fire',
        title: detail?.title || 'Guardian Angel — study slot',
        body: detail?.body || '',
        slotLabel: detail?.slotLabel || '',
      }),
    )
  } catch {
    // ignore
  }
}

function readReminderEnabled() {
  try {
    return localStorage.getItem(GA_PLANNER_REMINDER_TOGGLE_KEY) === '1'
  } catch {
    return false
  }
}

function readProfileSnapshot(profileStorageKey) {
  try {
    if (!readReminderEnabled()) return null
    const raw = localStorage.getItem(profileStorageKey)
    if (!raw) return null
    const profile = JSON.parse(raw)
    const form = profile?.plannerForm
    if (!form || !Array.isArray(form.productiveHours) || form.productiveHours.length === 0) return null
    const plan = normalizePlannerPlanForReminders(profile?.plan)
    return { form, plan }
  } catch {
    return null
  }
}

/** Call after a user gesture so the first chime is less likely to be blocked. */
export function primePlannerReminderAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    ctx.resume().then(() => {
      try {
        ctx.close()
      } catch {
        // ignore
      }
    })
  } catch {
    // ignore
  }
}

export function playPlannerReminderChime() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([0, 220, 100, 220, 100, 280])
    }
  } catch {
    // ignore
  }

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const playTone = (frequency, startAt, duration, volume) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(frequency, startAt)
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0001, startAt)
      gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
      osc.start(startAt)
      osc.stop(startAt + duration + 0.02)
    }
    const t0 = ctx.currentTime
    playTone(880, t0, 0.18, 0.22)
    playTone(660, t0 + 0.2, 0.18, 0.2)
    playTone(880, t0 + 0.42, 0.24, 0.24)
    window.setTimeout(() => {
      try {
        ctx.close()
      } catch {
        // ignore
      }
    }, 900)
  } catch {
    // ignore
  }
}

function pruneFiredKeysForToday(dayKey) {
  try {
    const raw = sessionStorage.getItem(FIRED_SESSION_KEY) || ''
    const parts = raw.split(',').filter(Boolean)
    const next = parts.filter((k) => k.startsWith(`${dayKey}-`))
    sessionStorage.setItem(FIRED_SESSION_KEY, next.join(','))
  } catch {
    // ignore
  }
}

function hasFired(dayKey, hour) {
  try {
    const raw = sessionStorage.getItem(FIRED_SESSION_KEY) || ''
    const key = `${dayKey}-${hour}`
    return raw.split(',').includes(key)
  } catch {
    return false
  }
}

function markFired(dayKey, hour) {
  try {
    const raw = sessionStorage.getItem(FIRED_SESSION_KEY) || ''
    const key = `${dayKey}-${hour}`
    const parts = new Set(raw.split(',').filter(Boolean))
    parts.add(key)
    sessionStorage.setItem(FIRED_SESSION_KEY, [...parts].join(','))
  } catch {
    // ignore
  }
}

function fireWebReminder(snap) {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  if (m > 1) return
  const slots = buildSlotReminderDescriptors(snap.form.productiveHours)
  if (!slots.some((s) => s.hour === h)) return
  const dk = plannerReminderDayKey(now)
  pruneFiredKeysForToday(dk)
  if (hasFired(dk, h)) return
  markFired(dk, h)
  const slotLabel = slots.find((s) => s.hour === h)?.label || `${String(h).padStart(2, '0')}:00`
  const studyHours = snap.plan?.studyHours ?? snap.form?.studyHours ?? ''
  const title = 'Guardian Angel — study slot'
  const body = `Your productive window starts (${slotLabel}). Aim for ~${studyHours}h study today.`
  if (isPlannerNativeAppView()) {
    postNativePlannerReminderFire({ title, body, slotLabel })
  } else {
    playPlannerReminderChime()
    dispatchPlannerReminderPopup({ title, body, slotLabel })
  }
  try {
    if (!isPlannerNativeAppView() && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        tag: `ga-planner-${dk}-${h}`,
        silent: false,
      })
      n?.addEventListener?.('click', () => {
        try {
          window.focus()
        } catch {
          // ignore
        }
      })
    }
  } catch {
    // ignore
  }
}

let tickId = null

export function stopPlannerReminderTick() {
  if (tickId != null) {
    clearInterval(tickId)
    tickId = null
  }
}

/**
 * Polls local time against saved productive slots while Guardian Angel is open in the browser.
 */
export function startPlannerReminderTick(getSnapshot) {
  stopPlannerReminderTick()
  const tick = () => {
    const snap = typeof getSnapshot === 'function' ? getSnapshot() : null
    if (!snap) return
    fireWebReminder(snap)
  }
  tick()
  tickId = window.setInterval(tick, 12000)
  return () => stopPlannerReminderTick()
}

export function postNativePlannerReminders({ clear, slots, studyHours }) {
  try {
    if (typeof window === 'undefined' || !window.ReactNativeWebView?.postMessage) return
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'ga_planner_reminders',
        clear: Boolean(clear),
        slots: Array.isArray(slots) ? slots : [],
        studyHours: studyHours != null ? Number(studyHours) : null,
      }),
    )
  } catch {
    // ignore
  }
}

export async function requestPlannerReminderPermission() {
  try {
    if (isPlannerNativeAppView()) {
      return true
    }
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  } catch {
    return false
  }
}

function parsePlannerReminderBridgeMessage(raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (parsed?.type !== 'ga_planner_reminder_fire') return null
    return {
      title: parsed.title || 'Guardian Angel — study slot',
      body: parsed.body || '',
      slotLabel: parsed.slotLabel || '',
    }
  } catch {
    return null
  }
}

export function usePlannerReminderPopup() {
  const [popup, setPopup] = useState(null)

  const dismissPopup = useCallback(() => {
    setPopup(null)
  }, [])

  useEffect(() => {
    const onFire = (event) => {
      const detail = event?.detail
      if (!detail?.title && !detail?.body) return
      playPlannerReminderChime()
      setPopup(detail)
    }

    const onBridgeMessage = (event) => {
      const detail = parsePlannerReminderBridgeMessage(event?.data)
      if (!detail) return
      playPlannerReminderChime()
      setPopup(detail)
    }

    window.addEventListener(GA_PLANNER_REMINDER_FIRE_EVENT, onFire)
    window.addEventListener('message', onBridgeMessage)
    document.addEventListener('message', onBridgeMessage)
    return () => {
      window.removeEventListener(GA_PLANNER_REMINDER_FIRE_EVENT, onFire)
      window.removeEventListener('message', onBridgeMessage)
      document.removeEventListener('message', onBridgeMessage)
    }
  }, [])

  return { popup, dismissPopup }
}

/**
 * Syncs native daily alarms (Expo) and relies on the background tick for web.
 */
export function syncPlannerRemindersToNativeAndWeb({ enabled, form, plan }) {
  const slots = enabled && form?.productiveHours?.length ? buildSlotReminderDescriptors(form.productiveHours) : []
  const studyHours = plan?.studyHours ?? form?.studyHours
  postNativePlannerReminders({
    clear: !enabled || slots.length === 0,
    slots,
    studyHours,
  })
}

export function usePlannerReminderBootstrap(authUser) {
  useEffect(() => {
    if (!authUser?.id && !authUser?.username) {
      stopPlannerReminderTick()
      postNativePlannerReminders({ clear: true, slots: [], studyHours: null })
      return undefined
    }
    const userKey = authUser.id || authUser.username
    const profileStorageKey = `ga-profile-${userKey}`
    const snap = readProfileSnapshot(profileStorageKey)
    if (snap) {
      syncPlannerRemindersToNativeAndWeb({
        enabled: true,
        form: snap.form,
        plan: snap.plan,
      })
    } else {
      postNativePlannerReminders({ clear: true, slots: [], studyHours: null })
    }
    const stopTick = startPlannerReminderTick(() => readProfileSnapshot(profileStorageKey))
    return () => {
      stopTick()
    }
  }, [authUser?.id, authUser?.username])
}
