import { compulsorySubjects, optionalGroups } from './syllabusData'

const formatStudySlideTitle = (fileName) => {
  const withoutExt = fileName.replace(/\.(ppt|pptx|pdf)$/i, '')
  return withoutExt
    .replace(/^Guardian_Angel_CSS_/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractLectureNumber = (fileName) => {
  const match = fileName.match(/Lecture[_\s]?(\d+)/i)
  return match ? Number(match[1]) : null
}

const normalizeSubjectFromFolder = (folderName) => {
  // folderName example:
  // - "CSS Current Affairs Lecture Sides"
  // - "CSS Crimionlgy Lecture Sides"
  const withoutPrefix = String(folderName || '').replace(/^CSS\s*/i, '').trim()
  // Folder names in /data sometimes use "Lecture Slides" and sometimes "Lecture Sides".
  // Rather than depending on exact spelling, cut everything after the "Lecture" keyword.
  const raw = withoutPrefix.replace(/\s+Lecture\s+.*$/i, '').replace(/\s+/g, ' ').trim()

  // Known renames to match how you want subjects displayed in the UI.
  if (/^Crimionlgy$/i.test(raw)) return 'Criminology'
  if (/^English\s+Essay$/i.test(raw)) return 'Essay'
  if (/^English\s+Precis$/i.test(raw)) return 'English (Precis & Composition)'
  if (/^GSA$/i.test(raw)) return 'General Science & Ability'
  if (/^Islamic\s+Studies$/i.test(raw)) return 'Islamiat'
  if (/^Pakistan\s+Affairs$/i.test(raw)) return 'Pakistan Affairs'
  if (/^Current\s+Affairs$/i.test(raw)) return 'Current Affairs'

  if (/^Comparative\s+Study/i.test(raw) && /Religion/i.test(raw)) {
    return 'Comparative Study of Major Religions (For Non Muslims)'
  }

  if (/^Governance/i.test(raw) && /Public/i.test(raw) && /Policies?/i.test(raw)) {
    return 'Governance & Public Policies'
  }

  // Your syllabus tab treats International Relations as a single optional subject (200 Marks),
  // while the slides are split by Paper I / Paper II folders.
  if (/^International\s+Relations\s+I$/i.test(raw)) return 'International Relations'
  if (/^International\s+Relations\s+II$/i.test(raw)) return 'International Relations'

  return raw
}

const normalizeSyllabusTitleNoMarks = (title) =>
  String(title || '')
    .replace(/\(\s*\d+\s*Marks\s*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

const getDescription = (subjectNormalized) => {
  const compact = {
    Essay: 'Lecture slides for Essay paper preparation (clear structure + exam practice).',
    'English (Precis & Composition)':
      'Lecture slides for Precis & Composition, with composition workflow and drills.',
    'General Science & Ability': 'Lecture slides for General Science & Ability with exam-focused coverage.',
    'Current Affairs': 'Lecture slides to help you build current-affairs understanding for answers.',
    'Pakistan Affairs': 'Lecture slides for Pakistan Affairs with structured, exam-ready references.',
    Islamiat: 'Lecture slides for Islamiat with core concepts and preparation workflow.',
    'Comparative Study of Major Religions (For Non Muslims)':
      'Lecture slides for comparative religions (replacement for Islamiat).',
    'Governance & Public Policies': 'Lecture slides for Governance & Public Policies with exam-ready framework.',
  }
  return compact[subjectNormalized] || `Lecture slides for ${subjectNormalized}.`
}

// Auto-load all CSS lecture slides from your top-level /data folder.
// This will include any new folders you add later without editing code.
const slideModules = import.meta.glob('../../data/**/Guardian_Angel_CSS_*.pptx', {
  eager: true,
  // Ensure Vite treats the pptx as an asset and returns a URL string.
  query: '?url',
  import: 'default',
})

const syllabusLookup = new Map()

for (const title of compulsorySubjects) {
  syllabusLookup.set(normalizeSyllabusTitleNoMarks(title), {
    subjectTitle: title, // exact title used in CSS Syllabus tab
    category: 'compulsory',
    optionalGroup: null,
  })
}

for (const group of optionalGroups) {
  for (const title of group.subjects) {
    syllabusLookup.set(normalizeSyllabusTitleNoMarks(title), {
      subjectTitle: title,
      category: 'optional',
      optionalGroup: group.group,
    })
  }
}

const slides = Object.entries(slideModules)
  .map(([filePath, url]) => {
    const normalizedPath = String(filePath).replace(/\\/g, '/')
    const parts = normalizedPath.split('/')
    const fileName = parts[parts.length - 1]
    const folderName = parts[parts.length - 2]

    if (!folderName || !/^CSS\s+/i.test(folderName)) return null
    if (!/Lecture/i.test(folderName)) return null

    const subjectNormalized = normalizeSubjectFromFolder(folderName)

    return {
      subjectNormalized,
      title: formatStudySlideTitle(fileName),
      lectureNumber: extractLectureNumber(fileName),
      fileName,
      url,
    }
  })
  .filter(Boolean)

const groupsBySubject = new Map()

for (const slide of slides) {
  const key = String(slide.subjectNormalized || '').replace(/\s+/g, ' ').trim()
  const resolved = syllabusLookup.get(key) || {
    subjectTitle: key,
    category: 'optional',
    optionalGroup: 'Additional Optional Subjects',
  }

  const existing = groupsBySubject.get(resolved.subjectTitle)
  if (!existing) {
    groupsBySubject.set(resolved.subjectTitle, {
      subject: resolved.subjectTitle, // includes "(100 Marks)" etc, matching CSS Syllabus tab
      category: resolved.category, // 'compulsory' | 'optional'
      optionalGroup: resolved.optionalGroup,
      description: getDescription(slide.subjectNormalized),
      slides: [slide],
    })
  } else {
    existing.slides.push(slide)
  }
}

// Stable sort to match CSS Syllabus tab ordering.
const rank = new Map()
let r = 0
for (const title of compulsorySubjects) {
  rank.set(title, r++)
}
for (const group of optionalGroups) {
  for (const title of group.subjects) {
    rank.set(title, r++)
  }
}

const cssStudyMaterials = Array.from(groupsBySubject.values()).sort((a, b) => {
  const aRank = rank.get(a.subject) ?? 999999
  const bRank = rank.get(b.subject) ?? 999999
  return aRank - bRank
})

export { cssStudyMaterials }

