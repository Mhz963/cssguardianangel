const PLACEHOLDER = /^(none|n\/a|na|nil|null|-|—|–|\.|x+)$/i

const SKILL_ALIASES = {
  maths: 'Mathematics',
  math: 'Mathematics',
  mathematics: 'Mathematics',
  computer: 'Computer Studies',
  computers: 'Computer Studies',
  computing: 'Computer Studies',
  it: 'Information Technology',
  teaching: 'Teaching',
  teacher: 'Classroom Instruction',
  english: 'English',
  science: 'Science',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  research: 'Research',
  writing: 'Report Writing',
  communication: 'Communication',
  ms: 'MS Office',
  excel: 'Microsoft Excel',
  word: 'Microsoft Word',
  office: 'MS Office',
}

const JOB_FAMILIES = [
  {
    id: 'teaching',
    label: 'Teacher',
    match: /\b(teach|teacher|lectur|tutor|instructor|education|school|college|faculty|classroom)\b/i,
    headline: (role) => prettyTitle(role) || 'Teacher',
    impliedSkills: ['Classroom Management', 'Lesson Planning', 'Student Assessment', 'Communication'],
    summary: ({ years, skills, org, city }) =>
      `Dedicated Teacher with${years} classroom experience in ${skillList(skills, 'Mathematics, Computer Studies, and core academic subjects')}. ${
        org ? `Currently serving at ${org}${city ? ` in ${city}` : ''}, with a focus on clear instruction, student progress, and a disciplined teaching approach. ` : ''
      }Skilled at lesson planning, student engagement, and creating a structured learning environment.`,
    bullets: ({ skills, org }) => [
      `Designed and delivered engaging classroom lessons${subjectClause(skills)}`,
      `Guided students through structured explanations, practice work, and regular assessment`,
      `Maintained an organized classroom environment that supports learning, discipline, and confidence`,
      `Supported academic growth through timely feedback, mentoring, and clear communication${org ? ` at ${org}` : ''}`,
    ],
  },
  {
    id: 'css',
    label: 'Civil Service Candidate',
    match: /\b(css|fpsc|pms|civil service|research officer|section officer|public (policy|service)|governance)\b/i,
    headline: (role) => prettyTitle(role) || 'Civil Service Candidate',
    impliedSkills: ['Research', 'Policy Analysis', 'Report Writing', 'Current Affairs'],
    summary: ({ years, skills, org, city }) =>
      `Focused civil service professional with${years} experience in ${skillList(skills, 'research, writing, and public affairs')}. ${
        org ? `Background includes work with ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Prepared to contribute analytical writing, policy awareness, and disciplined public service.`,
    bullets: ({ skills }) => [
      `Conducted structured research and prepared clear written briefs${subjectClause(skills)}`,
      `Tracked current affairs and policy developments for exam ready analysis`,
      `Organized notes, reports, and arguments with a strong emphasis on relevance and evidence`,
      `Communicated complex issues in concise, formal language`,
    ],
  },
  {
    id: 'it',
    label: 'Information Technology Professional',
    match: /\b(software|developer|programmer|engineer|it|web|frontend|backend|data|python|javascript|react|sql)\b/i,
    headline: (role) => prettyTitle(role) || 'Information Technology Professional',
    impliedSkills: ['Problem Solving', 'Documentation', 'Team Collaboration'],
    summary: ({ years, skills, org, city }) =>
      `Results driven IT professional with${years} experience in ${skillList(skills, 'software, systems, and digital problem solving')}. ${
        org ? `Worked with ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Known for practical delivery, clear documentation, and reliable technical support.`,
    bullets: ({ skills }) => [
      `Built and maintained digital solutions${subjectClause(skills)}`,
      `Diagnosed issues and delivered timely technical support`,
      `Documented processes so work stayed clear, reusable, and easy to hand over`,
      `Collaborated with teammates to complete assigned features on schedule`,
    ],
  },
  {
    id: 'admin',
    label: 'Administrator',
    match: /\b(admin|office|coordinator|secretary|clerk|operations|hr|human resource|assistant)\b/i,
    headline: (role) => prettyTitle(role) || 'Administrator',
    impliedSkills: ['Record Keeping', 'Coordination', 'MS Office', 'Scheduling'],
    summary: ({ years, skills, org, city }) =>
      `Organized administrative professional with${years} experience in ${skillList(skills, 'office coordination, records, and communication')}. ${
        org ? `Supported operations at ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Reliable with deadlines, documentation, and day to day office management.`,
    bullets: () => [
      `Managed daily office records, correspondence, and scheduling`,
      `Coordinated staff, visitors, and internal communication`,
      `Prepared documents and reports with accuracy and attention to detail`,
      `Supported smooth operations by keeping files, tasks, and follow ups in order`,
    ],
  },
  {
    id: 'ngo',
    label: 'Development Professional',
    match: /\b(ngo|non[- ]profit|development|humanitarian|community|advocacy|donor|field officer)\b/i,
    headline: (role) => prettyTitle(role) || 'Development Professional',
    impliedSkills: ['Community Engagement', 'Reporting', 'Stakeholder Coordination'],
    summary: ({ years, skills, org, city }) =>
      `Community focused professional with${years} experience in ${skillList(skills, 'field coordination, reporting, and public engagement')}. ${
        org ? `Contributed at ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Committed to clear reporting and practical on ground delivery.`,
    bullets: () => [
      `Coordinated field activities and community outreach with clear follow through`,
      `Prepared progress notes and reports for internal and partner use`,
      `Supported beneficiaries through structured communication and case follow up`,
      `Worked with colleagues to keep activities organized and on schedule`,
    ],
  },
  {
    id: 'research',
    label: 'Research Professional',
    match: /\b(research|analyst|academic|thesis|survey|data analysis|publication)\b/i,
    headline: (role) => prettyTitle(role) || 'Research Professional',
    impliedSkills: ['Literature Review', 'Data Analysis', 'Academic Writing'],
    summary: ({ years, skills, org, city }) =>
      `Analytical researcher with${years} experience in ${skillList(skills, 'inquiry, writing, and evidence based analysis')}. ${
        org ? `Research work includes ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Strong at turning raw notes into clear, structured findings.`,
    bullets: () => [
      `Collected and organized source material for structured analysis`,
      `Wrote clear summaries, literature notes, and evidence based arguments`,
      `Used data and examples to support conclusions`,
      `Presented findings in a formal, easy to follow written style`,
    ],
  },
  {
    id: 'finance',
    label: 'Finance Professional',
    match: /\b(account|finance|audit|bank|tax|bookkeep|payroll)\b/i,
    headline: (role) => prettyTitle(role) || 'Finance Professional',
    impliedSkills: ['Financial Reporting', 'Reconciliation', 'Attention to Detail'],
    summary: ({ years, skills, org, city }) =>
      `Detail oriented finance professional with${years} experience in ${skillList(skills, 'accounts, reporting, and compliance')}. ${
        org ? `Worked with ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Trusted with accurate records and timely reporting.`,
    bullets: () => [
      `Maintained accurate financial records and supporting documents`,
      `Prepared reports and reconciliations with close attention to detail`,
      `Supported audits, payroll, or billing tasks as assigned`,
      `Met reporting deadlines while keeping numbers clean and traceable`,
    ],
  },
  {
    id: 'media',
    label: 'Communications Professional',
    match: /\b(media|journalis|content|editor|social media|public relations|writer|copy)\b/i,
    headline: (role) => prettyTitle(role) || 'Communications Professional',
    impliedSkills: ['Content Writing', 'Editing', 'Digital Communication'],
    summary: ({ years, skills, org, city }) =>
      `Clear communicator with${years} experience in ${skillList(skills, 'writing, editing, and digital content')}. ${
        org ? `Created work for ${org}${city ? ` in ${city}` : ''}. ` : ''
      }Skilled at turning ideas into concise, audience ready language.`,
    bullets: () => [
      `Wrote and edited clear content for print or digital audiences`,
      `Researched topics and shaped them into structured stories or posts`,
      `Maintained a consistent tone and high standard of language`,
      `Delivered work on deadline with careful proofreading`,
    ],
  },
]

const GENERAL_FAMILY = {
  id: 'general',
  label: 'Professional',
  headline: (role) => prettyTitle(role) || 'Professional',
  impliedSkills: ['Communication', 'Time Management', 'Teamwork', 'Problem Solving'],
  summary: ({ years, skills, org, city, role }) =>
    `Motivated ${role || 'professional'} with${years} experience in ${skillList(skills, 'communication, organization, and dependable delivery')}. ${
      org ? `Recent work includes ${org}${city ? ` in ${city}` : ''}. ` : ''
    }Known for a strong work ethic, clear communication, and a results focused approach.`,
  bullets: ({ role }) => [
    `Carried out assigned duties with consistency, care, and a professional standard`,
    `Communicated clearly with colleagues and supported day to day team goals`,
    `Organized tasks and followed through so work was completed on time`,
    `Applied ${role || 'professional'} skills to improve quality and reliability of output`,
  ],
}

export function createEntryId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyExperience() {
  return {
    id: createEntryId(),
    title: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    notes: '',
  }
}

export function createEmptyEducation() {
  return {
    id: createEntryId(),
    school: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    details: '',
  }
}

export function createEmptyProject() {
  return { id: createEntryId(), name: '', notes: '' }
}

export function createEmptyCertification() {
  return { id: createEntryId(), name: '', issuer: '', year: '' }
}

export function createEmptyResumeDraft() {
  return {
    fullName: '',
    email: '',
    phone: '',
    city: '',
    linkedin: '',
    website: '',
    github: '',
    upwork: '',
    targetRole: '',
    summaryNotes: '',
    skillsText: '',
    experiences: [createEmptyExperience()],
    education: [createEmptyEducation()],
    projects: [createEmptyProject()],
    certifications: [createEmptyCertification()],
  }
}

export function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isPlaceholder(value) {
  const text = normalizeWhitespace(value)
  return !text || PLACEHOLDER.test(text)
}

function prettyTitle(value) {
  const text = normalizeWhitespace(value)
  if (isPlaceholder(text)) return ''
  if (text.length <= 4 && /[a-z]/i.test(text)) return text.toUpperCase()
  return text
    .split(' ')
    .map((part) => {
      if (!part) return part
      if (part === part.toUpperCase() && part.length <= 5) return part
      if (/^(and|of|the|for|in|at|to)$/i.test(part)) return part.toLowerCase()
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    })
    .join(' ')
    .replace(/^[a-z]/, (letter) => letter.toUpperCase())
}

function skillAlias(value) {
  const raw = normalizeWhitespace(value)
  if (isPlaceholder(raw)) return ''
  const key = raw.toLowerCase()
  return SKILL_ALIASES[key] || prettyTitle(raw)
}

function skillList(skills, fallback) {
  const clean = (skills || []).filter(Boolean).slice(0, 3)
  if (!clean.length) return fallback
  if (clean.length === 1) return clean[0]
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`
  return `${clean[0]}, ${clean[1]}, and ${clean[2]}`
}

function subjectClause(skills) {
  const focus = (skills || []).filter((item) => !/^teaching$|^classroom/i.test(item)).slice(0, 2)
  if (!focus.length) return ''
  return ` in ${skillList(focus)}`
}

function detectJobFamily(targetRole, blob) {
  const haystack = `${targetRole} ${blob}`
  return JOB_FAMILIES.find((family) => family.match.test(haystack)) || GENERAL_FAMILY
}

function estimateYears(experiences) {
  const years = (experiences || [])
    .map((item) => parseInt(String(item.startDate || '').replace(/\D/g, '').slice(0, 4), 10))
    .filter((year) => year >= 1975 && year <= new Date().getFullYear())
  if (!years.length) return ''
  const span = Math.max(1, new Date().getFullYear() - Math.min(...years))
  return span === 1 ? ' one year of' : ` over ${span} years of`
}

function formatDateRange(startDate, endDate, current) {
  const start = normalizeWhitespace(startDate)
  const end = current ? 'Present' : normalizeWhitespace(endDate)
  if (start && end) return `${start} – ${end}`
  return start || end || ''
}

function hasContent(entry, keys) {
  return keys.some((key) => !isPlaceholder(entry?.[key]))
}

function isWeakNote(text) {
  return isPlaceholder(text)
}

function parseSkills(skillsText) {
  const seen = new Set()
  return String(skillsText || '')
    .split(/[,/\n|]+/)
    .map(skillAlias)
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

function mergeSkills(userSkills) {
  return (userSkills || []).slice(0, 16)
}

function cleanProse(value) {
  return normalizeWhitespace(value)
    .replace(/^\s*[-–—•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function polishUserBullet(raw) {
  let text = cleanProse(raw).replace(/^(i|we|my|our)\s+/i, '')
  text = text.replace(/^responsible for\s+/i, '')
  text = text.replace(/^duties included\s+/i, '')
  if (isPlaceholder(text)) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/[.;:,]+$/g, '')
}

function splitNotes(notes) {
  return String(notes || '')
    .split(/\n+|•|\u2022|(?:;\s+)/)
    .map((part) => polishUserBullet(part.replace(/^[-*]\s*/, '')))
    .filter(Boolean)
    .slice(0, 5)
}

function buildSummary({ notes }) {
  if (isPlaceholder(notes)) return ''
  return cleanProse(notes).replace(/^[a-z]/, (letter) => letter.toUpperCase())
}

function buildJobBullets(item) {
  return splitNotes(item.notes).slice(0, 6)
}

export function validateResumeDraft(draft) {
  if (isPlaceholder(draft?.fullName)) return 'Enter your full name.'
  const hasSkills = parseSkills(draft?.skillsText).length > 0
  const hasExperience = (draft?.experiences || []).some((item) =>
    hasContent(item, ['title', 'organization', 'notes']),
  )
  const hasEducation = (draft?.education || []).some((item) => hasContent(item, ['school', 'degree', 'field']))
  if (!hasSkills && !hasExperience && !hasEducation) {
    return 'Add skills, work experience, or education so the resume has substance.'
  }
  return ''
}

export function buildAtsResume(draft) {
  const blob = [
    draft.targetRole,
    draft.summaryNotes,
    draft.skillsText,
    ...(draft.experiences || []).flatMap((item) => [item.title, item.organization, item.notes]),
  ].join(' ')

  const family = detectJobFamily(draft.targetRole, blob)
  const role = prettyTitle(draft.targetRole)
  const skills = mergeSkills(parseSkills(draft.skillsText))

  const experience = (draft.experiences || [])
    .filter((item) => hasContent(item, ['title', 'organization', 'notes', 'startDate']))
    .map((item) => ({
      id: item.id,
      title: prettyTitle(item.title),
      organization: prettyTitle(item.organization),
      location: prettyTitle(item.location),
      dates: formatDateRange(item.startDate, item.endDate, item.current),
      bullets: buildJobBullets(item),
    }))

  const education = (draft.education || [])
    .filter((item) => hasContent(item, ['school', 'degree', 'field']))
    .map((item) => ({
      id: item.id,
      school: prettyTitle(item.school),
      degree: prettyTitle(item.degree),
      field: prettyTitle(item.field),
      dates: formatDateRange(item.startDate, item.endDate, false),
      details: polishUserBullet(item.details),
    }))

  const projects = (draft.projects || [])
    .filter((item) => hasContent(item, ['name', 'notes']))
    .map((item) => ({
      id: item.id,
      name: prettyTitle(item.name) || 'Project',
      bullets: splitNotes(item.notes).slice(0, 3),
    }))
    .filter((item) => item.bullets.length)

  const certifications = (draft.certifications || [])
    .filter((item) => hasContent(item, ['name', 'issuer']))
    .map((item) => ({
      id: item.id,
      name: prettyTitle(item.name),
      issuer: prettyTitle(item.issuer),
      year: normalizeWhitespace(item.year),
    }))

  return {
    header: {
      name: prettyTitle(draft.fullName),
      email: isPlaceholder(draft.email) ? '' : normalizeWhitespace(draft.email).toLowerCase(),
      phone: isPlaceholder(draft.phone) ? '' : normalizeWhitespace(draft.phone),
      city: prettyTitle(draft.city),
      linkedin: isPlaceholder(draft.linkedin) ? '' : normalizeWhitespace(draft.linkedin),
      website: isPlaceholder(draft.website) ? '' : normalizeWhitespace(draft.website),
      github: isPlaceholder(draft.github) ? '' : normalizeWhitespace(draft.github),
      upwork: isPlaceholder(draft.upwork) ? '' : normalizeWhitespace(draft.upwork),
    },
    targetRole: role,
    jobFamily: family.id,
    links: [
      { label: 'Portfolio', url: isPlaceholder(draft.website) ? '' : normalizeWhitespace(draft.website) },
      { label: 'Upwork', url: isPlaceholder(draft.upwork) ? '' : normalizeWhitespace(draft.upwork) },
      { label: 'LinkedIn', url: isPlaceholder(draft.linkedin) ? '' : normalizeWhitespace(draft.linkedin) },
      { label: 'GitHub', url: isPlaceholder(draft.github) ? '' : normalizeWhitespace(draft.github) },
    ].filter((item) => item.url),
    summary: buildSummary({
      notes: draft.summaryNotes,
    }),
    skills,
    experience,
    education,
    projects,
    certifications,
    polishSource: 'engine',
  }
}

export function enhanceResumeCopy(resume) {
  return {
    ...cloneResume(resume),
    polishSource: 'engine',
  }
}

export function cloneResume(resume) {
  return JSON.parse(JSON.stringify(resume))
}
