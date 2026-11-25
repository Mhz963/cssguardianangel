// Per-subject pages with full course outlines (~200 KB of JSON).
// Kept apart from syllabusData.js so list pages don't download the outlines.
import sourceOutlines from './subjectOutlines.json'
import { compulsorySubjects, optionalGroups, slugify } from './syllabusData'

const extractMarks = (title) => {
  const marksMatch = title.match(/\((\d+)\s*Marks\)/i)
  return marksMatch ? `${marksMatch[1]} Marks` : 'N/A'
}

const sourceSlugOverrides = {
  english: 'english-precis-composition',
  'general-science-and-ability': 'general-science-ability',
  'accountancy-and-auditing': 'accounting-auditing',
  'english-precis-and-composition': 'english-precis-composition',
  'comparative-study-of-major-religions': 'comparative-study-of-major-religions',
  'comparative-study-of-major-religions-for-non-muslims': 'comparative-study-of-major-religions',
  'town-planning-and-urban-management': 'town-planning-and-urban-management',
  'history-of-usa': 'css-syllabus-history-of-u-s-a',
  pushto: 'pashto',
}

const resolveSourceSlug = (slug) => sourceSlugOverrides[slug] ?? slug

const detailedSubjectPages = [
  ...compulsorySubjects.map((title) => ({
    slug: slugify(title),
    title,
    marks: extractMarks(title),
    category: 'Compulsory Subject',
    group: 'Compulsory',
    rules: 'All compulsory subjects are required for every CSS candidate.',
  })),
  ...optionalGroups.flatMap((item) =>
    item.subjects.map((title) => ({
      slug: slugify(title),
      title,
      marks: extractMarks(title),
      category: 'Optional Subject',
      group: item.group,
      rules: item.rules,
    })),
  ),
].map((subject) => {
  const sourceSlug = resolveSourceSlug(subject.slug)
  const sourceData = sourceOutlines[sourceSlug]

  return {
    ...subject,
    sourceSlug,
    sourceUrl: sourceData?.sourceUrl ?? '',
    outlineImages: sourceData?.outlineImages ?? [],
    outlineSections: sourceData?.outlineSections ?? [],
    outline: sourceData?.outline ?? [],
  }
})

export { detailedSubjectPages }
