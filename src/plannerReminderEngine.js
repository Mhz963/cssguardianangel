/**
 * Pure helpers for study-slot reminders (Strategy Builder productive hours).
 */

function formatClock(totalMinutes) {
  const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${`${minute}`.padStart(2, '0')} ${suffix}`
}

export function normalizePlannerPlanForReminders(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!Number.isFinite(Number(raw.studyHours)) || !Array.isArray(raw.timetable) || raw.timetable.length === 0) {
    return null
  }
  return raw
}

/**
 * @param {string[]} productiveHourIds e.g. "07:00-08:00"
 * @returns {{ hour: number, minute: number, label: string, id: string }[]}
 */
export function buildSlotReminderDescriptors(productiveHourIds) {
  if (!Array.isArray(productiveHourIds) || productiveHourIds.length === 0) return []
  const rows = []
  for (const id of productiveHourIds) {
    const m = /^(\d{2}):00-/.exec(String(id))
    if (!m) continue
    const startHour = Number.parseInt(m[1], 10)
    if (!Number.isFinite(startHour) || startHour < 0 || startHour > 23) continue
    const endHour = (startHour + 1) % 24
    const label = `${formatClock(startHour * 60)} - ${formatClock(endHour * 60)}`
    rows.push({ id: String(id), hour: startHour, minute: 0, label })
  }
  rows.sort((a, b) => a.hour - b.hour)
  const seen = new Set()
  return rows.filter((r) => {
    if (seen.has(r.hour)) return false
    seen.add(r.hour)
    return true
  })
}

export function plannerReminderDayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
