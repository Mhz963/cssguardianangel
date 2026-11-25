import { GA_PLANNER_REMINDER_TOGGLE_KEY, isPlannerNativeAppView, primePlannerReminderAudio, requestPlannerReminderPermission, syncPlannerRemindersToNativeAndWeb } from '../plannerReminderClient.js'
import { compulsorySubjects, optionalGroups } from '../data/syllabusData'
import { handlePdfAction } from '../pdfNativeBridge.js'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabaseClient.js'
import { MS_PER_DAY } from '../siteConfig.js'

const DEFAULT_PLANNER_FORM = {
  examDate: '',
  studyHours: '6',
  productiveHours: ['07:00-08:00', '08:00-09:00', '09:00-10:00'],
  stage: 'beginner',
  cssAttempt: 'first',
  difficulty: 'difficult',
  learningPreference: 'lectures-first',
}

const formatClock = (totalMinutes) => {
  const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${`${minute}`.padStart(2, '0')} ${suffix}`
}

const PRODUCTIVE_HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const startHour = index
  const endHour = (startHour + 1) % 24
  const id = `${`${startHour}`.padStart(2, '0')}:00-${`${endHour}`.padStart(2, '0')}:00`
  return {
    id,
    startHour,
    label: `${formatClock(startHour * 60)} - ${formatClock(endHour * 60)}`,
  }
})

const PRODUCTIVE_HOUR_BY_START = Object.fromEntries(
  PRODUCTIVE_HOUR_OPTIONS.map((slot) => [slot.startHour, slot]),
)

const PRODUCTIVE_HOUR_SECTIONS = [
  {
    id: 'morning',
    title: 'Morning',
    subtitle: '3 AM to 11:59 AM',
    hours: [3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    id: 'evening',
    title: 'Evening',
    subtitle: '12 PM to 5:59 PM',
    hours: [12, 13, 14, 15, 16, 17],
  },
  {
    id: 'night',
    title: 'Night',
    subtitle: '6 PM to 2:59 AM',
    hours: [18, 19, 20, 21, 22, 23, 0, 1, 2],
  },
].map((section) => ({
  ...section,
  slots: section.hours.map((hour) => PRODUCTIVE_HOUR_BY_START[hour]).filter(Boolean),
}))

const PLANNER_CORE_COMPULSORY_SUBJECTS = compulsorySubjects.slice(0, 5)

const COMPULSORY_ELECTIVE_OPTIONS = compulsorySubjects.slice(5, 7)

const LEGACY_COMPULSORY_ELECTIVE_TITLE = {
  'Comparative Study of Major Religions (For Non Muslims)': compulsorySubjects[6],
}

const WATERMARK_IMAGE_URL = new URL('../../data/watermark.png', import.meta.url).href

const LOCAL_OUTLINE_IMAGE_URLS = {
  punjabi: [new URL('../../data/punjabi-literature-outline-merged.png', import.meta.url).href],
  sindhi: [new URL('../../data/sindhi-literature-outline-merged.png', import.meta.url).href],
  balochi: [new URL('../../data/balochi-literature-outline-merged.png', import.meta.url).href],
}

const OPTIONAL_SUBJECT_META = optionalGroups.flatMap((group, groupIndex) =>
  group.subjects.map((subject) => {
    const marksMatch = subject.match(/\((\d+)\s*Marks\)/i)
    const marks = marksMatch ? Number(marksMatch[1]) : 100
    const baseTitle = subject.replace(/\s*\(\d+\s*Marks\)/i, '').trim()
    return {
      subject,
      baseTitle,
      group: group.group,
      groupIndex,
      rules: group.rules,
      marks,
    }
  }),
)

const OPTIONAL_META_MAP = Object.fromEntries(
  OPTIONAL_SUBJECT_META.map((item) => [item.subject, item]),
)

const CALENDAR_STATUS_OPTIONS = [
  { id: 'planned', label: 'Planned Study', className: 'status-planned' },
  { id: 'completed', label: 'Marked Completed', className: 'status-completed' },
  { id: 'revision', label: 'Revision Focus', className: 'status-revision' },
  { id: 'mock-test', label: 'Mock Test Day', className: 'status-mock' },
  { id: 'catch-up', label: 'Catch up Day', className: 'status-catchup' },
  { id: 'rest', label: 'Rest / Recovery', className: 'status-rest' },
  { id: 'skipped', label: 'Skipped', className: 'status-skipped' },
]

const SUBJECT_PERFORMANCE_LEVELS = [
  { id: 'Survivor', scoreHint: 'around 40 marks' },
  { id: 'Contendor', scoreHint: 'above 50 marks' },
  { id: 'Topper', scoreHint: 'above 65 marks' },
]

const DEFAULT_SOCIAL_DAILY_LIMIT_MINUTES = 60

const resolveScoreToneClass = (scoreValue, maxValue = 100) => {
  const rawScore = Number(scoreValue)
  const rawMax = Number(maxValue)
  if (!Number.isFinite(rawScore)) return 'score-tone-mid'
  const safeMax = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 100
  const normalized = (rawScore / safeMax) * 100
  if (normalized < 40) return 'score-tone-low'
  if (normalized <= 60) return 'score-tone-mid'
  return 'score-tone-high'
}

const PLANNER_TAB_SEQUENCE = [
  { id: 'subjects', label: 'Subject Locker' },
  { id: 'strategy', label: 'Strategy Builder' },
  { id: 'performance', label: 'Performance Analysis' },
  { id: 'timer', label: 'Timer & Analytics' },
  { id: 'social', label: 'Social Balance' },
  { id: 'calendar', label: 'Guardian Calendar' },
  { id: 'report', label: 'Guardian Angel Report' },
  { id: 'examiner', label: 'AI Examiner' },
]

const AI_EXAM_PAPER_TYPES = [
  { id: 'essay', label: 'Essay' },
  { id: 'precis', label: 'English Precis & Composition' },
  { id: 'current-affairs', label: 'Current Affairs' },
  { id: 'pakistan-affairs', label: 'Pakistan Affairs' },
  { id: 'islamiat', label: 'Islamiat / Comparative Studies' },
]

const AI_EXAM_CRITERIA = [
  {
    id: 'relevance',
    label: 'Question Relevance',
    weight: 20,
    feedback:
      'Stay tightly aligned with the asked question. Build every major paragraph around the command words and scope.',
  },
  {
    id: 'structure',
    label: 'Structure & Flow',
    weight: 20,
    feedback:
      'Use clear introduction, argument body, and conclusion. Strong transitions improve readability and examiner confidence.',
  },
  {
    id: 'analysis',
    label: 'Analysis Depth',
    weight: 20,
    feedback:
      'Move beyond description. Add causes, impacts, counter points, policy options, and reasoned judgment.',
  },
  {
    id: 'evidence',
    label: 'Evidence & Examples',
    weight: 20,
    feedback:
      'Support key claims with current examples, policy references, constitutional context, and comparative insights.',
  },
  {
    id: 'language',
    label: 'Language & Expression',
    weight: 20,
    feedback:
      'Use concise, formal, and precise language. Keep sentence control, grammar discipline, and exam appropriate tone.',
  },
]

const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim()

const splitAnswerParagraphs = (answerText) =>
  answerText
    .split(/\n+/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean)

const countMatches = (text, regex) => (text.match(regex) || []).length

const buildAiExamReport = ({ question, answer, paperType }) => {
  const normalizedQuestion = normalizeWhitespace(question.toLowerCase())
  const normalizedAnswer = normalizeWhitespace(answer)
  const answerLower = normalizedAnswer.toLowerCase()
  const paragraphs = splitAnswerParagraphs(answer)
  const words = normalizedAnswer.split(' ').filter(Boolean)
  const wordCount = words.length
  const sentenceCount = Math.max(1, countMatches(normalizedAnswer, /[.!?]+/g))
  const avgWordsPerSentence = wordCount / sentenceCount

  const transitionCount = countMatches(
    answerLower,
    /\b(however|moreover|therefore|furthermore|consequently|in addition|on the other hand|in contrast)\b/g,
  )
  const evidenceCount = countMatches(
    answerLower,
    /\b(according|report|policy|constitution|article|fpsc|data|survey|budget|law|un|imf|world bank|sbp)\b/g,
  )
  const analysisCount = countMatches(
    answerLower,
    /\b(because|therefore|impact|implication|challenge|opportunity|cause|effect|recommend|policy)\b/g,
  )
  const questionKeywords = normalizedQuestion
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 4)
    .slice(0, 8)
  const keywordHits = questionKeywords.filter((token) => answerLower.includes(token)).length
  const keywordCoverage = questionKeywords.length > 0 ? keywordHits / questionKeywords.length : 0.6

  const paperFloor = paperType === 'essay' ? 0.5 : 0.44
  const structureSignal =
    (Math.min(paragraphs.length, 8) / 8) * 0.45 +
    (Math.min(transitionCount, 8) / 8) * 0.35 +
    (avgWordsPerSentence >= 11 && avgWordsPerSentence <= 28 ? 0.2 : 0.1)
  const evidenceSignal = Math.min(evidenceCount, 10) / 10
  const analysisSignal = Math.min(analysisCount, 12) / 12
  const relevanceSignal = Math.min(1, keywordCoverage + (wordCount > 280 ? 0.08 : 0))
  const languageSignal =
    (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 24 ? 0.55 : 0.38) +
    (wordCount >= 280 ? 0.25 : wordCount >= 180 ? 0.16 : 0.08) +
    (paragraphs.length >= 4 ? 0.2 : 0.1)

  const scoreSignals = {
    relevance: relevanceSignal,
    structure: Math.min(1, structureSignal),
    analysis: Math.max(paperFloor, analysisSignal),
    evidence: Math.max(0.35, evidenceSignal),
    language: Math.min(1, languageSignal),
  }

  const criteriaScores = AI_EXAM_CRITERIA.map((criterion) => {
    const signal = scoreSignals[criterion.id] || 0.4
    const rawScore = Math.round(signal * criterion.weight)
    const bounded = Math.max(Math.round(criterion.weight * 0.35), Math.min(criterion.weight, rawScore))
    return {
      ...criterion,
      score: bounded,
      maxScore: criterion.weight,
    }
  })

  const totalScore = criteriaScores.reduce((sum, item) => sum + item.score, 0)
  const grade =
    totalScore >= 75
      ? 'Strong Competitive Band'
      : totalScore >= 60
        ? 'Improving Competitive Band'
        : 'Needs Focused Rebuild'

  const weaknesses = criteriaScores
    .filter((item) => item.score <= Math.round(item.maxScore * 0.62))
    .sort((a, b) => a.score - b.score)
    .map((item) => item.label)

  const lineFeedback = paragraphs.slice(0, 8).map((paragraph, index) => {
    const short = paragraph.length > 210 ? `${paragraph.slice(0, 210)}...` : paragraph
    const paragraphLower = paragraph.toLowerCase()
    let feedback = 'Good direction. Improve precision and add one concrete evidence point.'

    if (index === 0 && !/\b(thesis|argue|position|contend|this essay)\b/.test(paragraphLower)) {
      feedback = 'Opening lacks a clear thesis. State your exact stance in the first lines.'
    } else if (paragraph.length < 85) {
      feedback = 'This paragraph is too short. Expand reasoning with cause effect and policy implications.'
    } else if (!/\b(because|therefore|however|thus|consequently)\b/.test(paragraphLower)) {
      feedback = 'Add analytical connectors to improve logical flow and examiner readability.'
    } else if (!/\b(data|report|constitution|policy|article|example|case)\b/.test(paragraphLower)) {
      feedback = 'Argument is present but evidence is thin. Add one statistic, constitutional point, or case example.'
    }

    return {
      id: `line-${index + 1}`,
      snippet: short,
      feedback,
    }
  })

  const improvedOutline = [
    'Context and Thesis: define scope and present a one line stance.',
    'Core Argument 1: structural cause + current evidence + implication for Pakistan.',
    'Core Argument 2: institutional/policy dimension + comparative reference.',
    'Counter Argument and Rebuttal: address strongest opposing view and respond logically.',
    'Actionable Recommendations: short, implementable, and prioritized policy steps.',
    'Conclusion: concise synthesis with a forward looking exam ready finish.',
  ]

  const weakRotation = weaknesses.length > 0 ? weaknesses : ['Question Relevance', 'Analysis Depth']
  const sevenDayDrills = Array.from({ length: 7 }).map((_, dayIndex) => {
    const area = weakRotation[dayIndex % weakRotation.length]
    const dayLabel = `Day ${dayIndex + 1}`
    return {
      id: `drill-${dayIndex + 1}`,
      dayLabel,
      focusArea: area,
      task:
        area === 'Language & Expression'
          ? 'Write one intro and one conclusion for the same topic in under 22 minutes, then refine sentence control.'
          : area === 'Evidence & Examples'
            ? 'Build an evidence bank of 8 points (facts, policies, reports) and use at least 3 in a timed answer.'
            : area === 'Structure & Flow'
              ? 'Create a full answer skeleton with heading flow, then write with explicit transition markers.'
              : area === 'Question Relevance'
                ? 'Annotate the question command words and write a focused response plan before drafting.'
                : 'Write one timed answer and add causes, impacts, and policy recommendations in each body section.',
      targetMinutes: 90,
      statusSuggestion: dayIndex % 3 === 2 ? 'mock-test' : 'revision',
    }
  })

  const nextAttemptPrompt =
    'Re attempt the same question in 35 to 40 minutes after completing Day 3 drills, then compare marks progression.'

  return {
    generatedAt: new Date().toISOString(),
    totalScore,
    grade,
    wordCount,
    criteriaScores,
    weaknesses,
    lineFeedback,
    improvedOutline,
    sevenDayDrills,
    nextAttemptPrompt,
  }
}

const getNextPerformanceLevel = (currentLevel) => {
  const levelOrder = SUBJECT_PERFORMANCE_LEVELS.map((item) => item.id)
  const currentIndex = levelOrder.indexOf(currentLevel)
  if (currentIndex < 0) return levelOrder[0]
  return levelOrder[(currentIndex + 1) % levelOrder.length]
}

const PERFORMANCE_LEVEL_SCORE_MAP = {
  Survivor: 40,
  Contendor: 50,
  Topper: 65,
}

const clampToPercent = (value) => Math.max(0, Math.min(100, Math.round(value)))

const formatDayKey = (date) => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const splitDurationByDayEndingAt = (completedAt, durationSeconds) => {
  const totalSeconds = Math.max(0, Math.floor(Number(durationSeconds) || 0))
  if (!totalSeconds) return []
  let remainingSeconds = totalSeconds
  let cursorEndMs = completedAt.getTime()
  const chunks = []

  while (remainingSeconds > 0) {
    // If save happened exactly at 00:00:00, attribute elapsed time to the day that just ended.
    const cursorForDay = new Date(Math.max(0, cursorEndMs - 1))
    const dayStartMs = startOfDay(cursorForDay).getTime()
    const secondsInCurrentDay = Math.max(1, Math.floor((cursorEndMs - dayStartMs) / 1000))
    const chunkSeconds = Math.min(remainingSeconds, secondsInCurrentDay)
    chunks.push({
      dayKey: formatDayKey(cursorForDay),
      completedAt: new Date(cursorEndMs).toISOString(),
      durationSeconds: chunkSeconds,
    })
    remainingSeconds -= chunkSeconds
    cursorEndMs -= chunkSeconds * 1000
  }

  return chunks.reverse()
}

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatStopwatch = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`
}

const formatMinutesSmart = (minutesValue) => {
  const totalMinutes = Math.max(0, Math.round(Number(minutesValue) || 0))
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

const resolveElapsedSeconds = (accumulatedSeconds, startedAtMs) => {
  if (!startedAtMs) return Math.max(0, Math.floor(accumulatedSeconds || 0))
  const base = Math.max(0, Math.floor(accumulatedSeconds || 0))
  const delta = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
  return base + delta
}

const formatDateDDMMYYYY = (isoDate) => {
  if (!isoDate) return '--/--/----'
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return '--/--/----'
  return `${day}/${month}/${year}`
}

const parseIsoDate = (isoDate) => {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

const stripHundredMarks = (value) => value.replace(/\s*\(100\s*Marks\)/gi, '').trim()

const fileToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

const resolveOutlineImageCandidates = (sourceUrl, imagePath) => {
  if (!imagePath) return []
  if (/^https?:\/\//i.test(imagePath)) return [imagePath]

  const candidates = new Set()

  // Prefer same-origin media first (works when files are hosted in this app).
  try {
    candidates.add(new URL(imagePath, window.location.origin).toString())
  } catch {
    // ignore URL parse issues and continue fallbacks
  }

  if (imagePath.startsWith('/')) {
    if (sourceUrl) {
      try {
        const origin = new URL(sourceUrl).origin
        candidates.add(`${origin}${imagePath}`)
      } catch {
        // ignore fallback parse failure
      }
    }
    candidates.add(imagePath)
    return Array.from(candidates)
  }
  if (sourceUrl) {
    try {
      candidates.add(new URL(imagePath, sourceUrl).toString())
    } catch {
      // ignore fallback parse failure
    }
  }
  candidates.add(imagePath)
  return Array.from(candidates)
}

const imageUrlToPngDataUrl = async (imageUrl) => {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error('Unable to fetch outline image.')
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw new Error('Fetched resource is not an image.')
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const imageElement = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = objectUrl
    })
    const canvas = document.createElement('canvas')
    canvas.width = imageElement.width
    canvas.height = imageElement.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Unable to prepare image canvas.')
    ctx.drawImage(imageElement, 0, 0)
    return canvas.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** Restore persisted strategy plan; revives examDate after JSON round-trip. */
function normalizePlannerPlanFromStorage(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!Number.isFinite(Number(raw.studyHours)) || !Array.isArray(raw.timetable) || raw.timetable.length === 0) {
    return null
  }
  let examDate = raw.examDate
  if (!(examDate instanceof Date)) {
    const parsed = new Date(examDate)
    if (Number.isNaN(parsed.getTime())) return null
    examDate = parsed
  }
  return { ...raw, examDate }
}

export default function GuardianStudyPlannerPage({ authUser }) {
  const profileStorageKey = `ga-profile-${authUser.id || authUser.username}`
  const [isRemoteProfileHydrated, setIsRemoteProfileHydrated] = useState(() => !(supabase && authUser?.id))
  const [activePlannerTab, setActivePlannerTab] = useState('subjects')
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return {
        ...DEFAULT_PLANNER_FORM,
        ...(profile?.plannerForm || {}),
      }
    } catch {
      return { ...DEFAULT_PLANNER_FORM }
    }
  })
  const [isExamDatePickerOpen, setIsExamDatePickerOpen] = useState(false)
  const [examDatePickerMonth, setExamDatePickerMonth] = useState(() => {
    const parsed = parseIsoDate(form.examDate)
    if (parsed) return new Date(parsed.getFullYear(), parsed.getMonth(), 1)
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [plan, setPlan] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return normalizePlannerPlanFromStorage(profile?.plan) ?? null
    } catch {
      return null
    }
  })
  const [error, setError] = useState('')
  const [slotRemindersEnabled, setSlotRemindersEnabled] = useState(() => {
    try {
      return localStorage.getItem(GA_PLANNER_REMINDER_TOGGLE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [subjectLockerModalMessage, setSubjectLockerModalMessage] = useState('')
  const [selectedOptionalSubjects, setSelectedOptionalSubjects] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const next = profile?.selectedOptionalSubjects
      if (Array.isArray(next)) return next.filter((item) => OPTIONAL_META_MAP[item])
      return []
    } catch {
      return []
    }
  })
  const [selectedCompulsoryElective, setSelectedCompulsoryElective] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = profile?.selectedCompulsoryElective
      const normalizedElective = LEGACY_COMPULSORY_ELECTIVE_TITLE[stored] ?? stored
      if (COMPULSORY_ELECTIVE_OPTIONS.includes(normalizedElective)) return normalizedElective
      return 'Islamiat (100 Marks)'
    } catch {
      return 'Islamiat (100 Marks)'
    }
  })
  const [subjectsLocked, setSubjectsLocked] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return Boolean(profile?.subjectsLocked)
    } catch {
      return false
    }
  })
  const [draggingSubject, setDraggingSubject] = useState('')
  const [outlinePdfUrl, setOutlinePdfUrl] = useState('')
  const outlinePdfDataUrlRef = useRef('')
  const [outlinePdfFileName, setOutlinePdfFileName] = useState('Guardian_Angel_CSS_Course_Outline.pdf')
  const [isGeneratingOutlinePdf, setIsGeneratingOutlinePdf] = useState(false)
  const [weeklyReportPdfUrl, setWeeklyReportPdfUrl] = useState('')
  const weeklyReportPdfDataUrlRef = useRef('')
  const [weeklyReportPdfFileName, setWeeklyReportPdfFileName] = useState(
    'Guardian_Angel_Report.pdf',
  )
  const [isGeneratingWeeklyReportPdf, setIsGeneratingWeeklyReportPdf] = useState(false)
  const [performancePdfUrl, setPerformancePdfUrl] = useState('')
  const performancePdfDataUrlRef = useRef('')
  const [performancePdfFileName, setPerformancePdfFileName] = useState(
    'Guardian_Angel_Performance_Analysis.pdf',
  )
  const [isGeneratingPerformancePdf, setIsGeneratingPerformancePdf] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [completedDays, setCompletedDays] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.completedDays || {}
    } catch {
      return {}
    }
  })
  const [dayStatuses, setDayStatuses] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.dayStatuses || {}
    } catch {
      return {}
    }
  })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null)
  const [timerStatus, setTimerStatus] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const storedStatus = profile?.timerState?.status
      return storedStatus === 'running' || storedStatus === 'paused' ? storedStatus : 'idle'
    } catch {
      return 'idle'
    }
  })
  const [timerAccumulatedSeconds, setTimerAccumulatedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = Number(profile?.timerState?.accumulatedSeconds)
      return Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : 0
    } catch {
      return 0
    }
  })
  const [timerStartedAtMs, setTimerStartedAtMs] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const startedAtMs = Number(profile?.timerState?.startedAtMs)
      const storedStatus = profile?.timerState?.status
      if (storedStatus !== 'running' || !Number.isFinite(startedAtMs)) return null
      return startedAtMs
    } catch {
      return null
    }
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const timerState = profile?.timerState || {}
      const accumulated = Number(timerState.accumulatedSeconds)
      const safeAccumulated = Number.isFinite(accumulated) ? accumulated : 0
      if (timerState.status === 'running' && Number.isFinite(Number(timerState.startedAtMs))) {
        return resolveElapsedSeconds(safeAccumulated, Number(timerState.startedAtMs))
      }
      return Math.max(0, Math.floor(safeAccumulated))
    } catch {
      return 0
    }
  })
  const [timerSessions, setTimerSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.timerSessions || []
    } catch {
      return []
    }
  })
  const [socialTimerStatus, setSocialTimerStatus] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const storedStatus = profile?.socialTimerState?.status
      return storedStatus === 'running' || storedStatus === 'paused' ? storedStatus : 'idle'
    } catch {
      return 'idle'
    }
  })
  const [socialTimerAccumulatedSeconds, setSocialTimerAccumulatedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = Number(profile?.socialTimerState?.accumulatedSeconds)
      return Number.isFinite(stored) ? Math.max(0, Math.floor(stored)) : 0
    } catch {
      return 0
    }
  })
  const [socialTimerStartedAtMs, setSocialTimerStartedAtMs] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const startedAtMs = Number(profile?.socialTimerState?.startedAtMs)
      const storedStatus = profile?.socialTimerState?.status
      if (storedStatus !== 'running' || !Number.isFinite(startedAtMs)) return null
      return startedAtMs
    } catch {
      return null
    }
  })
  const [socialElapsedSeconds, setSocialElapsedSeconds] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const socialTimerState = profile?.socialTimerState || {}
      const accumulated = Number(socialTimerState.accumulatedSeconds)
      const safeAccumulated = Number.isFinite(accumulated) ? accumulated : 0
      if (socialTimerState.status === 'running' && Number.isFinite(Number(socialTimerState.startedAtMs))) {
        return resolveElapsedSeconds(safeAccumulated, Number(socialTimerState.startedAtMs))
      }
      return Math.max(0, Math.floor(safeAccumulated))
    } catch {
      return 0
    }
  })
  const [socialDailyLimitMinutes, setSocialDailyLimitMinutes] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const stored = Number(profile?.socialDailyLimitMinutes)
      if (!Number.isFinite(stored)) return DEFAULT_SOCIAL_DAILY_LIMIT_MINUTES
      return Math.max(10, Math.min(360, Math.round(stored)))
    } catch {
      return DEFAULT_SOCIAL_DAILY_LIMIT_MINUTES
    }
  })
  const [socialTimerSessions, setSocialTimerSessions] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.socialTimerSessions || []
    } catch {
      return []
    }
  })
  const [manualTimerMinutes, setManualTimerMinutes] = useState('')
  const [manualTimerDayKey, setManualTimerDayKey] = useState(() => formatDayKey(new Date()))
  const [manualTimerError, setManualTimerError] = useState('')
  const [subjectPerformanceLevels, setSubjectPerformanceLevels] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.subjectPerformanceLevels || {}
    } catch {
      return {}
    }
  })
  const [draggingPerformanceSubject, setDraggingPerformanceSubject] = useState('')
  const [selectedPerformanceSubject, setSelectedPerformanceSubject] = useState('')
  const [isManualDmcEnabled, setIsManualDmcEnabled] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.isManualDmcEnabled || false
    } catch {
      return false
    }
  })
  const [manualDmcScores, setManualDmcScores] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.manualDmcScores || {}
    } catch {
      return {}
    }
  })
  const [aiExamDraft, setAiExamDraft] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return (
        profile?.aiExamDraft || {
          paperType: 'essay',
          question: '',
          answer: '',
        }
      )
    } catch {
      return {
        paperType: 'essay',
        question: '',
        answer: '',
      }
    }
  })
  const [aiExamResult, setAiExamResult] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      return profile?.aiExamResult || null
    } catch {
      return null
    }
  })
  const [aiExamError, setAiExamError] = useState('')

  useEffect(() => {
    let isCancelled = false
    const loadRemoteProfile = async () => {
      if (!supabase || !authUser?.id) {
        setIsRemoteProfileHydrated(true)
        return
      }
      setIsRemoteProfileHydrated(false)
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('payload')
          .eq('user_id', authUser.id)
          .maybeSingle()
        const payload = data?.payload
        if (!payload || isCancelled) return
        if (payload.plannerForm) setForm((current) => ({ ...current, ...payload.plannerForm }))
        if (payload.selectedCompulsoryElective) setSelectedCompulsoryElective(payload.selectedCompulsoryElective)
        if (Array.isArray(payload.selectedOptionalSubjects)) setSelectedOptionalSubjects(payload.selectedOptionalSubjects)
        if (typeof payload.subjectsLocked === 'boolean') setSubjectsLocked(payload.subjectsLocked)
        if (payload.subjectPerformanceLevels) setSubjectPerformanceLevels(payload.subjectPerformanceLevels)
        if (typeof payload.isManualDmcEnabled === 'boolean') setIsManualDmcEnabled(payload.isManualDmcEnabled)
        if (payload.manualDmcScores) setManualDmcScores(payload.manualDmcScores)
        if (payload.aiExamDraft) setAiExamDraft(payload.aiExamDraft)
        if (payload.aiExamResult) setAiExamResult(payload.aiExamResult)
        const remotePlan = normalizePlannerPlanFromStorage(payload.plan)
        if (remotePlan) setPlan(remotePlan)
        if (payload.completedDays) setCompletedDays(payload.completedDays)
        if (payload.dayStatuses) setDayStatuses(payload.dayStatuses)
        if (Array.isArray(payload.timerSessions)) setTimerSessions(payload.timerSessions)
        if (Array.isArray(payload.socialTimerSessions)) setSocialTimerSessions(payload.socialTimerSessions)
        if (typeof payload.socialDailyLimitMinutes === 'number') setSocialDailyLimitMinutes(payload.socialDailyLimitMinutes)
        if (payload.timerState) {
          setTimerStatus(payload.timerState.status || 'stopped')
          setTimerAccumulatedSeconds(Number(payload.timerState.accumulatedSeconds || 0))
          setTimerStartedAtMs(payload.timerState.startedAtMs || null)
        }
        if (payload.socialTimerState) {
          setSocialTimerStatus(payload.socialTimerState.status || 'stopped')
          setSocialTimerAccumulatedSeconds(Number(payload.socialTimerState.accumulatedSeconds || 0))
          setSocialTimerStartedAtMs(payload.socialTimerState.startedAtMs || null)
        }
      } catch {
        // Keep local profile if remote fetch fails.
      } finally {
        if (!isCancelled) setIsRemoteProfileHydrated(true)
      }
    }
    loadRemoteProfile()
    return () => {
      isCancelled = true
    }
  }, [authUser?.id])

  useEffect(() => {
    if (!isRemoteProfileHydrated) return
      const profilePayload = {
        username: authUser.username,
        fullName: authUser.fullName,
        plannerForm: form,
        plan,
        selectedCompulsoryElective,
        selectedOptionalSubjects,
        subjectsLocked,
        subjectPerformanceLevels,
        isManualDmcEnabled,
        manualDmcScores,
      aiExamDraft,
      aiExamResult,
        completedDays,
        dayStatuses,
        timerSessions,
        socialTimerSessions,
        socialDailyLimitMinutes,
        timerState: {
          status: timerStatus,
          accumulatedSeconds: timerAccumulatedSeconds,
          startedAtMs: timerStartedAtMs,
        },
        socialTimerState: {
          status: socialTimerStatus,
          accumulatedSeconds: socialTimerAccumulatedSeconds,
          startedAtMs: socialTimerStartedAtMs,
        },
      }
    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(profilePayload))
    } catch {
      // Ignore storage failures and continue with in-memory interactions.
    }

    const syncRemoteProfile = async () => {
      if (!supabase || !authUser?.id) return
      try {
        await supabase.from('user_profiles').upsert(
          {
            user_id: authUser.id,
            payload: profilePayload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
      } catch {
        // Keep local profile if remote sync fails.
      }
    }
    syncRemoteProfile()
  }, [
    authUser,
    profileStorageKey,
    isRemoteProfileHydrated,
    form,
    plan,
    selectedCompulsoryElective,
    selectedOptionalSubjects,
    subjectsLocked,
    subjectPerformanceLevels,
    isManualDmcEnabled,
    manualDmcScores,
    aiExamDraft,
    aiExamResult,
    completedDays,
    dayStatuses,
    timerSessions,
    socialTimerSessions,
    socialDailyLimitMinutes,
    timerStatus,
    timerAccumulatedSeconds,
    timerStartedAtMs,
    socialTimerStatus,
    socialTimerAccumulatedSeconds,
    socialTimerStartedAtMs,
  ])

  useEffect(() => {
    if (!isRemoteProfileHydrated) return undefined
    const timerId = window.setTimeout(() => {
      syncPlannerRemindersToNativeAndWeb({
        enabled: slotRemindersEnabled,
        form,
        plan,
      })
    }, 500)
    return () => window.clearTimeout(timerId)
  }, [isRemoteProfileHydrated, slotRemindersEnabled, form, plan])

  useEffect(() => {
    if (timerStatus !== 'running' || !timerStartedAtMs) {
      setElapsedSeconds(Math.max(0, Math.floor(timerAccumulatedSeconds)))
      return undefined
    }
    const syncElapsed = () => {
      setElapsedSeconds(resolveElapsedSeconds(timerAccumulatedSeconds, timerStartedAtMs))
    }
    syncElapsed()
    const timerId = window.setInterval(syncElapsed, 1000)
    window.addEventListener('visibilitychange', syncElapsed)
    window.addEventListener('focus', syncElapsed)
    return () => {
      window.clearInterval(timerId)
      window.removeEventListener('visibilitychange', syncElapsed)
      window.removeEventListener('focus', syncElapsed)
    }
  }, [timerStatus, timerAccumulatedSeconds, timerStartedAtMs])

  useEffect(() => {
    if (socialTimerStatus !== 'running' || !socialTimerStartedAtMs) {
      setSocialElapsedSeconds(Math.max(0, Math.floor(socialTimerAccumulatedSeconds)))
      return undefined
    }
    const syncElapsed = () => {
      setSocialElapsedSeconds(
        resolveElapsedSeconds(socialTimerAccumulatedSeconds, socialTimerStartedAtMs),
      )
    }
    syncElapsed()
    const timerId = window.setInterval(syncElapsed, 1000)
    window.addEventListener('visibilitychange', syncElapsed)
    window.addEventListener('focus', syncElapsed)
    return () => {
      window.clearInterval(timerId)
      window.removeEventListener('visibilitychange', syncElapsed)
      window.removeEventListener('focus', syncElapsed)
    }
  }, [socialTimerStatus, socialTimerAccumulatedSeconds, socialTimerStartedAtMs])

  useEffect(
    () => () => {
      if (outlinePdfUrl) URL.revokeObjectURL(outlinePdfUrl)
      if (weeklyReportPdfUrl) URL.revokeObjectURL(weeklyReportPdfUrl)
      if (performancePdfUrl) URL.revokeObjectURL(performancePdfUrl)
    },
    [outlinePdfUrl, weeklyReportPdfUrl, performancePdfUrl],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }
  const handleExamDateSelect = (date) => {
    const dateKey = formatDayKey(date)
    setForm((current) => ({ ...current, examDate: dateKey }))
    setIsExamDatePickerOpen(false)
  }

  useEffect(() => {
    const parsed = parseIsoDate(form.examDate)
    if (!parsed) return
    setExamDatePickerMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1))
  }, [form.examDate])

  const handleProductiveHourToggle = (slotId) => {
    setForm((current) => {
      const exists = current.productiveHours.includes(slotId)
      const nextHours = exists
        ? current.productiveHours.filter((id) => id !== slotId)
        : [...current.productiveHours, slotId]
      return { ...current, productiveHours: nextHours.sort() }
    })
  }

  const calculateOptionalTotals = (subjects) => {
    const totalMarks = subjects.reduce((sum, subject) => sum + (OPTIONAL_META_MAP[subject]?.marks || 0), 0)
    const totalPapers = subjects.reduce((sum, subject) => {
      const marks = OPTIONAL_META_MAP[subject]?.marks || 100
      return sum + (marks === 200 ? 2 : 1)
    }, 0)
    return { totalMarks, totalPapers }
  }
  const validateGroupIIRule = (subjects) => {
    const groupII = subjects.filter((item) => OPTIONAL_META_MAP[item]?.group === 'Group II')
    if (groupII.length === 0) return { ok: true }
    const count200 = groupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 200).length
    const count100 = groupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 100).length
    const isValidSingle200 = count200 === 1 && groupII.length === 1
    const isValidDouble100 = count200 === 0 && count100 === 2 && groupII.length === 2
    if (isValidSingle200 || isValidDouble100) return { ok: true }
    return {
      ok: false,
      message:
        'Group II rule: select either one 200 marks subject (Physics/Chemistry) or two 100 marks subjects.',
    }
  }

  const canSelectSubject = (subject, currentSubjects) => {
    const meta = OPTIONAL_META_MAP[subject]
    if (!meta) return { ok: false, message: 'Invalid optional subject.' }
    if (currentSubjects.includes(subject)) return { ok: false, message: 'Subject already selected.' }

    const currentGroupII = currentSubjects.filter((item) => OPTIONAL_META_MAP[item]?.group === 'Group II')
    const currentGroupII200 = currentGroupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 200).length
    const currentGroupII100 = currentGroupII.filter((item) => OPTIONAL_META_MAP[item]?.marks === 100).length
    if (meta.group !== 'Group II' && currentGroupII200 === 0 && currentGroupII100 === 1) {
      return {
        ok: false,
        reason: 'group2-incomplete-block',
        message:
          'First complete Group II subjects of 200 marks, or remove subjects from Group II to proceed.',
      }
    }

    const inSameGroup = currentSubjects.filter((item) => OPTIONAL_META_MAP[item]?.group === meta.group)
    if (meta.group === 'Group II') {
      const has200 = inSameGroup.some((item) => OPTIONAL_META_MAP[item]?.marks === 200)
      if (meta.marks === 200 && inSameGroup.length > 0) {
        return { ok: false, message: 'Group II: 200 marks subject cannot be combined with other Group II subjects.' }
      }
      if (meta.marks === 100 && has200) {
        return { ok: false, message: 'Group II already has a 200 marks subject.' }
      }
      if (meta.marks === 100 && inSameGroup.length >= 2) {
        return { ok: false, message: 'Group II allows max two 100 marks subjects.' }
      }
    } else if (inSameGroup.length >= 1) {
      return { ok: false, message: `${meta.group} allows only one subject.` }
    }

    const candidate = [...currentSubjects, subject]
    const { totalMarks, totalPapers } = calculateOptionalTotals(candidate)
    if (totalMarks > 600) return { ok: false, message: 'Optional selection exceeds 600 marks.' }
    if (totalPapers > 6) return { ok: false, message: 'Optional selection exceeds 6 papers.' }
    return { ok: true }
  }

  const handleAddOptionalSubject = (subject) => {
    if (subjectsLocked) return
    setSelectedOptionalSubjects((current) => {
      const currentTotals = calculateOptionalTotals(current)
      if (
        !current.includes(subject) &&
        (currentTotals.totalMarks >= 600 || currentTotals.totalPapers >= 6)
      ) {
        setError('Optional selection is full (600 marks / 6 papers). Remove one subject to add another.')
        return current
      }
      const validation = canSelectSubject(subject, current)
      if (!validation.ok) {
        if (validation.reason === 'group2-incomplete-block') {
          setSubjectLockerModalMessage(validation.message)
          setError('')
          return current
        }
        setError(validation.message)
        return current
      }
      setSubjectLockerModalMessage('')
      setError('')
      return [...current, subject]
    })
  }

  const handleOptionalDrop = (groupName, event) => {
    event.preventDefault()
    if (subjectsLocked) return
    const subject = event.dataTransfer.getData('text/plain') || draggingSubject
    if (!subject) return
    const meta = OPTIONAL_META_MAP[subject]
    if (!meta || meta.group !== groupName) {
      setError('Drop each subject in its own syllabus group box.')
      return
    }
    handleAddOptionalSubject(subject)
    setDraggingSubject('')
  }

  const handleOptionalSubjectRemove = (subject) => {
    if (subjectsLocked) return
    setSelectedOptionalSubjects((current) => current.filter((item) => item !== subject))
    setSubjectLockerModalMessage('')
    setError('')
  }

  const handleLockSubjects = () => {
    if (!selectedCompulsoryElective) {
      setError('Select one compulsory option (Islamiat or Comparative Study of Major Religions).')
      return
    }
    const groupIIValidation = validateGroupIIRule(selectedOptionalSubjects)
    if (!groupIIValidation.ok) {
      setError(groupIIValidation.message)
      return
    }
    const { totalMarks, totalPapers } = calculateOptionalTotals(selectedOptionalSubjects)
    if (totalMarks !== 600 || totalPapers !== 6) {
      setError('Lock requires exactly 600 optional marks and 6 papers.')
      return
    }
    setError('')
    setSubjectsLocked(true)
  }

  const handleUnlockSubjects = () => {
    setSubjectsLocked(false)
  }

  const handleGenerateCourseOutlinePdf = async () => {
    if (!subjectsLocked) {
      setError('Lock subjects first, then generate your finalized course outline PDF.')
      return
    }

    const compulsoryFinal = [...PLANNER_CORE_COMPULSORY_SUBJECTS, selectedCompulsoryElective].map((title) => ({
      kind: 'Compulsory',
      displayTitle: stripHundredMarks(title),
      sourceTitle: title,
    }))
    const optionalFinal = selectedOptionalPapers.map((item) => ({
      kind: 'Optional',
      displayTitle: stripHundredMarks(item.paper),
      sourceTitle: item.sourceSubject,
      group: item.group,
    }))
    const finalizedSubjects = [...compulsoryFinal, ...optionalFinal]

    if (finalizedSubjects.length !== 12) {
      setError('Finalized selection must contain exactly 12 subjects/papers before PDF generation.')
      return
    }

    setError('')
    setIsGeneratingOutlinePdf(true)
    try {
      const [{ jsPDF }, { detailedSubjectPages }] = await Promise.all([
        import('jspdf'),
        import('../data/subjectPagesData.js'),
      ])
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 42
      const maxTextWidth = pageWidth - marginX * 2
      const pageBottom = pageHeight - 48
      const contentStartY = 48
      let y = contentStartY

      let watermarkDataUrl = ''
      try {
        const watermarkResponse = await fetch(WATERMARK_IMAGE_URL)
        if (watermarkResponse.ok) {
          watermarkDataUrl = await fileToDataUrl(await watermarkResponse.blob())
        }
      } catch {
        watermarkDataUrl = ''
      }

      const applyWatermark = () => {
        if (!watermarkDataUrl) return
        const width = pageWidth - 24
        const height = pageHeight * 0.476
        doc.addImage(
          watermarkDataUrl,
          'PNG',
          (pageWidth - width) / 2,
          (pageHeight - height) / 2,
          width,
          height,
        )
      }

      const ensureSpace = (neededHeight = 20) => {
        if (y + neededHeight <= pageBottom) return
        doc.addPage()
        applyWatermark()
        y = contentStartY
      }

      const drawWrappedText = (text, options = {}) => {
        const { fontSize = 10.5, lineHeight = 14, indent = 0, fontStyle = 'normal' } = options
        const lines = doc.splitTextToSize(text, maxTextWidth - indent)
        ensureSpace(lines.length * lineHeight + 2)
        doc.setFont('helvetica', fontStyle)
        doc.setFontSize(fontSize)
        lines.forEach((line) => {
          doc.text(line, marginX + indent, y)
          y += lineHeight
        })
      }

      // Cover page
      applyWatermark()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(34)
      doc.text('Guardian Angel', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' })
      doc.setFontSize(28)
      doc.text('Finalized CSS Course Outline', pageWidth / 2, pageHeight / 2 + 12, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(`Candidate: ${authUser.fullName || authUser.username}`, pageWidth / 2, pageHeight - 34, {
        align: 'center',
      })

      // Table of contents placeholder page
      doc.addPage()
      applyWatermark()
      const tocPage = doc.getNumberOfPages()

      // Subject content pages
      const tocEntries = []
      for (let index = 0; index < finalizedSubjects.length; index += 1) {
        const subject = finalizedSubjects[index]
        const source = detailedSubjectPages.find((item) => item.title === subject.sourceTitle)
        const subjectPage = doc.getNumberOfPages() + 1
        tocEntries.push({
          title: subject.displayTitle,
          page: subjectPage,
        })

        doc.addPage()
        applyWatermark()
        y = contentStartY

        drawWrappedText(`${index + 1}. ${subject.displayTitle}`, {
          fontSize: 16,
          lineHeight: 20,
          fontStyle: 'bold',
        })
        y += 6

        if (source?.outlineSections?.length) {
          source.outlineSections.forEach((section) => {
            drawWrappedText(section.heading, { fontSize: 12.8, lineHeight: 17, fontStyle: 'bold' })
            if (section.points?.length) {
              section.points.forEach((point) =>
                drawWrappedText(`- ${point}`, {
                  fontSize: 11.2,
                  lineHeight: 15,
                  indent: 8,
                }),
              )
            }
            y += 4
          })
        } else if (source?.outline?.length) {
          drawWrappedText('Course Outline', { fontSize: 12.8, lineHeight: 17, fontStyle: 'bold' })
          source.outline.forEach((point) =>
            drawWrappedText(`- ${point}`, {
              fontSize: 11.2,
              lineHeight: 15,
              indent: 8,
            }),
          )
        } else if (LOCAL_OUTLINE_IMAGE_URLS[source?.sourceSlug]?.length || source?.outlineImages?.length) {
          const imageList =
            LOCAL_OUTLINE_IMAGE_URLS[source?.sourceSlug] || source.outlineImages || []
          for (const imagePath of imageList) {
            const imageCandidates = /^https?:\/\//i.test(imagePath)
              ? [imagePath]
              : resolveOutlineImageCandidates(source.sourceUrl, imagePath)
            let imageAdded = false
            for (const imageUrl of imageCandidates) {
              try {
                const imageDataUrl = await imageUrlToPngDataUrl(imageUrl)
                const imageProps = doc.getImageProperties(imageDataUrl)
                if (pageBottom - y < 220) {
                  doc.addPage()
                  applyWatermark()
                  y = contentStartY
                  drawWrappedText(`${index + 1}. ${subject.displayTitle}`, {
                    fontSize: 16,
                    lineHeight: 20,
                    fontStyle: 'bold',
                  })
                  y += 6
                }

                const maxImageHeight = Math.min(pageHeight * 0.78, pageBottom - y - 8)
                const aspect = imageProps.height / imageProps.width
                let drawWidth = maxTextWidth
                let drawHeight = drawWidth * aspect
                if (drawHeight > maxImageHeight) {
                  drawHeight = maxImageHeight
                  drawWidth = drawHeight / aspect
                }
                ensureSpace(drawHeight + 12)
                const centeredX = marginX + (maxTextWidth - drawWidth) / 2
                doc.addImage(imageDataUrl, 'PNG', centeredX, y, drawWidth, drawHeight)
                y += drawHeight + 10
                imageAdded = true
                break
              } catch {
                // Try next candidate URL.
              }
            }
            if (!imageAdded) {
              drawWrappedText(`- Outline image could not be loaded from available sources.`, {
                fontSize: 9.6,
                lineHeight: 13,
                indent: 8,
              })
            }
          }
        } else {
          drawWrappedText('Detailed outline is currently unavailable for this subject.', {
            fontSize: 10,
            lineHeight: 14,
            indent: 8,
          })
        }

        y += 10
        ensureSpace(18)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('*****************************************************', pageWidth / 2, y, {
          align: 'center',
        })
        y += 16
      }

      // Fill table of contents
      doc.setPage(tocPage)
      y = 56
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.text('Table of Contents', pageWidth / 2, y, { align: 'center' })
      y += 56
      const tocSubjectFontSize = 16
      const tocPageNumberFontSize = 14
      const tocLineHeight = 22
      const tocRowGap = 14 // approx one line break between entries
      tocEntries.forEach((entry, index) => {
        const subjectLabel = `${index + 1}. ${entry.title}`
        const pageLabel = `Page ${entry.page}`
        const pageLabelWidth = doc.getTextWidth(pageLabel)
        const maxSubjectWidth = maxTextWidth - pageLabelWidth - 20
        const subjectLines = doc.splitTextToSize(subjectLabel, maxSubjectWidth)

        ensureSpace(subjectLines.length * tocLineHeight + tocRowGap)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(tocSubjectFontSize)
        subjectLines.forEach((line, lineIndex) => {
          doc.text(line, marginX, y)
          if (lineIndex === 0) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(tocPageNumberFontSize)
            doc.text(pageLabel, pageWidth - marginX, y, { align: 'right' })
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(tocSubjectFontSize)
          }
          y += tocLineHeight
        })
        y += tocRowGap
      })

      // Footer page numbers
      const totalPages = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(
          `Page ${pageNumber} of ${totalPages}`,
          pageWidth - marginX,
          pageHeight - 18,
          { align: 'right' },
        )
      }

      const blob = doc.output('blob')
      const nextPdfDataUrl = doc.output('datauristring')
      const nextPdfUrl = URL.createObjectURL(blob)
      outlinePdfDataUrlRef.current = nextPdfDataUrl
      setOutlinePdfUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextPdfUrl
      })

      const stamp = new Date()
      const fileStamp = `${stamp.getFullYear()}-${`${stamp.getMonth() + 1}`.padStart(2, '0')}-${`${stamp.getDate()}`.padStart(2, '0')}`
      setOutlinePdfFileName(`Guardian_Angel_Finalized_CSS_Outline_${fileStamp}.pdf`)
    } catch {
      setError('Unable to generate course outline PDF. Please try again.')
    } finally {
      setIsGeneratingOutlinePdf(false)
    }
  }

  const handleGeneratePlan = (event) => {
    event.preventDefault()
    setError('')

    const examDate = new Date(`${form.examDate}T23:59:59`)
    const today = startOfDay(new Date())
    const remainingDays = Math.ceil((examDate - today) / MS_PER_DAY)
    const studyHours = Number(form.studyHours)

    if (!form.examDate || Number.isNaN(examDate.getTime())) {
      setError('Please provide a valid CSS exam date.')
      return
    }
    if (remainingDays <= 0) {
      setError('Exam date should be in the future so the planner can generate a timeline.')
      return
    }
    if (!Number.isFinite(studyHours) || studyHours < 2 || studyHours > 14) {
      setError('Please enter realistic study hours between 2 and 14.')
      return
    }
    if (!Array.isArray(form.productiveHours) || form.productiveHours.length === 0) {
      setError('Select at least one productive one hour slot.')
      return
    }

    const stageShareMap = {
      beginner: { lecture: 0.44, selfStudy: 0.36, revision: 0.2 },
      revision: { lecture: 0.2, selfStudy: 0.35, revision: 0.45 },
      'mock-exams': { lecture: 0.12, selfStudy: 0.28, revision: 0.6 },
    }
    const stageShares = stageShareMap[form.stage] || stageShareMap.beginner
    let lectureShare = stageShares.lecture
    let selfStudyShare = stageShares.selfStudy
    let revisionShare = stageShares.revision

    if (form.learningPreference === 'lectures-first') {
      lectureShare += 0.06
      selfStudyShare -= 0.03
      revisionShare -= 0.03
    } else {
      lectureShare -= 0.03
      selfStudyShare += 0.04
      revisionShare -= 0.01
    }

    if (form.difficulty === 'easy') {
      lectureShare += 0.03
      revisionShare -= 0.03
    } else if (form.difficulty === 'extremely difficult') {
      lectureShare -= 0.03
      revisionShare += 0.05
      selfStudyShare -= 0.02
    }

    lectureShare = Math.max(0.15, lectureShare)
    selfStudyShare = Math.max(0.25, selfStudyShare)
    revisionShare = Math.max(0.2, revisionShare)
    const normalizedTotal = lectureShare + selfStudyShare + revisionShare
    lectureShare /= normalizedTotal
    selfStudyShare /= normalizedTotal
    revisionShare /= normalizedTotal

    const attemptFactorMap = { first: 1, second: 1.07, third: 1.12 }
    const difficultyFactorMap = { easy: 0.92, moderate: 1, difficult: 1.09, 'extremely difficult': 1.16 }
    const urgencyFactor = remainingDays > 150 ? 0.95 : remainingDays > 90 ? 1 : remainingDays > 45 ? 1.08 : 1.16
    const attemptFactor = attemptFactorMap[form.cssAttempt] || 1
    const difficultyFactor = difficultyFactorMap[form.difficulty] || 1
    const productivityFactor = Math.min(1.16, 0.9 + form.productiveHours.length * 0.02)
    const effectiveStudyHours = Math.min(
      14,
      Number((studyHours * urgencyFactor * attemptFactor * difficultyFactor * productivityFactor).toFixed(2)),
    )

    const lectureHours = Number((effectiveStudyHours * lectureShare).toFixed(1))
    const selfStudyHours = Number((effectiveStudyHours * selfStudyShare).toFixed(1))
    const revisionHours = Number((effectiveStudyHours - lectureHours - selfStudyHours).toFixed(1))

    const selectedSlots = PRODUCTIVE_HOUR_OPTIONS.filter((slot) =>
      form.productiveHours.includes(slot.id),
    ).sort((a, b) => a.startHour - b.startHour)
    let cursor = (selectedSlots[0]?.startHour || 7) * 60
    const sessionBlocks = [
      {
        title: 'Lecture Session',
        durationMinutes: Math.round(lectureHours * 60),
        focus: 'Watch lectures and make short concept notes.',
      },
      {
        title: 'Self Study Session',
        durationMinutes: Math.round(selfStudyHours * 60),
        focus: 'Read syllabus topics, solve questions, and build recall.',
      },
      {
        title: 'Revision Session',
        durationMinutes: Math.round(Math.max(45, revisionHours * 60)),
        focus: 'Revise key notes and practice answer structuring.',
      },
    ]

    const timetable = sessionBlocks.map((block, index) => {
      const start = cursor
      const end = cursor + block.durationMinutes
      cursor = end
      if (index < sessionBlocks.length - 1) cursor += 15
      return {
        ...block,
        timeRange: `${formatClock(start)} - ${formatClock(end)}`,
      }
    })

    const weeklyConsolidation = []
    for (let dayOffset = 6; dayOffset < remainingDays; dayOffset += 7) {
      weeklyConsolidation.push(formatDayKey(addDays(today, dayOffset)))
    }

    const phaseStrategy =
      remainingDays > 120
        ? [
            'Phase 1 (Foundation): 45% of timeline for concept clarity and lectures.',
            'Phase 2 (Coverage): 35% for topic completion and answer writing.',
            'Phase 3 (Final Revision): 20% for mocks and quick revision cycles.',
          ]
        : remainingDays > 60
          ? [
              'Phase 1 (Acceleration): 55% for focused coverage of core topics.',
              'Phase 2 (Revision + Practice): 45% for test practice and weak area repair.',
            ]
          : [
              'Phase 1 (High Intensity Revision): 70% for revision, recall, and past paper practice.',
              'Phase 2 (Final Polishing): 30% for exam like timed practice and confidence building.',
            ]

    setPlan({
      examDate,
      remainingDays,
      studyHours,
      effectiveStudyHours,
      lectureHours,
      selfStudyHours,
      revisionHours,
      timetable,
      weeklyConsolidation,
      phaseStrategy,
      selectedSlots: selectedSlots.map((slot) => slot.label),
      breakPlan: [
        'Take a 10-minute break after every 50 minutes of deep study.',
        'After every 3 focused blocks, take a 25-30 minute recovery break.',
        'Sleep target: at least 7 hours daily to protect retention and consistency.',
      ],
    })
  }

  const handleGenerateWeeklyReportPdf = async () => {
    setIsGeneratingWeeklyReportPdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 42
      const maxWidth = pageWidth - marginX * 2
      const pageBottom = pageHeight - 42
      let y = 56
      const generatedAt = new Date()
      const generatedDateLabel = generatedAt.toLocaleDateString('en-GB')
      const generatedTimeLabel = generatedAt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })

      let watermarkDataUrl = ''
      try {
        const watermarkResponse = await fetch(WATERMARK_IMAGE_URL)
        if (watermarkResponse.ok) {
          watermarkDataUrl = await fileToDataUrl(await watermarkResponse.blob())
        }
      } catch {
        watermarkDataUrl = ''
      }

      const applyWatermark = () => {
        if (!watermarkDataUrl) return
        const width = pageWidth - 24
        const height = pageHeight * 0.476
        doc.addImage(
          watermarkDataUrl,
          'PNG',
          (pageWidth - width) / 2,
          (pageHeight - height) / 2,
          width,
          height,
        )
      }

      const ensureSpace = (needed = 20) => {
        if (y + needed <= pageBottom) return
        doc.addPage()
        applyWatermark()
        y = 52
      }
      const drawText = (text, options = {}) => {
        const { size = 11, lineHeight = 15, style = 'normal', bullet = false } = options
        const prefix = bullet ? '- ' : ''
        const lines = doc.splitTextToSize(`${prefix}${text}`, maxWidth)
        ensureSpace(lines.length * lineHeight + 4)
        doc.setFont('helvetica', style)
        doc.setFontSize(size)
        lines.forEach((line) => {
          doc.text(line, marginX, y)
          y += lineHeight
        })
      }
      const drawSection = (title) => {
        ensureSpace(26)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(title, marginX, y)
        y += 18
      }
      // Not used by the current report layout; kept for the planned DMC-style results table.
      const _drawDmcStyleTable = (title, rows, sectionType) => {
        const tableWidth = maxWidth
        const columnWidths = [tableWidth * 0.43, tableWidth * 0.14, tableWidth * 0.14, tableWidth * 0.14, tableWidth * 0.15]
        const rowPaddingY = 5
        const defaultRowHeight = 20
        const borderColor = [168, 168, 168]
        const titleFill = [25, 85, 147]
        const headerFill = [232, 236, 242]

        const passingFor = (totalMarks) => {
          if (sectionType === 'optional') return totalMarks >= 200 ? 66 : 33
          if (totalMarks >= 300) return 120
          if (totalMarks >= 200) return 80
          return 40
        }
        const normalizedRows = rows.map((row) => {
          const totalMarks = Number.isFinite(Number(row.maxMarks)) ? Math.max(0, Number(row.maxMarks)) : 100
          const marksObtained = Number.isFinite(Number(row.score)) ? Math.round(Number(row.score)) : 0
          return {
            subject: String(row.subject || ''),
            totalMarks,
            passingMarks: passingFor(totalMarks),
            marksObtained,
            accepted: marksObtained,
          }
        })
        const subtotalTotal = normalizedRows.reduce((sum, row) => sum + row.totalMarks, 0)
        const subtotalObtained = normalizedRows.reduce((sum, row) => sum + row.marksObtained, 0)

        const drawTableHeader = () => {
          ensureSpace(48)
          doc.setDrawColor(...borderColor)
          doc.setFillColor(...titleFill)
          doc.rect(marginX, y, tableWidth, 18, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.text(title.toUpperCase(), marginX + 8, y + 12)
          y += 18

          doc.setFillColor(...headerFill)
          doc.rect(marginX, y, tableWidth, 22, 'F')
          doc.setTextColor(40, 40, 40)
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(9.4)
          const headerLabels = [
            'Subject',
            'Total Marks',
            'Passing Marks',
            'Marks Obtained',
            'Accepted',
          ]
          let x = marginX
          headerLabels.forEach((label, index) => {
            doc.rect(x, y, columnWidths[index], 22)
            doc.text(label, x + (index === 0 ? 6 : columnWidths[index] / 2), y + 14, {
              align: index === 0 ? 'left' : 'center',
            })
            x += columnWidths[index]
          })
          y += 22
        }
        const drawRow = (row, isSummary = false) => {
          doc.setFont('helvetica', isSummary ? 'bold' : 'normal')
          doc.setFontSize(9.6)
          const subjectLines = doc.splitTextToSize(row.subject, columnWidths[0] - 10)
          const rowHeight = Math.max(defaultRowHeight, subjectLines.length * 11 + rowPaddingY * 2)
          ensureSpace(rowHeight + 2)
          if (y + rowHeight > pageBottom) {
            doc.addPage()
            applyWatermark()
            y = 52
            drawTableHeader()
          }
          let x = marginX
          const values = [
            row.subject,
            String(row.totalMarks),
            String(row.passingMarks),
            String(row.marksObtained),
            String(row.accepted),
          ]
          values.forEach((value, index) => {
            doc.setDrawColor(...borderColor)
            doc.rect(x, y, columnWidths[index], rowHeight)
            if (index === 0) {
              let textY = y + rowPaddingY + 8
              subjectLines.forEach((line) => {
                doc.text(line, x + 6, textY)
                textY += 11
              })
            } else {
              doc.text(value, x + columnWidths[index] / 2, y + rowHeight / 2 + 3, {
                align: 'center',
              })
            }
            x += columnWidths[index]
          })
          y += rowHeight
        }

        drawTableHeader()
        if (normalizedRows.length === 0) {
          drawRow(
            {
              subject: 'No subjects available in this section.',
              totalMarks: 0,
              passingMarks: 0,
              marksObtained: 0,
              accepted: 0,
            },
            false,
          )
        } else {
          normalizedRows.forEach((row) => drawRow(row))
          drawRow(
            {
              subject: `${title} Total`,
              totalMarks: subtotalTotal,
              passingMarks: passingFor(subtotalTotal),
              marksObtained: subtotalObtained,
              accepted: subtotalObtained,
            },
            true,
          )
        }
        y += 10
      }

      applyWatermark()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.text('Guardian Angel Candidate Report', marginX, y)
      y += 24
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Candidate: ${authUser.fullName || authUser.username}`, marginX, y)
      y += 16
      doc.text(`Generated on: ${generatedDateLabel} at ${generatedTimeLabel}`, marginX, y)
      y += 20

      drawSection('Executive Readiness Snapshot')
      drawText(`Overall readiness score: ${guardianOverallScore}/100`, { style: 'bold' })
      drawText(`Status interpretation: ${guardianOverallStatus}`)
      drawText(
        `Weekly completion: ${weeklyProgressPercent.toFixed(0)}% | Social overuse today: ${socialOveruseMinutes} min | Current streak: ${currentStudyStreak} day(s).`,
      )
      y += 8

      drawSection('Module by Module Assessment')
      guardianReportRows.forEach((row) => {
        drawText(`${row.label}: ${row.score}%`, { style: 'bold' })
        drawText(row.note)
      })

      drawSection('Expected DMC Projection')
      drawText(
        `Scoring mode: ${isManualDmcEnabled ? 'Manual adjustment enabled in DMC section' : 'Auto level based scoring (Survivor 40, Contendor 50, Topper 65)'}`,
      )
      drawText(
        `Projected total marks: ${projectedScoreTotal} / ${projectedMaxTotal} (${projectedScoreBand.toUpperCase()} band)`,
        { style: 'bold' },
      )
      drawText(
        `Compulsory subtotal: ${compulsoryScoreRows.reduce((sum, item) => sum + item.score, 0)} / ${compulsoryScoreRows.length * 100}`,
      )
      drawText(
        `Optionals subtotal: ${optionalScoreRows.reduce((sum, item) => sum + item.score, 0)} / ${optionalScoreRows.length * 100}`,
      )
      drawText('Compulsory detail:', { style: 'bold' })
      if (compulsoryScoreRows.length > 0) {
        compulsoryScoreRows.forEach((item) =>
          drawText(`${item.subject} | ${item.level} | ${item.score} marks`, { bullet: true }),
        )
      } else {
        drawText('No compulsory subjects found in current mapping.', { bullet: true })
      }
      drawText('Optional detail:', { style: 'bold' })
      if (optionalScoreRows.length > 0) {
        optionalScoreRows.forEach((item) =>
          drawText(`${item.subject} | ${item.level} | ${item.score} marks`, { bullet: true }),
        )
      } else {
        drawText('No optional subjects found in current mapping.', { bullet: true })
      }

      drawSection('Performance Intelligence')
      drawText(
        `Strong (Topper): ${strongSubjects.length} | Competitive (Contendor): ${competitiveSubjects.length} | Weak (Survivor): ${weakSubjects.length}`,
      )
      if (strongSubjects.length > 0) {
        drawText(`Strong subjects: ${strongSubjects.join(', ')}`)
      }
      if (competitiveSubjects.length > 0) {
        drawText(`Competitive subjects: ${competitiveSubjects.join(', ')}`)
      }
      if (weakSubjects.length > 0) {
        drawText(`Weak subjects needing uplift: ${weakSubjects.join(', ')}`)
      }

      drawSection('Timer and Calendar Evidence')
      drawText(`Today studied: ${studiedTodayMinutes} min | Daily target: ${requiredDailyMinutes || 0} min`)
      drawText(
        `Weekly studied: ${totalWeekStudiedMinutes} min | Weekly required: ${totalWeekRequiredMinutes} min | Completion: ${weeklyProgressPercent.toFixed(0)}%`,
      )
      drawText(
        `Calendar tagged days: ${calendarTaggedDays} | Completed: ${calendarCompletedDays} | Revision: ${calendarRevisionDays} | Mock tests: ${calendarMockDays} | Skipped: ${calendarSkippedDays}`,
      )

      drawSection('Critical Risks and Recommendations')
      const risks =
        guardianRiskSignals.length > 0
          ? guardianRiskSignals
          : ['No major risk cluster detected currently. Maintain current consistency.']
      risks.forEach((risk) => drawText(risk, { bullet: true }))

      drawSection('Focus Recovery Protocol')
      if (focusRecoveryProtocol) {
        drawText(
          `Backlog: ${focusRecoveryProtocol.backlogMinutes} min | Safe cap: ${focusRecoveryProtocol.maxExtraPerDay} min/day`,
        )
        focusRecoveryProtocol.recoveryDays.forEach((day) => {
          drawText(`${day.dayLabel}: +${day.extraMinutes} min (target ${day.totalTarget} min)`, {
            bullet: true,
          })
        })
      } else {
        drawText('No catch up needed this week. Keep current execution momentum.')
      }

      drawSection('Next Week Targets')
      nextWeekTargets.forEach((target) => drawText(target, { bullet: true }))
      drawSection('Next Cycle Action Plan')
      guardianActionPlan.forEach((item) => drawText(item, { bullet: true }))

      drawSection('Closing Note')
      drawText(
        'This report is generated by Guardian Angel to provide a measurable, structured, and actionable view of current CSS preparation quality.',
      )
      drawText(
        'Execute this plan with discipline over the next 14 days and regenerate this report to track progress objectively.',
      )

      const totalPages = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, pageHeight - 18, {
          align: 'right',
        })
      }

      const blob = doc.output('blob')
      const nextPdfDataUrl = doc.output('datauristring')
      const nextPdfUrl = URL.createObjectURL(blob)
      weeklyReportPdfDataUrlRef.current = nextPdfDataUrl
      setWeeklyReportPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextPdfUrl
      })
      const fileStamp = `${generatedAt.getFullYear()}-${`${generatedAt.getMonth() + 1}`.padStart(2, '0')}-${`${generatedAt.getDate()}`.padStart(2, '0')}`
      setWeeklyReportPdfFileName(`Guardian_Angel_Report_${fileStamp}.pdf`)
    } catch {
      setError('Unable to generate Guardian Angel report PDF. Please try again.')
    } finally {
      setIsGeneratingWeeklyReportPdf(false)
    }
  }
  const handleGeneratePerformanceAnalysisPdf = async () => {
    if (performanceRows.length === 0) {
      setError('No performance data available yet. Add and classify subjects first.')
      return
    }

    setError('')
    setIsGeneratingPerformancePdf(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 42
      const maxWidth = pageWidth - marginX * 2
      const pageBottom = pageHeight - 42
      let y = 56
      const generatedAt = new Date()
      const generatedDateLabel = generatedAt.toLocaleDateString('en-GB')
      const generatedTimeLabel = generatedAt.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })

      let watermarkDataUrl = ''
      try {
        const watermarkResponse = await fetch(WATERMARK_IMAGE_URL)
        if (watermarkResponse.ok) {
          watermarkDataUrl = await fileToDataUrl(await watermarkResponse.blob())
        }
      } catch {
        watermarkDataUrl = ''
      }

      const applyWatermark = () => {
        if (!watermarkDataUrl) return
        const width = pageWidth - 24
        const height = pageHeight * 0.476
        doc.addImage(
          watermarkDataUrl,
          'PNG',
          (pageWidth - width) / 2,
          (pageHeight - height) / 2,
          width,
          height,
        )
      }
      const ensureSpace = (needed = 20) => {
        if (y + needed <= pageBottom) return
        doc.addPage()
        applyWatermark()
        y = 52
      }
      const drawText = (text, options = {}) => {
        const { size = 11, lineHeight = 15, style = 'normal', bullet = false } = options
        const prefix = bullet ? '- ' : ''
        const lines = doc.splitTextToSize(`${prefix}${text}`, maxWidth)
        ensureSpace(lines.length * lineHeight + 4)
        doc.setFont('helvetica', style)
        doc.setFontSize(size)
        lines.forEach((line) => {
          doc.text(line, marginX, y)
          y += lineHeight
        })
      }
      const drawSection = (title) => {
        ensureSpace(26)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.text(title, marginX, y)
        y += 18
      }

      applyWatermark()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(24)
      doc.text('Guardian Angel Performance Analysis', marginX, y)
      y += 24
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.text(`Candidate: ${authUser.fullName || authUser.username}`, marginX, y)
      y += 16
      doc.text(`Generated on: ${generatedDateLabel} at ${generatedTimeLabel}`, marginX, y)
      y += 20

      drawSection('Projected CSS DMC Snapshot')
      drawText(
        `Projected total marks: ${projectedScoreTotal} / ${projectedMaxTotal} (${projectedScoreBand.toUpperCase()} band)`,
        { style: 'bold' },
      )
      drawText(
        `Compulsory subtotal: ${compulsoryScoreRows.reduce((sum, item) => sum + item.score, 0)} / ${compulsoryScoreRows.length * 100}`,
      )
      drawText(
        `Optionals subtotal: ${optionalScoreRows.reduce((sum, item) => sum + item.score, 0)} / ${optionalScoreRows.length * 100}`,
      )
      drawText('Compulsory detail:', { style: 'bold' })
      if (compulsoryScoreRows.length > 0) {
        compulsoryScoreRows.forEach((item) =>
          drawText(`${item.subject} | ${item.level} | ${item.score} marks`, { bullet: true }),
        )
      } else {
        drawText('No compulsory subjects found in current mapping.', { bullet: true })
      }
      drawText('Optional detail:', { style: 'bold' })
      if (optionalScoreRows.length > 0) {
        optionalScoreRows.forEach((item) =>
          drawText(`${item.subject} | ${item.level} | ${item.score} marks`, { bullet: true }),
        )
      } else {
        drawText('No optional subjects found in current mapping.', { bullet: true })
      }

      drawSection('Overall Status and Action Guidance')
      drawText(`Overall preparation status: ${overallPerformanceStatus}`)
      drawText(
        `Strong subjects (Topper): ${strongSubjects.length ? strongSubjects.join(', ') : 'None assigned yet.'}`,
      )
      drawText(
        `Competitive subjects (Contendor): ${
          competitiveSubjects.length ? competitiveSubjects.join(', ') : 'None assigned yet.'
        }`,
      )
      drawText(
        `Weak subjects (Survivor): ${weakSubjects.length ? weakSubjects.join(', ') : 'None assigned yet.'}`,
      )
      y += 4
      drawText('Constructive feedback:', { style: 'bold' })
      performanceAdvice.forEach((line) => drawText(line, { bullet: true }))

      const totalPages = doc.getNumberOfPages()
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, pageHeight - 18, {
          align: 'right',
        })
      }

      const blob = doc.output('blob')
      const nextPdfDataUrl = doc.output('datauristring')
      const nextPdfUrl = URL.createObjectURL(blob)
      performancePdfDataUrlRef.current = nextPdfDataUrl
      setPerformancePdfUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextPdfUrl
      })
      const fileStamp = `${generatedAt.getFullYear()}-${`${generatedAt.getMonth() + 1}`.padStart(2, '0')}-${`${generatedAt.getDate()}`.padStart(2, '0')}`
      setPerformancePdfFileName(`Guardian_Angel_Performance_Analysis_${fileStamp}.pdf`)
    } catch {
      setError('Unable to generate performance analysis PDF. Please try again.')
    } finally {
      setIsGeneratingPerformancePdf(false)
    }
  }
  const handleViewPerformancePdf = async () => {
    if (!performancePdfUrl && !performancePdfDataUrlRef.current) return
    setError('')
    const handled = await handlePdfAction({
      dataUrl: performancePdfDataUrlRef.current,
      blobUrl: performancePdfUrl,
      fileName: performancePdfFileName,
      action: 'view',
    })
    if (handled) return
    const opened = window.open(performancePdfUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      setError('Popup was blocked. Please allow popups to open the PDF in a new tab.')
    }
  }
  const handleDownloadPerformancePdf = async () => {
    if (!performancePdfUrl && !performancePdfDataUrlRef.current) return
    setError('')
    await handlePdfAction({
      dataUrl: performancePdfDataUrlRef.current,
      blobUrl: performancePdfUrl,
      fileName: performancePdfFileName,
      action: 'download',
    })
  }
  const handleViewOutlinePdf = async () => {
    if (!outlinePdfUrl && !outlinePdfDataUrlRef.current) return
    setError('')
    await handlePdfAction({
      dataUrl: outlinePdfDataUrlRef.current,
      blobUrl: outlinePdfUrl,
      fileName: outlinePdfFileName,
      action: 'view',
    })
  }
  const handleDownloadOutlinePdf = async () => {
    if (!outlinePdfUrl && !outlinePdfDataUrlRef.current) return
    setError('')
    await handlePdfAction({
      dataUrl: outlinePdfDataUrlRef.current,
      blobUrl: outlinePdfUrl,
      fileName: outlinePdfFileName,
      action: 'download',
    })
  }
  const handleViewWeeklyReportPdf = async () => {
    if (!weeklyReportPdfUrl && !weeklyReportPdfDataUrlRef.current) return
    setError('')
    await handlePdfAction({
      dataUrl: weeklyReportPdfDataUrlRef.current,
      blobUrl: weeklyReportPdfUrl,
      fileName: weeklyReportPdfFileName,
      action: 'view',
    })
  }
  const handleDownloadWeeklyReportPdf = async () => {
    if (!weeklyReportPdfUrl && !weeklyReportPdfDataUrlRef.current) return
    setError('')
    await handlePdfAction({
      dataUrl: weeklyReportPdfDataUrlRef.current,
      blobUrl: weeklyReportPdfUrl,
      fileName: weeklyReportPdfFileName,
      action: 'download',
    })
  }

  const handleTimerStart = () => {
    if (timerStatus === 'running') return
    if (timerStatus === 'idle') {
      setTimerAccumulatedSeconds(0)
      setElapsedSeconds(0)
    }
    setTimerStartedAtMs(Date.now())
    setTimerStatus('running')
  }

  const handleTimerPause = () => {
    if (timerStatus !== 'running' || !timerStartedAtMs) return
    const nextElapsedSeconds = resolveElapsedSeconds(timerAccumulatedSeconds, timerStartedAtMs)
    setTimerAccumulatedSeconds(nextElapsedSeconds)
    setElapsedSeconds(nextElapsedSeconds)
    setTimerStartedAtMs(null)
    setTimerStatus('paused')
  }

  const handleTimerStop = () => {
    const finalElapsedSeconds =
      timerStatus === 'running' && timerStartedAtMs
        ? resolveElapsedSeconds(timerAccumulatedSeconds, timerStartedAtMs)
        : elapsedSeconds
    if (finalElapsedSeconds > 0) {
      const completedAt = new Date()
      const splitChunks = splitDurationByDayEndingAt(completedAt, finalElapsedSeconds)
      setTimerSessions((current) => [
        ...current,
        ...splitChunks.map((chunk, index) => ({
          id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
          completedAt: chunk.completedAt,
          dayKey: chunk.dayKey,
          durationSeconds: chunk.durationSeconds,
        })),
      ])
      setCompletedDays((current) => {
        const next = { ...current }
        splitChunks.forEach((chunk) => {
          next[chunk.dayKey] = true
        })
        return next
      })
    }
    setElapsedSeconds(0)
    setTimerAccumulatedSeconds(0)
    setTimerStartedAtMs(null)
    setTimerStatus('idle')
  }

  const handleTimerReset = () => {
    setElapsedSeconds(0)
    setTimerAccumulatedSeconds(0)
    setTimerStartedAtMs(null)
    setTimerStatus('idle')
  }

  const handleAddManualTimerEntry = () => {
    const parsedMinutes = Number(manualTimerMinutes)
    const roundedMinutes = Math.round(parsedMinutes)
    const parsedDate = parseIsoDate(manualTimerDayKey)
    if (!Number.isFinite(parsedMinutes) || roundedMinutes <= 0) {
      setManualTimerError('Enter valid minutes greater than zero.')
      return
    }
    if (roundedMinutes > 1440) {
      setManualTimerError('Manual entry cannot exceed 1440 minutes for one add.')
      return
    }
    if (!parsedDate) {
      setManualTimerError('Choose a valid date for manual entry.')
      return
    }
    const dayKey = formatDayKey(parsedDate)
    const completedAt = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 0)
    setTimerSessions((current) => [
      ...current,
      {
        id: `${Date.now()}-manual-${Math.random().toString(36).slice(2, 8)}`,
        completedAt: completedAt.toISOString(),
        dayKey,
        durationSeconds: roundedMinutes * 60,
      },
    ])
    setCompletedDays((current) => ({ ...current, [dayKey]: true }))
    setManualTimerMinutes('')
    setManualTimerError('')
  }

  const handleSocialTimerStart = () => {
    if (socialTimerStatus === 'running') return
    if (socialTimerStatus === 'idle') {
      setSocialTimerAccumulatedSeconds(0)
      setSocialElapsedSeconds(0)
    }
    setSocialTimerStartedAtMs(Date.now())
    setSocialTimerStatus('running')
  }

  const handleSocialTimerPause = () => {
    if (socialTimerStatus !== 'running' || !socialTimerStartedAtMs) return
    const nextElapsedSeconds = resolveElapsedSeconds(socialTimerAccumulatedSeconds, socialTimerStartedAtMs)
    setSocialTimerAccumulatedSeconds(nextElapsedSeconds)
    setSocialElapsedSeconds(nextElapsedSeconds)
    setSocialTimerStartedAtMs(null)
    setSocialTimerStatus('paused')
  }

  const handleSocialTimerStop = () => {
    const finalElapsedSeconds =
      socialTimerStatus === 'running' && socialTimerStartedAtMs
        ? resolveElapsedSeconds(socialTimerAccumulatedSeconds, socialTimerStartedAtMs)
        : socialElapsedSeconds
    if (finalElapsedSeconds > 0) {
      const completedAt = new Date()
      const dayKey = formatDayKey(completedAt)
      setSocialTimerSessions((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          completedAt: completedAt.toISOString(),
          dayKey,
          durationSeconds: finalElapsedSeconds,
        },
      ])
    }
    setSocialElapsedSeconds(0)
    setSocialTimerAccumulatedSeconds(0)
    setSocialTimerStartedAtMs(null)
    setSocialTimerStatus('idle')
  }

  const handleSocialTimerReset = () => {
    setSocialElapsedSeconds(0)
    setSocialTimerAccumulatedSeconds(0)
    setSocialTimerStartedAtMs(null)
    setSocialTimerStatus('idle')
  }

  const handleSocialLimitChange = (event) => {
    const numericValue = Number(event.target.value)
    if (!Number.isFinite(numericValue)) return
    setSocialDailyLimitMinutes(Math.max(10, Math.min(360, Math.round(numericValue))))
  }

  const handleCalendarStatusChange = (dayKey, statusId) => {
    if (!dayKey) return
    setDayStatuses((current) => ({ ...current, [dayKey]: statusId }))
    if (statusId === 'completed') setCompletedDays((current) => ({ ...current, [dayKey]: true }))
    if (statusId !== 'completed') {
      setCompletedDays((current) => {
        if (!current[dayKey]) return current
        const next = { ...current }
        delete next[dayKey]
        return next
      })
    }
  }

  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const firstWeekday = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1,
  ).getDay()
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const examDayKey = plan ? formatDayKey(plan.examDate) : null
  const consolidationSet = new Set(plan?.weeklyConsolidation ?? [])
  const todayKey = formatDayKey(new Date())
  const currentSessionMinutes = Math.floor(elapsedSeconds / 60)
  const todaySessionMinutes = timerSessions
    .filter((item) => item.dayKey === todayKey)
    .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
  const studiedTodayMinutes = todaySessionMinutes + currentSessionMinutes
  const requiredDailyMinutes = plan ? Math.round(plan.studyHours * 60) : 0
  const remainingTodayMinutes = Math.max(requiredDailyMinutes - studiedTodayMinutes, 0)
  const dailyProgressPercent =
    requiredDailyMinutes > 0 ? Math.min(100, (studiedTodayMinutes / requiredDailyMinutes) * 100) : 0
  const currentSocialSessionMinutes = Math.floor(socialElapsedSeconds / 60)
  const todaySocialLoggedMinutes = socialTimerSessions
    .filter((item) => item.dayKey === todayKey)
    .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
  const socialUsedTodayMinutes = todaySocialLoggedMinutes + currentSocialSessionMinutes
  const socialOveruseMinutes = Math.max(socialUsedTodayMinutes - socialDailyLimitMinutes, 0)
  const socialDailyUsagePercent = Math.min(
    200,
    (socialUsedTodayMinutes / Math.max(1, socialDailyLimitMinutes)) * 100,
  )
  const socialPerformancePenaltyFactor =
    socialOveruseMinutes === 0
      ? 1
      : Math.max(
          0.7,
          1 -
            Math.min(
              0.3,
              (socialOveruseMinutes / Math.max(1, socialDailyLimitMinutes)) * 0.35,
            ),
        )
  const socialDisciplineScore = clampToPercent(
    100 -
      (socialOveruseMinutes / Math.max(1, socialDailyLimitMinutes)) * 65 -
      Math.max(0, socialUsedTodayMinutes - socialDailyLimitMinutes * 0.7) * 0.15,
  )

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfDay(new Date()), index - 6))
  const examPickerMonthLabel = examDatePickerMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const examPickerFirstWeekday = new Date(
    examDatePickerMonth.getFullYear(),
    examDatePickerMonth.getMonth(),
    1,
  ).getDay()
  const examPickerDaysInMonth = new Date(
    examDatePickerMonth.getFullYear(),
    examDatePickerMonth.getMonth() + 1,
    0,
  ).getDate()
  const selectedExamDateKey = form.examDate || ''
  const todayDateKey = formatDayKey(new Date())
  const weeklyProgress = weekDays.map((day) => {
    const dayKey = formatDayKey(day)
    const minutesFromLogs = timerSessions
      .filter((item) => item.dayKey === dayKey)
      .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
    const todayExtra = dayKey === todayKey ? currentSessionMinutes : 0
    const studiedMinutes = minutesFromLogs + todayExtra
    return {
      dayKey,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      studiedMinutes,
      requiredMinutes: requiredDailyMinutes,
      ratio: requiredDailyMinutes > 0 ? Math.min(100, (studiedMinutes / requiredDailyMinutes) * 100) : 0,
    }
  })
  const totalWeekStudiedMinutes = weeklyProgress.reduce((sum, item) => sum + item.studiedMinutes, 0)
  const totalWeekRequiredMinutes = requiredDailyMinutes * 7
  const weeklyProgressPercent =
    totalWeekRequiredMinutes > 0
      ? Math.min(100, (totalWeekStudiedMinutes / totalWeekRequiredMinutes) * 100)
      : 0
  const weeklyDeficitMinutes = Math.max(totalWeekRequiredMinutes - totalWeekStudiedMinutes, 0)
  const missedDailyTarget =
    requiredDailyMinutes > 0 &&
    remainingTodayMinutes >= Math.max(20, Math.round(requiredDailyMinutes * 0.2))
  const missedWeeklyTarget = requiredDailyMinutes > 0 && weeklyProgressPercent < 75
  const shouldShowRecoveryProtocol = Boolean(plan) && (missedDailyTarget || missedWeeklyTarget)
  const focusRecoveryProtocol = (() => {
    if (!shouldShowRecoveryProtocol || !plan) return null
    const weightedBacklogMinutes = Math.round(remainingTodayMinutes + weeklyDeficitMinutes * 0.35)
    const backlogMinutes = Math.max(30, weightedBacklogMinutes)
    const maxExtraPerDay = Math.min(90, Math.max(30, Math.round(requiredDailyMinutes * 0.35)))
    let remaining = backlogMinutes
    const dailyExtras = [0, 0, 0].map((_, index) => {
      const daysLeft = 3 - index
      const allocation = Math.min(maxExtraPerDay, Math.max(20, Math.ceil(remaining / daysLeft)))
      remaining = Math.max(0, remaining - allocation)
      return allocation
    })
    const totalRecovered = dailyExtras.reduce((sum, minutes) => sum + minutes, 0)
    const unresolvedMinutes = Math.max(0, backlogMinutes - totalRecovered)
    const recoveryDays = dailyExtras.map((extraMinutes, index) => {
      const dayDate = addDays(startOfDay(new Date()), index + 1)
      const dayLabel = dayDate.toLocaleDateString('en-US', { weekday: 'long' })
      const totalTarget = requiredDailyMinutes + extraMinutes
      return {
        id: `${dayLabel}-${index}`,
        dayLabel,
        extraMinutes,
        totalTarget,
        protocol: [
          `Add ${extraMinutes} focused recovery minutes.`,
          'Use 2 deep work blocks (50 min each) with 10 minute breaks.',
          'Close the day with 20 minutes of revision recap and error log.',
        ],
      }
    })
    return {
      backlogMinutes,
      maxExtraPerDay,
      totalRecovered,
      unresolvedMinutes,
      recoveryDays,
    }
  })()
  const socialWeeklyUsage = weekDays.map((day) => {
    const dayKey = formatDayKey(day)
    const minutesFromLogs = socialTimerSessions
      .filter((item) => item.dayKey === dayKey)
      .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
    const todayExtra = dayKey === todayKey ? currentSocialSessionMinutes : 0
    return {
      dayKey,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      socialMinutes: minutesFromLogs + todayExtra,
    }
  })
  const socialWeeklyAverageMinutes =
    socialWeeklyUsage.reduce((sum, item) => sum + item.socialMinutes, 0) / Math.max(1, socialWeeklyUsage.length)
  const studyConsistencyThresholdMinutes =
    requiredDailyMinutes > 0 ? Math.max(30, Math.round(requiredDailyMinutes * 0.6)) : 60
  const rollingStudyDays = Array.from({ length: 30 }, (_, index) =>
    addDays(startOfDay(new Date()), -(29 - index)),
  ).map((day) => {
    const dayKey = formatDayKey(day)
    const minutesFromLogs = timerSessions
      .filter((item) => item.dayKey === dayKey)
      .reduce((sum, item) => sum + Math.floor(item.durationSeconds / 60), 0)
    const todayExtra = dayKey === todayKey ? currentSessionMinutes : 0
    return {
      dayKey,
      studiedMinutes: minutesFromLogs + todayExtra,
    }
  })
  const currentStudyStreak = (() => {
    let streak = 0
    for (let index = rollingStudyDays.length - 1; index >= 0; index -= 1) {
      if (rollingStudyDays[index].studiedMinutes >= studyConsistencyThresholdMinutes) streak += 1
      else break
    }
    return streak
  })()
  const longestStudyStreak = (() => {
    let longest = 0
    let current = 0
    rollingStudyDays.forEach((day) => {
      if (day.studiedMinutes >= studyConsistencyThresholdMinutes) {
        current += 1
        longest = Math.max(longest, current)
      } else {
        current = 0
      }
    })
    return longest
  })()
  const recent14StudyDays = rollingStudyDays.slice(-14)
  const recent14HitDays = recent14StudyDays.filter(
    (item) => item.studiedMinutes >= studyConsistencyThresholdMinutes,
  ).length
  const studyConsistencyPercent14 = clampToPercent((recent14HitDays / Math.max(1, recent14StudyDays.length)) * 100)
  const revisionDaysCount = Object.values(dayStatuses).filter((status) => status === 'revision').length
  const mockTestDaysCount = Object.values(dayStatuses).filter((status) => status === 'mock-test').length
  const socialWithinLimitDays7 = socialWeeklyUsage.filter(
    (item) => item.socialMinutes <= socialDailyLimitMinutes,
  ).length
  const gamificationBadges = [
    {
      id: 'first-session',
      title: 'First Focus Session',
      description: 'Complete your first tracked study session.',
      unlocked: timerSessions.length > 0 || elapsedSeconds > 0,
      progress: Math.min(100, ((timerSessions.length > 0 ? 1 : 0) / 1) * 100),
    },
    {
      id: 'streak-3',
      title: 'Consistency Starter',
      description: `Maintain a ${studyConsistencyThresholdMinutes}+ min streak for 3 days.`,
      unlocked: currentStudyStreak >= 3,
      progress: Math.min(100, (currentStudyStreak / 3) * 100),
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: `Maintain a ${studyConsistencyThresholdMinutes}+ min streak for 7 days.`,
      unlocked: currentStudyStreak >= 7,
      progress: Math.min(100, (currentStudyStreak / 7) * 100),
    },
    {
      id: 'consistency-14',
      title: 'Rhythm Keeper',
      description: 'Hit study target on at least 10 of last 14 days.',
      unlocked: recent14HitDays >= 10,
      progress: Math.min(100, (recent14HitDays / 10) * 100),
    },
    {
      id: 'revision-7',
      title: 'Revision Milestone',
      description: 'Mark 7 revision focused days in Guardian Calendar.',
      unlocked: revisionDaysCount >= 7,
      progress: Math.min(100, (revisionDaysCount / 7) * 100),
    },
    {
      id: 'mock-3',
      title: 'Mock Momentum',
      description: 'Complete 3 mock test days.',
      unlocked: mockTestDaysCount >= 3,
      progress: Math.min(100, (mockTestDaysCount / 3) * 100),
    },
    {
      id: 'social-discipline',
      title: 'Digital Discipline',
      description: 'Stay within social limit for all last 7 days.',
      unlocked: socialWithinLimitDays7 >= 7,
      progress: Math.min(100, (socialWithinLimitDays7 / 7) * 100),
    },
  ]
  const unlockedBadgeCount = gamificationBadges.filter((badge) => badge.unlocked).length
  const nextBadgeTarget = gamificationBadges.find((badge) => !badge.unlocked) || null
  const selectedStatus = selectedCalendarDay ? dayStatuses[selectedCalendarDay] || 'planned' : 'planned'
  const selectedOptionalByGroup = optionalGroups
    .map((group) => ({
      group: group.group,
      subjects: selectedOptionalSubjects.filter((item) => OPTIONAL_META_MAP[item]?.group === group.group),
    }))
    .filter((entry) => entry.subjects.length > 0)
  const selectedOptionalSorted = optionalGroups.flatMap((group) =>
    selectedOptionalSubjects.filter((subject) => OPTIONAL_META_MAP[subject]?.group === group.group),
  )
  const selectedOptionalPapers = selectedOptionalByGroup.flatMap((entry) =>
    entry.subjects.flatMap((subject) => {
      const meta = OPTIONAL_META_MAP[subject]
      if (!meta) return []
      if (meta.marks === 200) {
        return [
          `${meta.baseTitle} I (100 Marks)`,
          `${meta.baseTitle} II (100 Marks)`,
        ].map((paper) => ({
          group: entry.group,
          groupIndex: meta.groupIndex,
          paper,
          sourceSubject: subject,
        }))
      }
      return [
        {
          group: entry.group,
          groupIndex: meta.groupIndex,
          paper: `${meta.baseTitle} (100 Marks)`,
          sourceSubject: subject,
        },
      ]
    }),
  )
  const { totalMarks: selectedOptionalMarks, totalPapers: selectedOptionalPaperCount } =
    calculateOptionalTotals(selectedOptionalSubjects)
  const isOptionalSelectionFull = selectedOptionalMarks >= 600 || selectedOptionalPaperCount >= 6
  const compulsoryForAnalysis = [...PLANNER_CORE_COMPULSORY_SUBJECTS, selectedCompulsoryElective].map((item) =>
    stripHundredMarks(item),
  )
  const optionalForAnalysis = selectedOptionalPapers.map((item) => stripHundredMarks(item.paper))
  const performanceSubjects = [...new Set([...compulsoryForAnalysis, ...optionalForAnalysis])].filter(Boolean)

  useEffect(() => {
    setSubjectPerformanceLevels((current) => {
      const next = {}
      performanceSubjects.forEach((subject) => {
        const defaultLevel = subject === 'English (Precis & Composition)' ? 'Contendor' : 'Survivor'
        next[subject] = current[subject] || defaultLevel
      })
      const hasChanged =
        Object.keys(next).length !== Object.keys(current).length ||
        Object.keys(next).some((key) => next[key] !== current[key])
      return hasChanged ? next : current
    })
  }, [performanceSubjects])

  const performanceRows = performanceSubjects.map((subject) => ({
    subject,
    level: subjectPerformanceLevels[subject] || 'Survivor',
  }))
  useEffect(() => {
    if (
      selectedPerformanceSubject &&
      !performanceRows.some((item) => item.subject === selectedPerformanceSubject)
    ) {
      setSelectedPerformanceSubject('')
    }
  }, [performanceRows, selectedPerformanceSubject])
  useEffect(() => {
    setManualDmcScores((current) => {
      const next = {}
      performanceRows.forEach((item) => {
        if (Object.prototype.hasOwnProperty.call(current, item.subject)) {
          next[item.subject] = current[item.subject]
        }
      })
      const hasChanged =
        Object.keys(next).length !== Object.keys(current).length ||
        Object.keys(next).some((key) => next[key] !== current[key])
      return hasChanged ? next : current
    })
  }, [performanceRows])

  const strongSubjects = performanceRows.filter((item) => item.level === 'Topper').map((item) => item.subject)
  const competitiveSubjects = performanceRows
    .filter((item) => item.level === 'Contendor')
    .map((item) => item.subject)
  const weakSubjects = performanceRows.filter((item) => item.level === 'Survivor').map((item) => item.subject)

  const overallPerformanceStatus =
    performanceRows.length === 0
      ? 'Start by selecting subjects in Subject Locker to generate analysis.'
      : strongSubjects.length >= Math.ceil(performanceRows.length / 3)
        ? 'Current profile is high ambition heavy. Rebalance effort to protect consistency.'
        : competitiveSubjects.length >= weakSubjects.length
          ? 'Current profile is competitive and progressing in the right direction.'
          : 'Current profile is foundation focused. Push more subjects into competitive range.'

  const performanceAdvice = [
    weakSubjects.length > 0
      ? `Subjects needing focused improvement: ${weakSubjects.join(', ')}.`
      : 'No critical weak bucket currently. Keep consistency to maintain momentum.',
    'Suggested focus: answer writing structure, timed past paper practice, and weekly revision cycles.',
    'Balanced preparation advice: keep strong subjects stable, convert contendor subjects to confident range, and allocate extra hours to weak bucket every week.',
  ]
  const performanceByLevel = SUBJECT_PERFORMANCE_LEVELS.map((level) => ({
    ...level,
    subjects: performanceRows
      .filter((item) => item.level === level.id)
      .map((item) => item.subject),
  }))
  const compulsorySubjectSet = new Set(compulsoryForAnalysis.filter(Boolean))
  const optionalSubjectSet = new Set(optionalForAnalysis.filter(Boolean))
  const performanceScoreRows = performanceRows.map((item) => ({
    ...item,
    autoScore: PERFORMANCE_LEVEL_SCORE_MAP[item.level] ?? 0,
    section: compulsorySubjectSet.has(item.subject) ? 'Compulsory' : optionalSubjectSet.has(item.subject) ? 'Optionals' : 'Optionals',
    maxMarks: optionalSubjectSet.has(item.subject) ? OPTIONAL_META_MAP[item.subject]?.marks || 100 : 100,
  }))
  const scoredPerformanceRows = performanceScoreRows.map((item) => {
    const rawManualScore = Number(manualDmcScores[item.subject])
    const normalizedManualScore = Number.isFinite(rawManualScore)
      ? Math.max(0, Math.min(100, Math.round(rawManualScore)))
      : item.autoScore
    return {
      ...item,
      score: isManualDmcEnabled ? normalizedManualScore : item.autoScore,
    }
  })
  const compulsoryScoreRows = scoredPerformanceRows.filter((item) => item.section === 'Compulsory')
  const optionalScoreRows = scoredPerformanceRows.filter((item) => item.section === 'Optionals')
  const projectedScoreTotal = scoredPerformanceRows.reduce((sum, item) => sum + item.score, 0)
  const projectedMaxTotal = performanceScoreRows.length * 100
  const projectedScoreBand =
    projectedScoreTotal < 600 ? 'low' : projectedScoreTotal <= 670 ? 'mid' : 'high'
  const subjectLockerScore = clampToPercent(
    (selectedOptionalMarks / 600) * 65 +
      (selectedOptionalPaperCount / 6) * 20 +
      (selectedCompulsoryElective ? 5 : 0) +
      (subjectsLocked ? 10 : 0),
  )
  const strategyFormCompletion =
    [
      Boolean(form.examDate),
      Number(form.studyHours) > 0,
      form.productiveHours.length > 0,
      Boolean(form.stage),
      Boolean(form.cssAttempt),
      Boolean(form.difficulty),
      Boolean(form.learningPreference),
    ].filter(Boolean).length / 7
  const strategyScore = plan
    ? clampToPercent(
        strategyFormCompletion * 35 +
          Math.min(25, (plan.effectiveStudyHours / 8) * 25) +
          Math.min(20, plan.selectedSlots.length * 7) +
          (plan.remainingDays > 0 ? 20 : 10),
      )
    : clampToPercent(strategyFormCompletion * 55)
  const topperRatio = performanceRows.length > 0 ? strongSubjects.length / performanceRows.length : 0
  const contendorRatio = performanceRows.length > 0 ? competitiveSubjects.length / performanceRows.length : 0
  const performanceScoreAverage =
    performanceRows.length > 0 ? projectedScoreTotal / Math.max(1, performanceRows.length) : 0
  const basePerformanceScore = clampToPercent(
    performanceScoreAverage * 0.85 + topperRatio * 12 + contendorRatio * 8,
  )
  const performanceScore = clampToPercent(basePerformanceScore * socialPerformancePenaltyFactor)
  const timerTrackedDays = new Set(timerSessions.map((item) => item.dayKey)).size
  const timerConsistencyPercent = clampToPercent((timerTrackedDays / 14) * 100)
  const timerScore = clampToPercent(
    weeklyProgressPercent * 0.5 + dailyProgressPercent * 0.25 + timerConsistencyPercent * 0.25,
  )
  const allStatusValues = Object.values(dayStatuses)
  const calendarTaggedDays = allStatusValues.length
  const calendarCompletedDays = Object.values(dayStatuses).filter((status) => status === 'completed').length
  const calendarRevisionDays = Object.values(dayStatuses).filter((status) => status === 'revision').length
  const calendarMockDays = Object.values(dayStatuses).filter((status) => status === 'mock-test').length
  const calendarSkippedDays = Object.values(dayStatuses).filter((status) => status === 'skipped').length
  const calendarEngagementPercent = clampToPercent((calendarTaggedDays / 20) * 100)
  const calendarExecutionPercent =
    calendarTaggedDays > 0 ? (calendarCompletedDays / calendarTaggedDays) * 100 : 0
  const calendarScore =
    calendarTaggedDays === 0
      ? 0
      : clampToPercent(
          calendarEngagementPercent * 0.45 +
            calendarExecutionPercent * 0.45 +
            (calendarRevisionDays + calendarMockDays) * 1.2 -
            calendarSkippedDays * 1.4,
        )
  const guardianReportRows = [
    {
      key: 'subjects',
      label: 'Subject Locker',
      score: subjectLockerScore,
      note: `${selectedOptionalMarks}/600 optional marks selected, ${selectedOptionalPaperCount}/6 papers, ${subjectsLocked ? 'locked' : 'draft mode'}.`,
    },
    {
      key: 'strategy',
      label: 'Strategy Builder',
      score: strategyScore,
      note: plan
        ? `${plan.remainingDays} days remaining, ${plan.effectiveStudyHours}h effective daily target, ${plan.selectedSlots.length} productive slot(s).`
        : 'Study strategy not generated yet.',
    },
    {
      key: 'performance',
      label: 'Performance Analysis',
      score: performanceScore,
      note:
        performanceRows.length > 0
          ? `Topper: ${strongSubjects.length}, Contendor: ${competitiveSubjects.length}, Survivor: ${weakSubjects.length}.`
          : 'No performance allocation yet.',
    },
    {
      key: 'timer',
      label: 'Timer & Analytics',
      score: timerScore,
      note: `${studiedTodayMinutes} min today, ${weeklyProgressPercent.toFixed(0)}% weekly completion, ${timerTrackedDays} tracked day(s) in recent logs.`,
    },
    {
      key: 'calendar',
      label: 'Guardian Calendar',
      score: calendarScore,
      note: `${calendarTaggedDays} tagged day(s), ${calendarCompletedDays} completed, ${calendarSkippedDays} skipped.`,
    },
    {
      key: 'social',
      label: 'Social Balance',
      score: socialDisciplineScore,
      note:
        socialOveruseMinutes > 0
          ? `${socialUsedTodayMinutes} min social use today (limit ${socialDailyLimitMinutes} min): over by ${socialOveruseMinutes} min.`
          : `${socialUsedTodayMinutes} min social use today within limit (${socialDailyLimitMinutes} min).`,
    },
  ]
  const guardianOverallScore = clampToPercent(
    subjectLockerScore * 0.2 +
      strategyScore * 0.19 +
      performanceScore * 0.21 +
      timerScore * 0.16 +
      calendarScore * 0.12 +
      socialDisciplineScore * 0.12,
  )
  const guardianOverallStatus =
    guardianOverallScore >= 80
      ? 'High Potential - execution quality is strong and competitive.'
      : guardianOverallScore >= 65
        ? 'Promising - good direction, now tighten consistency and output.'
        : guardianOverallScore >= 50
          ? 'Developing - build stronger routine and convert plans into daily evidence.'
          : 'Early Stage - establish fundamentals before accelerating.'
  const guardianStrengthSignals = [
    subjectsLocked ? 'Subject selection is finalized and structurally valid.' : '',
    strongSubjects.length >= 4 ? 'Multiple subjects are already in Topper range.' : '',
    weeklyProgressPercent >= 70 ? 'Weekly timer completion is on a strong trajectory.' : '',
    calendarCompletedDays >= 5 ? 'Calendar execution indicates steady follow through.' : '',
    socialOveruseMinutes === 0 ? 'Social media is within the daily discipline limit.' : '',
  ].filter(Boolean)
  const guardianRiskSignals = [
    !subjectsLocked ? 'Subject locker is not locked yet. Finalize to prevent frequent switching.' : '',
    !plan ? 'Strategy is not generated yet. Create your timetable to set daily targets.' : '',
    weakSubjects.length >= 4 ? 'Large Survivor bucket. Raise these subjects with answer writing drills.' : '',
    weeklyProgressPercent < 45 ? 'Timer evidence is low versus target. Increase focused sessions.' : '',
    calendarSkippedDays >= 3 ? 'Frequent skipped days are reducing momentum. Use catch up blocks.' : '',
    socialOveruseMinutes > 0
      ? `Social usage exceeded limit by ${socialOveruseMinutes} minutes and reduced performance score impact.`
      : '',
    focusRecoveryProtocol
      ? `Targets are off-track. A 3-day recovery protocol is generated (${focusRecoveryProtocol.backlogMinutes} min backlog).`
      : '',
  ].filter(Boolean)
  const guardianActionPlan = [
    weakSubjects.length
      ? `Next 10 days: prioritize Survivor subjects first (${weakSubjects.slice(0, 4).join(', ')}).`
      : 'Next 10 days: maintain momentum by protecting Topper and Contendor subjects.',
    'Run at least 5 timed answers per week (mix compulsory + optionals) and evaluate structure.',
    requiredDailyMinutes
      ? `Protect minimum ${requiredDailyMinutes} focused minutes daily and recover missed time within 48 hours.`
      : 'Generate strategy first, then protect a non negotiable daily study target.',
    socialOveruseMinutes > 0
      ? `Cut social media by at least ${Math.ceil(socialOveruseMinutes / 2)} minutes tomorrow to recover readiness score.`
      : 'Keep social media usage within the daily limit to protect readiness score.',
    focusRecoveryProtocol
      ? `Follow Focus Recovery Protocol for next 3 days: +${focusRecoveryProtocol.recoveryDays.map((day) => day.extraMinutes).join('/')} min.`
      : 'No recovery protocol needed currently. Maintain current pace and consistency.',
    'Mark every study day in Guardian Calendar with completed, revision, or mock test status.',
    'Review this report every week and move one subject from Survivor to Contendor.',
  ]
  const nextWeekTargets = [
    requiredDailyMinutes > 0
      ? `Study minimum ${requiredDailyMinutes} focused minutes daily for next 7 days.`
      : 'Generate strategy and set a daily minimum study target.',
    `Reach at least ${Math.max(75, Math.min(90, Math.round(weeklyProgressPercent + 8)))}% weekly completion.`,
    `Keep social media usage within ${socialDailyLimitMinutes} minutes per day.`,
    weakSubjects.length > 0
      ? `Move at least one subject from Survivor to Contendor (${weakSubjects.slice(0, 2).join(', ')}).`
      : 'Protect current subject strength and convert one Contendor subject to Topper.',
    focusRecoveryProtocol
      ? `Complete 3-day Focus Recovery Protocol (+${focusRecoveryProtocol.recoveryDays
          .map((day) => day.extraMinutes)
          .join('/') } min).`
      : `Extend consistency streak from ${currentStudyStreak} to at least ${Math.max(3, currentStudyStreak + 2)} days.`,
  ]
  const plannerStepIndex = Math.max(
    0,
    PLANNER_TAB_SEQUENCE.findIndex((item) => item.id === activePlannerTab),
  )
  const previousPlannerStep = plannerStepIndex > 0 ? PLANNER_TAB_SEQUENCE[plannerStepIndex - 1] : null
  const nextPlannerStep =
    plannerStepIndex < PLANNER_TAB_SEQUENCE.length - 1 ? PLANNER_TAB_SEQUENCE[plannerStepIndex + 1] : null

  const handlePerformanceDrop = (levelId, event) => {
    event.preventDefault()
    const subject = event.dataTransfer.getData('text/plain') || draggingPerformanceSubject
    if (!subject) return
    setSubjectPerformanceLevels((current) => ({ ...current, [subject]: levelId }))
    setDraggingPerformanceSubject('')
    setSelectedPerformanceSubject(subject)
  }
  const handlePerformanceAssign = (subject, levelId) => {
    if (!subject) return
    setSubjectPerformanceLevels((current) => ({ ...current, [subject]: levelId }))
  }
  const handlePerformanceChipClick = (subject) => {
    const isCoarsePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches
    if (isCoarsePointer) {
      const currentLevel = subjectPerformanceLevels[subject] || 'Survivor'
      const nextLevel = getNextPerformanceLevel(currentLevel)
      handlePerformanceAssign(subject, nextLevel)
      setSelectedPerformanceSubject(subject)
      return
    }
    setSelectedPerformanceSubject(subject)
  }
  const handlePlannerStepChange = (targetStep) => {
    if (!targetStep) return
    setActivePlannerTab(targetStep.id)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  const handleManualDmcScoreChange = (subject, value) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return
    setManualDmcScores((current) => ({
      ...current,
      [subject]: Math.max(0, Math.min(100, Math.round(numericValue))),
    }))
  }
  const handleAiExamDraftChange = (field, value) => {
    setAiExamDraft((current) => ({ ...current, [field]: value }))
  }
  const handleAiExamEvaluate = (event) => {
    event.preventDefault()
    const question = (aiExamDraft.question || '').trim()
    const answer = (aiExamDraft.answer || '').trim()

    if (question.length < 12) {
      setAiExamError('Please enter a full question statement before evaluation.')
      return
    }
    if (answer.length < 220) {
      setAiExamError('Please provide a fuller answer (minimum around 220 characters) for realistic scoring.')
      return
    }

    const report = buildAiExamReport({
      question,
      answer,
      paperType: aiExamDraft.paperType || 'essay',
    })
    setAiExamResult(report)
    setAiExamError('')
  }
  const handleAiExamReset = () => {
    setAiExamDraft({
      paperType: 'essay',
      question: '',
      answer: '',
    })
    setAiExamResult(null)
    setAiExamError('')
  }
  const handleAiExamApplyDrillsToCalendar = () => {
    if (!aiExamResult?.sevenDayDrills?.length) return
    const start = startOfDay(new Date())
    setDayStatuses((current) => {
      const next = { ...current }
      aiExamResult.sevenDayDrills.forEach((drill, index) => {
        const key = formatDayKey(addDays(start, index))
        next[key] = drill.statusSuggestion === 'mock-test' ? 'mock-test' : 'revision'
      })
      return next
    })
    setActivePlannerTab('calendar')
  }

  return (
    <main className="page-main">
      <section className="container planner-page">
        <div className="section-title">
          <p>Guardian Study Planner</p>
          <h2>Build Your Personalized CSS Preparation Strategy</h2>
        </div>
        <div className="planner-shell">
          <aside className="planner-sidebar">
            <div className="planner-sidebar-head">
              <p>Signed in as</p>
              <h3>{authUser.fullName || authUser.username}</h3>
              <span>@{authUser.username}</span>
            </div>
            <div className="planner-tabs" role="tablist" aria-label="Guardian planner sections">
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'subjects'}
                className={`planner-tab ${activePlannerTab === 'subjects' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('subjects')}
              >
                Subject Locker
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'strategy'}
                className={`planner-tab ${activePlannerTab === 'strategy' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('strategy')}
              >
                Strategy Builder
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'performance'}
                className={`planner-tab ${activePlannerTab === 'performance' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('performance')}
              >
                Performance Analysis
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'timer'}
                className={`planner-tab ${activePlannerTab === 'timer' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('timer')}
              >
                Timer & Analytics
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'social'}
                className={`planner-tab ${activePlannerTab === 'social' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('social')}
              >
                Social Balance
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'calendar'}
                className={`planner-tab ${activePlannerTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('calendar')}
              >
                Guardian Calendar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'report'}
                className={`planner-tab ${activePlannerTab === 'report' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('report')}
              >
                Guardian Angel Report
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activePlannerTab === 'examiner'}
                className={`planner-tab ${activePlannerTab === 'examiner' ? 'active' : ''}`}
                onClick={() => setActivePlannerTab('examiner')}
              >
                AI Examiner
              </button>
            </div>
          </aside>

          <div className="planner-content">
            {activePlannerTab === 'subjects' ? (
              <article className="planner-card subject-locker-card">
                <div className="subject-locker-head">
                  <div>
                    <h3>CSS Subject Locker</h3>
                    <p>
                      Drag subjects in their own group cards and lock at 600 marks.
                    </p>
                  </div>
                  <div className={`subject-lock-badge ${subjectsLocked ? 'locked' : ''}`}>
                    {subjectsLocked ? 'Locked' : 'Draft Mode'}
                  </div>
                </div>
                <section className="subject-panel">
                  <h4>Compulsory Subjects</h4>
                  <ul className="subject-pill-list">
                    {PLANNER_CORE_COMPULSORY_SUBJECTS.map((subject) => (
                      <li key={subject} className="subject-pill compulsory">
                        {subject}
                      </li>
                    ))}
                    <li className="subject-pill compulsory optional">
                      {selectedCompulsoryElective || 'Select one compulsory option'}
                    </li>
                  </ul>
                  {!subjectsLocked ? (
                    <div className="compulsory-elective-box">
                      <p>Choose one option:</p>
                      <div className="compulsory-elective-options">
                        {COMPULSORY_ELECTIVE_OPTIONS.map((option) => (
                          <label
                            key={option}
                            className={`compulsory-elective-option ${
                              selectedCompulsoryElective === option ? 'selected' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="compulsoryElective"
                              value={option}
                              checked={selectedCompulsoryElective === option}
                              onChange={() => setSelectedCompulsoryElective(option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>

                {subjectsLocked ? (
                  <section className="subject-panel">
                    <h4>Optional Subjects (Locked)</h4>
                    <ul className="subject-pill-list">
                      {selectedOptionalSorted.map((subject) => (
                        <li key={subject} className="subject-pill optional">
                          {subject}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <div
                    className={`subject-locker-grid grouped-optionals-grid ${
                      isOptionalSelectionFull ? 'selection-capped' : ''
                    }`}
                  >
                    {optionalGroups.map((group) => {
                      const selectedInGroup = selectedOptionalSubjects.filter(
                        (subject) => OPTIONAL_META_MAP[subject]?.group === group.group,
                      )
                      return (
                        <section
                          key={group.group}
                          className={`subject-panel optional-group-panel ${
                            isOptionalSelectionFull ? 'capped' : ''
                          }`}
                          onDragOver={(event) => {
                            if (!subjectsLocked && !isOptionalSelectionFull) event.preventDefault()
                          }}
                          onDrop={(event) => handleOptionalDrop(group.group, event)}
                        >
                          <h4>{group.group}</h4>
                          <p className="group-rule">{group.rules}</p>
                          <div className="optional-pool">
                            {group.subjects.map((subject) => {
                              const isSelected = selectedOptionalSubjects.includes(subject)
                              const shouldDisable = isOptionalSelectionFull && !isSelected
                              return (
                                <button
                                  key={subject}
                                  type="button"
                                  className={`subject-chip ${isSelected ? 'selected' : ''}`}
                                  draggable={!subjectsLocked && !shouldDisable}
                                  disabled={shouldDisable}
                                  onDragStart={(event) => {
                                    if (subjectsLocked || shouldDisable) return
                                    event.dataTransfer.setData('text/plain', subject)
                                    setDraggingSubject(subject)
                                  }}
                                  onDragEnd={() => setDraggingSubject('')}
                                  onClick={() => handleAddOptionalSubject(subject)}
                                >
                                  {subject}
                                </button>
                              )
                            })}
                          </div>

                          <div className="group-selected-strip">
                            <p>Selected from {group.group}</p>
                            {selectedInGroup.length > 0 ? (
                              <ul className="group-selected-list">
                                {selectedInGroup.map((subject) => (
                                  <li key={subject}>
                                    <span>{subject}</span>
                                    {!subjectsLocked ? (
                                      <button
                                        type="button"
                                        className="slot-clear-btn"
                                        onClick={() => handleOptionalSubjectRemove(subject)}
                                      >
                                        Remove
                                      </button>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <strong>Drop group subjects here</strong>
                            )}
                          </div>
                        </section>
                      )
                    })}
                  </div>
                )}

                {!subjectsLocked ? (
                  <section className="subject-panel selected-panel">
                    <h4>Selected Optional Papers (Group wise)</h4>
                    <p className="subject-selection-meta">
                      Total: <strong>{selectedOptionalMarks} Marks</strong> | Papers:{' '}
                      <strong>{selectedOptionalPaperCount}/6</strong>
                    </p>
                    {selectedOptionalPapers.length > 0 ? (
                      <ul className="planner-list">
                        {selectedOptionalPapers.map((item) => (
                          <li key={`${item.group}-${item.paper}`}>
                            <strong>{item.group}:</strong> {item.paper}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="subject-selection-meta">No optional papers selected yet.</p>
                    )}
                  </section>
                ) : null}

                <div className="subject-locker-actions">
                  {!subjectsLocked ? (
                    <button className="btn btn-primary" type="button" onClick={handleLockSubjects}>
                      Lock Subjects
                    </button>
                  ) : (
                    <button className="btn btn-secondary" type="button" onClick={handleUnlockSubjects}>
                      Unlock for Editing
                    </button>
                  )}
                  <p>
                    {subjectsLocked
                      ? 'Subjects are locked'
                      : 'Lock works only at exactly 600 marks and 6 papers (200 marks subjects split into Paper I/II).'}
                  </p>
                </div>
                {subjectsLocked ? (
                  <div className="subject-outline-pdf-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleGenerateCourseOutlinePdf}
                      disabled={isGeneratingOutlinePdf}
                    >
                      {isGeneratingOutlinePdf ? 'Generating PDF...' : 'Generate Course Outline PDF'}
                    </button>
                    {outlinePdfUrl ? (
                      <>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          data-ga-pdf-url={outlinePdfUrl}
                          data-ga-pdf-name={outlinePdfFileName}
                          onClick={handleViewOutlinePdf}
                        >
                          View PDF
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          data-ga-pdf-url={outlinePdfUrl}
                          data-ga-pdf-name={outlinePdfFileName}
                          onClick={handleDownloadOutlinePdf}
                        >
                          Download PDF
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
                {error ? <p className="planner-error">{error}</p> : null}
              </article>
            ) : null}

            {subjectLockerModalMessage ? (
              <div className="subject-locker-modal-overlay" role="presentation">
                <div
                  className="subject-locker-modal"
                  role="alertdialog"
                  aria-live="assertive"
                  aria-label="Group II selection warning"
                >
                  <h4>Selection blocked</h4>
                  <p>{subjectLockerModalMessage}</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setSubjectLockerModalMessage('')}
                  >
                    OK, I Understand
                  </button>
                </div>
              </div>
            ) : null}

            {activePlannerTab === 'strategy' ? (
              <>
                <article className="planner-card">
                  <h3>Planner Questions</h3>
                  <form className="planner-form" onSubmit={handleGeneratePlan}>
                    <label>
                      What is the expected date of your CSS examination?
                      <div className="strategy-date-picker">
                        <button
                          type="button"
                          className="strategy-date-trigger"
                          onClick={() => setIsExamDatePickerOpen((current) => !current)}
                          aria-expanded={isExamDatePickerOpen}
                        >
                          {form.examDate ? formatDateDDMMYYYY(form.examDate) : 'Select date (dd/mm/yyyy)'}
                        </button>
                        {isExamDatePickerOpen ? (
                          <div className="strategy-calendar-popup">
                            <div className="strategy-calendar-head">
                              <button
                                type="button"
                                className="btn btn-secondary calendar-btn"
                                onClick={() =>
                                  setExamDatePickerMonth(
                                    new Date(
                                      examDatePickerMonth.getFullYear(),
                                      examDatePickerMonth.getMonth() - 1,
                                      1,
                                    ),
                                  )
                                }
                              >
                                Prev
                              </button>
                              <strong>{examPickerMonthLabel}</strong>
                              <button
                                type="button"
                                className="btn btn-secondary calendar-btn"
                                onClick={() =>
                                  setExamDatePickerMonth(
                                    new Date(
                                      examDatePickerMonth.getFullYear(),
                                      examDatePickerMonth.getMonth() + 1,
                                      1,
                                    ),
                                  )
                                }
                              >
                                Next
                              </button>
                            </div>

                            <div className="calendar-grid calendar-weekdays strategy-calendar-weekdays">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <span key={day}>{day}</span>
                              ))}
                            </div>

                            <div className="calendar-grid strategy-calendar-days">
                              {Array.from({ length: examPickerFirstWeekday }).map((_, index) => (
                                <span key={`picker-blank-${index}`} className="calendar-day blank" />
                              ))}
                              {Array.from({ length: examPickerDaysInMonth }).map((_, index) => {
                                const dayDate = new Date(
                                  examDatePickerMonth.getFullYear(),
                                  examDatePickerMonth.getMonth(),
                                  index + 1,
                                )
                                const dayKey = formatDayKey(dayDate)
                                const isToday = dayKey === todayDateKey
                                const isSelected = dayKey === selectedExamDateKey
                                return (
                                  <button
                                    key={`picker-${dayKey}`}
                                    type="button"
                                    className={`calendar-day ${isToday ? 'today' : ''} ${
                                      isSelected ? 'selected exam-day' : ''
                                    }`}
                                    onClick={() => handleExamDateSelect(dayDate)}
                                  >
                                    {index + 1}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <input type="hidden" name="examDate" value={form.examDate} />
                      <small>Selected (dd/mm/yyyy): {formatDateDDMMYYYY(form.examDate)}</small>
                    </label>

                    <label>
                      How many hours can you realistically study per day?
                      <input
                        name="studyHours"
                        type="number"
                        min="2"
                        max="14"
                        step="0.5"
                        value={form.studyHours}
                        onChange={handleChange}
                        required
                      />
                    </label>

                    <label>
                      During which hours are you most productive?
                      <div className="productive-hours-sections">
                        {PRODUCTIVE_HOUR_SECTIONS.map((section) => (
                          <div key={section.id} className="productive-hours-section">
                            <div className="productive-hours-section-head">
                              <h4>{section.title}</h4>
                              <span>{section.subtitle}</span>
                            </div>
                            <div className="productive-hours-grid">
                              {section.slots.map((slot) => (
                                <label key={slot.id} className="productive-hour-option">
                                  <span>{slot.label}</span>
                                  <input
                                    type="checkbox"
                                    checked={form.productiveHours.includes(slot.id)}
                                    onChange={() => handleProductiveHourToggle(slot.id)}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </label>

                    <div className="planner-reminder-panel">
                      <button
                        type="button"
                        className={`planner-reminder-toggle-btn ${slotRemindersEnabled ? 'active' : ''}`}
                        onClick={async () => {
                          const next = !slotRemindersEnabled
                          if (next) {
                            primePlannerReminderAudio()
                            const ok = await requestPlannerReminderPermission()
                            if (!ok) {
                              window.alert(
                                isPlannerNativeAppView()
                                  ? 'Allow notifications in your device settings to receive study slot reminders in the app.'
                                  : 'Allow notifications in your browser or system settings to receive reminders.',
                              )
                              return
                            }
                          }
                          try {
                            localStorage.setItem(GA_PLANNER_REMINDER_TOGGLE_KEY, next ? '1' : '0')
                          } catch {
                            // ignore
                          }
                          setSlotRemindersEnabled(next)
                          syncPlannerRemindersToNativeAndWeb({
                            enabled: next,
                            form,
                            plan,
                          })
                        }}
                      >
                        {slotRemindersEnabled ? 'Reminder Notifications ON' : 'Enable Reminder Notifications'}
                      </button>
                    </div>

                    <label>
                      What stage of preparation are you currently in?
                      <select name="stage" value={form.stage} onChange={handleChange}>
                        <option value="beginner">Beginner</option>
                        <option value="revision">Revision</option>
                        <option value="mock-exams">Mock Exams</option>
                      </select>
                    </label>

                    <label>
                      Which CSS attempt is this?
                      <select name="cssAttempt" value={form.cssAttempt} onChange={handleChange}>
                        <option value="first">First Attempt</option>
                        <option value="second">Second Attempt</option>
                        <option value="third">Third Attempt</option>
                      </select>
                    </label>

                    <label>
                      How difficult do you personally consider CSS?
                      <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                        <option value="easy">Easy</option>
                        <option value="moderate">Moderate</option>
                        <option value="difficult">Difficult</option>
                        <option value="extremely difficult">Extremely Difficult</option>
                      </select>
                    </label>

                    <label>
                      Do you prefer lectures first or self study first?
                      <select
                        name="learningPreference"
                        value={form.learningPreference}
                        onChange={handleChange}
                      >
                        <option value="lectures-first">Lectures First</option>
                        <option value="self-study-first">Self Study First</option>
                      </select>
                    </label>

                    <button className="btn btn-primary planner-submit" type="submit">
                      Generate Study Strategy
                    </button>
                    {error ? <p className="planner-error">{error}</p> : null}
                  </form>
                </article>

                {plan ? (
                  <article className="planner-card planner-output">
                    <h3>Your Personalized Preparation Strategy</h3>
                    <p className="planner-meta">
                      Days remaining until exam: <strong>{plan.remainingDays}</strong>
                    </p>
                    <p className="planner-meta">
                      Daily split: Lecture <strong>{plan.lectureHours}h</strong>, Self-study{' '}
                      <strong>{plan.selfStudyHours}h</strong>, Revision <strong>{plan.revisionHours}h</strong>
                    </p>
                    <p className="planner-meta">
                      Effective study target: <strong>{plan.effectiveStudyHours}h/day</strong> (base{' '}
                      {plan.studyHours}h adjusted by factors)
                    </p>
                    <p className="planner-meta">
                      Productive slots: <strong>{plan.selectedSlots.join(', ')}</strong>
                    </p>

                    <div className="planner-grid">
                      <div>
                        <h4>Daily Timetable</h4>
                        <ul className="planner-list">
                          {plan.timetable.map((slot) => (
                            <li key={slot.title}>
                              <strong>{slot.timeRange}</strong> - {slot.title}: {slot.focus}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4>Break Intervals to Avoid Burnout</h4>
                        <ul className="planner-list">
                          {plan.breakPlan.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>

                        <h4>Weekly Consolidation Days</h4>
                        <ul className="planner-list">
                          {plan.weeklyConsolidation.length > 0 ? (
                            plan.weeklyConsolidation.slice(0, 8).map((day) => (
                              <li key={day}>
                                {day}: Light revision + one timed past paper question + reflection notes.
                              </li>
                            ))
                          ) : (
                            <li>No full week available yet; add mini consolidation every 3rd day.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <h4>Preparation Phases Until Exam</h4>
                    <ul className="planner-list">
                      {plan.phaseStrategy.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>

                    <p className="planner-message">
                      Stay consistent, protect your routine, and trust your daily process. Small focused
                      wins every day will compound into CSS success.
                    </p>
                  </article>
                ) : null}
              </>
            ) : null}

            {activePlannerTab === 'performance' ? (
              <article className="planner-card">
                <h3>Subject Performance Analyzer</h3>
                <p className="planner-meta">
                  Select one level for each subject: Survivor (around 40), Contendor (above 50),
                  Topper (above 65).
                </p>

                {performanceRows.length === 0 ? (
                  <p className="planner-meta">
                    No subjects available yet. Add subjects in Subject Locker first.
                  </p>
                ) : (
                  <div className="performance-dnd-board">
                    <div className="performance-source-card">
                      <h4>Subjects (Tap/Drag)</h4>
                      <p className="performance-touch-note">
                        Mobile: tap a subject to cycle Survivor, Contendor, Topper.
                      </p>
                      <div className="performance-subject-list">
                        {performanceRows.map((item) => (
                          <button
                            key={item.subject}
                            type="button"
                            className={`performance-subject-chip ${
                              selectedPerformanceSubject === item.subject ? 'is-selected' : ''
                            }`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', item.subject)
                              setDraggingPerformanceSubject(item.subject)
                            }}
                            onDragEnd={() => setDraggingPerformanceSubject('')}
                            onClick={() => handlePerformanceChipClick(item.subject)}
                          >
                            {item.subject}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="performance-columns">
                      {performanceByLevel.map((level) => (
                        <section
                          key={level.id}
                          className="performance-column"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handlePerformanceDrop(level.id, event)}
                        >
                          <header>
                            <h4>{level.id}</h4>
                            <p>{level.scoreHint}</p>
                          </header>
                          <div className="performance-column-body">
                            {level.subjects.length > 0 ? (
                              level.subjects.map((subject) => (
                                <div
                                  key={subject}
                                  className={`performance-assigned-chip ${
                                    selectedPerformanceSubject === subject ? 'is-selected' : ''
                                  }`}
                                  draggable
                                  onDragStart={(event) => {
                                    event.dataTransfer.setData('text/plain', subject)
                                    setDraggingPerformanceSubject(subject)
                                  }}
                                  onDragEnd={() => setDraggingPerformanceSubject('')}
                                  onClick={() => handlePerformanceChipClick(subject)}
                                >
                                  {subject}
                                </div>
                              ))
                            ) : (
                              <p className="performance-drop-hint">Drop subjects here</p>
                            )}
                          </div>
                        </section>
                      ))}
                    </div>

                    <div className="performance-dmc">
                      <h4>Projected CSS DMC</h4>
                      <div className="performance-dmc-controls">
                        <label className="performance-dmc-toggle">
                          <input
                            type="checkbox"
                            checked={isManualDmcEnabled}
                            onChange={(event) => setIsManualDmcEnabled(event.target.checked)}
                          />
                          Enable manual adjustment
                        </label>
                        {isManualDmcEnabled ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setManualDmcScores({})}
                          >
                            Reset to level based scores
                          </button>
                        ) : null}
                      </div>
                      <div className="performance-dmc-table-wrap">
                        <table className="performance-dmc-table">
                          <thead>
                            <tr>
                              <th scope="col">Subject</th>
                              <th scope="col">Level</th>
                              <th scope="col">Expected Marks</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="performance-dmc-section-row">
                              <td colSpan={3}>Compulsory</td>
                            </tr>
                            {compulsoryScoreRows.length > 0 ? (
                              compulsoryScoreRows.map((item) => (
                                <tr key={`dmc-compulsory-${item.subject}`}>
                                  <td>{item.subject}</td>
                                  <td>{item.level}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      className={`performance-dmc-input ${resolveScoreToneClass(item.score)}`}
                                      value={item.score}
                                      disabled={!isManualDmcEnabled}
                                      onChange={(event) =>
                                        handleManualDmcScoreChange(item.subject, event.target.value)
                                      }
                                    />
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3}>No compulsory subjects in current selection.</td>
                              </tr>
                            )}
                            <tr className="performance-dmc-section-row">
                              <td colSpan={3}>Optionals</td>
                            </tr>
                            {optionalScoreRows.length > 0 ? (
                              optionalScoreRows.map((item) => (
                                <tr key={`dmc-optional-${item.subject}`}>
                                  <td>{item.subject}</td>
                                  <td>{item.level}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="1"
                                      className={`performance-dmc-input ${resolveScoreToneClass(item.score)}`}
                                      value={item.score}
                                      disabled={!isManualDmcEnabled}
                                      onChange={(event) =>
                                        handleManualDmcScoreChange(item.subject, event.target.value)
                                      }
                                    />
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3}>No optional subjects in current selection.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className={`performance-dmc-total ${projectedScoreBand}`}>
                        <strong>Total Projected Marks:</strong>{' '}
                        <span className={resolveScoreToneClass(projectedScoreTotal, projectedMaxTotal)}>
                          {projectedScoreTotal}
                        </span>{' '}
                        / {projectedMaxTotal}
                      </p>
                      <div className="report-pdf-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleGeneratePerformanceAnalysisPdf}
                          disabled={isGeneratingPerformancePdf}
                        >
                          {isGeneratingPerformancePdf
                            ? 'Generating Performance PDF...'
                            : 'Generate Performance PDF'}
                        </button>
                        {performancePdfUrl ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              data-ga-pdf-url={performancePdfUrl}
                              data-ga-pdf-name={performancePdfFileName}
                              onClick={handleViewPerformancePdf}
                            >
                              View PDF
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              data-ga-pdf-url={performancePdfUrl}
                              data-ga-pdf-name={performancePdfFileName}
                              onClick={handleDownloadPerformancePdf}
                            >
                              Download PDF
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                <div className="performance-summary">
                  <h4>Overall Preparation Status</h4>
                  <p>{overallPerformanceStatus}</p>

                  <p>
                    <strong>Strong subjects (Topper):</strong>{' '}
                    {strongSubjects.length ? strongSubjects.join(', ') : 'None'}
                  </p>
                  <p>
                    <strong>Competitive subjects (Contendor):</strong>{' '}
                    {competitiveSubjects.length ? competitiveSubjects.join(', ') : 'None'}
                  </p>
                  <p>
                    <strong>Weak subjects (Survivor):</strong>{' '}
                    {weakSubjects.length ? weakSubjects.join(', ') : 'None'}
                  </p>

                  <h4>Constructive Feedback</h4>
                  <ul className="planner-list">
                    {performanceAdvice.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>

                  <p className="planner-message">
                    Stay consistent every week and trust the process. Focused preparation compounds
                    into extraordinary CSS results.
                  </p>
                </div>
              </article>
            ) : null}

            {activePlannerTab === 'examiner' ? (
              <div className="ai-examiner-hold-shell">
                <article className="planner-card ai-examiner-card">
                <h3>AI CSS Examiner and Marks Predictor</h3>
                <p className="planner-meta">
                  Paste your answer to get estimated marks, examiner style feedback, and a targeted 7 day
                  writing drill plan.
                </p>

                <form className="planner-form ai-examiner-form" onSubmit={handleAiExamEvaluate}>
                  <label>
                    Paper Type
                    <select
                      value={aiExamDraft.paperType}
                      onChange={(event) => handleAiExamDraftChange('paperType', event.target.value)}
                    >
                      {AI_EXAM_PAPER_TYPES.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Question Prompt
                    <textarea
                      value={aiExamDraft.question}
                      onChange={(event) => handleAiExamDraftChange('question', event.target.value)}
                      rows={4}
                      placeholder="Paste the exact CSS question here."
                    />
                  </label>

                  <label>
                    Your Answer Draft
                    <textarea
                      value={aiExamDraft.answer}
                      onChange={(event) => handleAiExamDraftChange('answer', event.target.value)}
                      rows={12}
                      placeholder="Write or paste your answer here."
                    />
                  </label>

                  <div className="ai-examiner-actions">
                    <button className="btn btn-primary" type="submit">
                      Evaluate Answer
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={handleAiExamReset}>
                      Reset
                    </button>
                  </div>
                  {aiExamError ? <p className="planner-error">{aiExamError}</p> : null}
                </form>

                {aiExamResult ? (
                  <div className="ai-examiner-results">
                    <div className="ai-examiner-summary">
                      <article className="ai-score-box">
                        <p>Estimated Marks</p>
                        <strong>
                          <span className={resolveScoreToneClass(aiExamResult.totalScore)}>
                            {aiExamResult.totalScore}
                          </span>
                          /100
                        </strong>
                        <span>{aiExamResult.grade}</span>
                      </article>
                      <article className="ai-score-box">
                        <p>Word Count</p>
                        <strong>{aiExamResult.wordCount}</strong>
                        <span>Use this to calibrate answer depth.</span>
                      </article>
                    </div>

                    <section className="ai-rubric-grid">
                      {aiExamResult.criteriaScores.map((criterion) => (
                        <article key={criterion.id} className="ai-rubric-card">
                          <h4>{criterion.label}</h4>
                          <strong>
                            <span className={resolveScoreToneClass(criterion.score, criterion.maxScore)}>
                              {criterion.score}
                            </span>
                            /{criterion.maxScore}
                          </strong>
                          <p>{criterion.feedback}</p>
                        </article>
                      ))}
                    </section>

                    <section>
                      <h4>Line by Line Weakness Review</h4>
                      <ul className="planner-list ai-line-feedback-list">
                        {aiExamResult.lineFeedback.map((item) => (
                          <li key={item.id}>
                            <strong>{item.snippet}</strong>
                            <span>{item.feedback}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h4>Improved High Scoring Outline</h4>
                      <ul className="planner-list">
                        {aiExamResult.improvedOutline.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="ai-drills-panel">
                      <div className="ai-drills-head">
                        <h4>Auto 7 Day Improvement Drills</h4>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={handleAiExamApplyDrillsToCalendar}
                        >
                          Apply to Guardian Calendar
                        </button>
                      </div>
                      <ul className="planner-list">
                        {aiExamResult.sevenDayDrills.map((drill) => (
                          <li key={drill.id}>
                            <strong>
                              {drill.dayLabel} - {drill.focusArea}
                            </strong>{' '}
                            ({drill.targetMinutes} min): {drill.task}
                          </li>
                        ))}
                      </ul>
                      <p className="planner-meta">{aiExamResult.nextAttemptPrompt}</p>
                    </section>
                  </div>
                ) : null}
                </article>
                <div className="ai-examiner-dev-overlay" role="dialog" aria-modal="true">
                  <div className="ai-examiner-dev-modal">
                    <h4>AI Examiner Module Update</h4>
                    <p>
                      This feature is currently in development stage.
                      <br />
                      A refined version by Guardian Angel will be released soon.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {activePlannerTab === 'timer' ? (
              <article className="planner-card planner-timer-card">
          <div className="planner-timer-header">
            <h3>Guardian Study Timer</h3>
            <p>Track your focused minutes with start, pause, and stop controls.</p>
          </div>
          <div className="timer-display">{formatStopwatch(elapsedSeconds)}</div>
          <div className="timer-controls">
            {timerStatus === 'running' ? (
              <button className="btn btn-secondary" type="button" onClick={handleTimerPause}>
                Pause
              </button>
            ) : (
              <button className="btn btn-primary" type="button" onClick={handleTimerStart}>
                {timerStatus === 'paused' ? 'Resume' : 'Start'}
              </button>
            )}
            <button className="btn btn-primary" type="button" onClick={handleTimerStop}>
              Stop & Save Session
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleTimerReset}>
              Reset
            </button>
          </div>

          <div className="manual-timer-entry">
            <strong>Manual Time Entry</strong>
            <div className="manual-timer-fields">
              <label>
                Minutes
                <input
                  type="number"
                  min="1"
                  max="1440"
                  step="1"
                  value={manualTimerMinutes}
                  onChange={(event) => setManualTimerMinutes(event.target.value)}
                  placeholder="e.g. 90"
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={manualTimerDayKey}
                  max={todayDateKey}
                  onChange={(event) => setManualTimerDayKey(event.target.value)}
                />
              </label>
              <button className="btn btn-secondary" type="button" onClick={handleAddManualTimerEntry}>
                Add Time
              </button>
            </div>
            {manualTimerError ? <p className="planner-error">{manualTimerError}</p> : null}
          </div>

          <div className="study-metrics">
            <article className="metric-card">
              <p>Today Studied</p>
              <strong>{formatMinutesSmart(studiedTodayMinutes)}</strong>
            </article>
            <article className="metric-card">
              <p>Today Required</p>
              <strong>{requiredDailyMinutes ? formatMinutesSmart(requiredDailyMinutes) : '--'}</strong>
            </article>
            <article className="metric-card">
              <p>Still Needed Today</p>
              <strong>{requiredDailyMinutes ? formatMinutesSmart(remainingTodayMinutes) : 'Generate a plan'}</strong>
            </article>
            <article className="metric-card">
              <p>Weekly Completion</p>
              <strong>{requiredDailyMinutes ? `${weeklyProgressPercent.toFixed(0)}%` : '--'}</strong>
            </article>
          </div>

          <div className="progress-track" aria-label="Daily progress">
            <span style={{ width: `${dailyProgressPercent}%` }} />
          </div>
          <p className="progress-caption">
            Daily target progress: {requiredDailyMinutes ? `${dailyProgressPercent.toFixed(0)}%` : 'Generate your study strategy first.'}
          </p>

          {focusRecoveryProtocol ? (
            <section className="focus-recovery-card">
              <h4>Focus Recovery Protocol (Auto 3 Day Catch up)</h4>
              <p>
                You are behind target. Recovery backlog: <strong>{focusRecoveryProtocol.backlogMinutes} min</strong>.
                Extra recovery is capped at <strong>{focusRecoveryProtocol.maxExtraPerDay} min/day</strong> to stay
                burnout safe.
              </p>
              <div className="focus-recovery-grid">
                {focusRecoveryProtocol.recoveryDays.map((day) => (
                  <article key={day.id} className="focus-recovery-day">
                    <h5>{day.dayLabel}</h5>
                    <p>
                      Total target: <strong>{day.totalTarget} min</strong> ({requiredDailyMinutes} baseline +{' '}
                      {day.extraMinutes} recovery)
                    </p>
                    <ul className="planner-list">
                      {day.protocol.map((item) => (
                        <li key={`${day.id}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              {focusRecoveryProtocol.unresolvedMinutes > 0 ? (
                <p className="planner-meta">
                  Remaining unresolved backlog after safe cap:{' '}
                  <strong>{focusRecoveryProtocol.unresolvedMinutes} min</strong>. Continue with the same protocol
                  for another 1 to 2 days if needed.
                </p>
              ) : null}
            </section>
          ) : null}

          <h4>Last 7 Days Study Graph</h4>
          <div className="study-chart">
            {weeklyProgress.map((item) => (
              <div key={item.dayKey} className="chart-col">
                <div className="chart-bar-wrap">
                  <span
                    className={`chart-bar ${
                      item.ratio < 40 ? 'is-low' : item.ratio > 80 ? 'is-high' : 'is-medium'
                    }`}
                    style={{ height: `${item.ratio}%` }}
                  />
                </div>
                <small>{item.label}</small>
                <em>{formatMinutesSmart(item.studiedMinutes)}</em>
              </div>
            ))}
          </div>
              </article>
            ) : null}

            {activePlannerTab === 'social' ? (
              <article className="planner-card planner-timer-card social-balance-card">
                <div className="planner-timer-header">
                  <h3>Social Balance Tracker</h3>
                  <p>
                    Start this timer when you open social media. Staying within your limit protects your
                    performance score.
                  </p>
                </div>

                <label className="social-limit-field">
                  Daily social media limit (minutes)
                  <input
                    type="number"
                    min="10"
                    max="360"
                    step="5"
                    value={socialDailyLimitMinutes}
                    onChange={handleSocialLimitChange}
                  />
                </label>

                <div className="timer-display social-timer-display">
                  {formatStopwatch(socialElapsedSeconds)}
                </div>

                <div className="timer-controls">
                  {socialTimerStatus === 'running' ? (
                    <button className="btn btn-secondary" type="button" onClick={handleSocialTimerPause}>
                      Pause Social Timer
                    </button>
                  ) : (
                    <button className="btn btn-primary" type="button" onClick={handleSocialTimerStart}>
                      {socialTimerStatus === 'paused' ? 'Resume Social Timer' : 'Start Social Timer'}
                    </button>
                  )}
                  <button className="btn btn-primary" type="button" onClick={handleSocialTimerStop}>
                    Stop & Save Social Session
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={handleSocialTimerReset}>
                    Reset
                  </button>
                </div>

                <div className="study-metrics">
                  <article className="metric-card">
                    <p>Used Today</p>
                    <strong>{socialUsedTodayMinutes} min</strong>
                  </article>
                  <article className="metric-card">
                    <p>Daily Limit</p>
                    <strong>{socialDailyLimitMinutes} min</strong>
                  </article>
                  <article className="metric-card">
                    <p>Overuse</p>
                    <strong>{socialOveruseMinutes > 0 ? `${socialOveruseMinutes} min` : '0 min'}</strong>
                  </article>
                  <article className="metric-card">
                    <p>Performance Impact</p>
                    <strong>{`${Math.round((1 - socialPerformancePenaltyFactor) * 100)}% penalty`}</strong>
                  </article>
                </div>

                <div
                  className={`progress-track social-progress-track ${
                    socialOveruseMinutes > 0 ? 'over-limit' : ''
                  }`}
                  aria-label="Social media limit usage"
                >
                  <span style={{ width: `${Math.min(100, socialDailyUsagePercent)}%` }} />
                </div>
                <p className="progress-caption">
                  {socialOveruseMinutes > 0
                    ? `You exceeded your social limit by ${socialOveruseMinutes} minutes. This is currently reducing your performance score.`
                    : `You are within your daily social limit. Current usage: ${socialDailyUsagePercent.toFixed(0)}% of limit.`}
                </p>

                <p className="planner-meta">
                  Last 7 days average social usage: <strong>{socialWeeklyAverageMinutes.toFixed(0)} min/day</strong>
                </p>
              </article>
            ) : null}

            {activePlannerTab === 'calendar' ? (
              <article className="planner-card guardian-calendar">
          <div className="calendar-header">
            <h3>Interactive Guardian Calendar</h3>
            <div className="calendar-nav">
              <button
                type="button"
                className="btn btn-secondary calendar-btn"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                  )
                }
              >
                Prev
              </button>
              <strong>{monthLabel}</strong>
              <button
                type="button"
                className="btn btn-secondary calendar-btn"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                  )
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span key={`blank-${index}`} className="calendar-day blank" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1)
              const dayKey = formatDayKey(date)
              const isToday = dayKey === todayKey
              const isExamDay = dayKey === examDayKey
              const isConsolidationDay = consolidationSet.has(dayKey)
              const statusId = dayStatuses[dayKey]
              const statusClass = CALENDAR_STATUS_OPTIONS.find((item) => item.id === statusId)?.className || ''
              const isDone = statusId === 'completed' || Boolean(completedDays[dayKey])

              return (
                <button
                  key={dayKey}
                  type="button"
                  className={`calendar-day ${isToday ? 'today' : ''} ${isExamDay ? 'exam-day' : ''} ${
                    isConsolidationDay ? 'consolidation-day' : ''
                  } ${isDone ? 'done' : ''} ${statusClass} ${selectedCalendarDay === dayKey ? 'selected' : ''}`}
                  onClick={() => setSelectedCalendarDay(dayKey)}
                  title="Click to set day status"
                >
                  {index + 1}
                </button>
              )
            })}
          </div>

          <div className="calendar-status-panel">
            <h4>Date Action Panel</h4>
            {selectedCalendarDay ? (
              <>
                <p>
                  Selected date: <strong>{selectedCalendarDay}</strong>
                </p>
                <label className="calendar-status-label">
                  Update status
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      handleCalendarStatusChange(selectedCalendarDay, event.target.value)
                    }
                  >
                    {CALENDAR_STATUS_OPTIONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <p>Click any day in calendar to assign status.</p>
            )}
          </div>

          <p className="calendar-legend">
            Legend: <span className="dot today" /> Today <span className="dot exam" /> Exam Day{' '}
            <span className="dot consolidation" /> Consolidation <span className="dot done" /> Marked
            Complete
            <span className="dot planned" /> Planned <span className="dot revision" /> Revision{' '}
            <span className="dot mock" /> Mock Test <span className="dot catchup" /> Catch up{' '}
            <span className="dot rest" /> Rest <span className="dot skipped" /> Skipped
          </p>
              </article>
            ) : null}

            {activePlannerTab === 'report' ? (
              <article className="planner-card guardian-report-card">
                <h3>Guardian Angel Report</h3>
                <p className="planner-meta">
                  Deep assessment generated from Subject Locker, Strategy Builder, Performance Analysis,
                  Timer, Social Balance and Guardian Calendar.
                </p>
                <div className="guardian-report-overview">
                  <div>
                    <p>Overall Readiness Score</p>
                    <strong>
                      <span className={resolveScoreToneClass(guardianOverallScore)}>
                        {guardianOverallScore}
                      </span>
                      /100
                    </strong>
                    <span>{guardianOverallStatus}</span>
                  </div>
                </div>

                <div className="guardian-report-grid">
                  {guardianReportRows.map((row) => (
                    <article key={row.key} className="guardian-report-metric">
                      <h4>{row.label}</h4>
                      <strong className={resolveScoreToneClass(row.score)}>{row.score}%</strong>
                      <div className="progress-track" aria-label={`${row.label} score`}>
                        <span style={{ width: `${row.score}%` }} />
                      </div>
                      <p>{row.note}</p>
                    </article>
                  ))}
                </div>

                <div className="guardian-gamification-panel">
                  <div className="guardian-gamification-head">
                    <h4>Consistency & Badge Tracker</h4>
                    <p>
                      Lightweight gamification to reinforce study discipline without distracting from
                      preparation.
                    </p>
                  </div>

                  <div className="guardian-gamification-stats">
                    <article>
                      <p>Current study streak</p>
                      <strong>{currentStudyStreak} day(s)</strong>
                    </article>
                    <article>
                      <p>Longest streak (30 days)</p>
                      <strong>{longestStudyStreak} day(s)</strong>
                    </article>
                    <article>
                      <p>14-day consistency</p>
                      <strong className={resolveScoreToneClass(studyConsistencyPercent14)}>
                        {studyConsistencyPercent14}%
                      </strong>
                    </article>
                    <article>
                      <p>Badges unlocked</p>
                      <strong>
                        {unlockedBadgeCount}/{gamificationBadges.length}
                      </strong>
                    </article>
                  </div>

                  <div className="guardian-badge-grid">
                    {gamificationBadges.map((badge) => (
                      <article
                        key={badge.id}
                        className={`guardian-badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
                      >
                        <p className="guardian-badge-status">
                          {badge.unlocked ? 'Unlocked' : 'In Progress'}
                        </p>
                        <h5>{badge.title}</h5>
                        <p>{badge.description}</p>
                        <div className="progress-track" aria-label={`${badge.title} progress`}>
                          <span style={{ width: `${Math.round(badge.progress)}%` }} />
                        </div>
                        <small>{Math.round(badge.progress)}% complete</small>
                      </article>
                    ))}
                  </div>

                  {nextBadgeTarget ? (
                    <p className="guardian-next-badge">
                      Next target: <strong>{nextBadgeTarget.title}</strong> ({Math.round(nextBadgeTarget.progress)}
                      % complete)
                    </p>
                  ) : (
                    <p className="guardian-next-badge">
                      All current milestones unlocked. Keep consistency to sustain elite performance.
                    </p>
                  )}
                </div>

                {focusRecoveryProtocol ? (
                  <div className="guardian-report-sections">
                    <section>
                      <h4>Focus Recovery Protocol (3 Day Auto Plan)</h4>
                      <p>
                        Backlog identified: <strong>{focusRecoveryProtocol.backlogMinutes} minutes</strong>. Recovery is
                        intentionally capped to prevent burnout while restoring momentum.
                      </p>
                      <ul className="planner-list">
                        {focusRecoveryProtocol.recoveryDays.map((day) => (
                          <li key={`report-${day.id}`}>
                            <strong>{day.dayLabel}:</strong> +{day.extraMinutes} min recovery (target {day.totalTarget}{' '}
                            min)
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                ) : null}

                <div className="guardian-report-sections">
                  <section>
                    <h4>Current Potential Signals</h4>
                    <ul className="planner-list">
                      {(guardianStrengthSignals.length > 0
                        ? guardianStrengthSignals
                        : ['Potential signals are limited right now. Build stronger execution evidence.']
                      ).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4>Critical Risk Signals</h4>
                    <ul className="planner-list">
                      {(guardianRiskSignals.length > 0
                        ? guardianRiskSignals
                        : ['No major risk cluster detected currently. Protect your consistency.']
                      ).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <div className="guardian-report-sections">
                  <section>
                    <h4>Calculated Current Status</h4>
                    <p>
                      Candidate is operating at <strong>{guardianOverallScore}% readiness</strong> with a
                      projected performance profile of <strong>{performanceScoreAverage.toFixed(1)}</strong>{' '}
                      marks per selected subject. The present pattern suggests{' '}
                      <strong>{strongSubjects.length}</strong> high performance subjects,{' '}
                      <strong>{competitiveSubjects.length}</strong> competitive subjects, and{' '}
                      <strong>{weakSubjects.length}</strong> subjects needing urgent uplift.
                    </p>
                    <p>
                      Execution evidence from productivity systems shows{' '}
                      <strong>{weeklyProgressPercent.toFixed(0)}%</strong> weekly timer completion and{' '}
                      <strong>{calendarTaggedDays}</strong> calendar tagged days. The immediate priority is
                      to convert planning intent into consistently completed study blocks.
                    </p>
                  </section>
                </div>

                <div className="guardian-report-sections">
                  <section>
                    <h4>Next Cycle Action Plan</h4>
                    <ul className="planner-list">
                      {guardianActionPlan.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>

                <p className="planner-message">
                  You are closer than you think. Execute the next 14 days with discipline and Guardian
                  Angel will keep your preparation direction sharp, measurable, and competitive.
                </p>
                <div className="report-pdf-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleGenerateWeeklyReportPdf}
                    disabled={isGeneratingWeeklyReportPdf}
                  >
                    {isGeneratingWeeklyReportPdf
                      ? 'Generating Guardian Report PDF...'
                      : 'Generate Guardian Report PDF'}
                  </button>
                  {weeklyReportPdfUrl ? (
                    <>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        data-ga-pdf-url={weeklyReportPdfUrl}
                        data-ga-pdf-name={weeklyReportPdfFileName}
                        onClick={handleViewWeeklyReportPdf}
                      >
                        View Report PDF
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        data-ga-pdf-url={weeklyReportPdfUrl}
                        data-ga-pdf-name={weeklyReportPdfFileName}
                        onClick={handleDownloadWeeklyReportPdf}
                      >
                        Download Report PDF
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ) : null}

            <div className="planner-step-nav" aria-label="Study planner step navigation">
              {previousPlannerStep ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handlePlannerStepChange(previousPlannerStep)}
                >
                  Previous
                </button>
              ) : (
                <span className="planner-step-placeholder" aria-hidden="true" />
              )}
              <p>
                Step {plannerStepIndex + 1} of {PLANNER_TAB_SEQUENCE.length}:{' '}
                <strong>{PLANNER_TAB_SEQUENCE[plannerStepIndex].label}</strong>
              </p>
              {nextPlannerStep ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handlePlannerStepChange(nextPlannerStep)}
                >
                  Next
                </button>
              ) : (
                <span className="planner-step-placeholder" aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
