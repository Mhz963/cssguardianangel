// CSS subjects as used by the Key Documents catalogue (slugs match src/data/keyDocuments.json).
export const SUBJECT_GROUPS = [
  {
    id: 'compulsory',
    label: 'Compulsory',
    subjects: [
      ['essay', 'Essay'],
      ['english', 'English (Précis & Composition)'],
      ['gsa', 'General Science & Ability'],
      ['current-affairs', 'Current Affairs'],
      ['pakistan-affairs', 'Pakistan Affairs'],
      ['islamiat', 'Islamiat'],
      ['comparative-religions', 'Comparative Study of Major Religions'],
    ],
  },
  {
    id: 'g1',
    label: 'Group I',
    subjects: [
      ['accountancy-auditing', 'Accountancy & Auditing'],
      ['economics', 'Economics'],
      ['computer-science', 'Computer Science'],
      ['political-science', 'Political Science'],
      ['international-relations', 'International Relations'],
    ],
  },
  {
    id: 'g2',
    label: 'Group II',
    subjects: [
      ['physics', 'Physics'],
      ['chemistry', 'Chemistry'],
      ['applied-mathematics', 'Applied Mathematics'],
      ['pure-mathematics', 'Pure Mathematics'],
      ['statistics', 'Statistics'],
      ['geology', 'Geology'],
    ],
  },
  {
    id: 'g3',
    label: 'Group III',
    subjects: [
      ['business-administration', 'Business Administration'],
      ['public-administration', 'Public Administration'],
      ['governance-public-policies', 'Governance & Public Policies'],
      ['town-planning', 'Town Planning & Urban Management'],
    ],
  },
  {
    id: 'g4',
    label: 'Group IV',
    subjects: [
      ['history-pakistan-india', 'History of Pakistan & India'],
      ['islamic-history', 'Islamic History & Culture'],
      ['british-history', 'British History'],
      ['european-history', 'European History'],
      ['history-usa', 'History of USA'],
    ],
  },
  {
    id: 'g5',
    label: 'Group V',
    subjects: [
      ['gender-studies', 'Gender Studies'],
      ['environmental-sciences', 'Environmental Sciences'],
      ['agriculture-forestry', 'Agriculture & Forestry'],
      ['botany', 'Botany'],
      ['zoology', 'Zoology'],
      ['english-literature', 'English Literature'],
      ['urdu-literature', 'Urdu Literature'],
    ],
  },
  {
    id: 'g6',
    label: 'Group VI',
    subjects: [
      ['law', 'Law'],
      ['constitutional-law', 'Constitutional Law'],
      ['international-law', 'International Law'],
      ['muslim-law', 'Muslim Law & Jurisprudence'],
      ['mercantile-law', 'Mercantile Law'],
      ['criminology', 'Criminology'],
      ['philosophy', 'Philosophy'],
    ],
  },
  {
    id: 'g7',
    label: 'Group VII',
    subjects: [
      ['journalism', 'Journalism & Mass Communication'],
      ['psychology', 'Psychology'],
      ['geography', 'Geography'],
      ['sociology', 'Sociology'],
      ['anthropology', 'Anthropology'],
      ['punjabi', 'Punjabi'],
      ['sindhi', 'Sindhi'],
      ['pushto', 'Pushto'],
      ['balochi', 'Balochi'],
      ['persian', 'Persian'],
      ['arabic', 'Arabic'],
    ],
  },
]

export const SUBJECT_LABEL = Object.fromEntries(SUBJECT_GROUPS.flatMap((g) => g.subjects))

export const CATEGORIES = [
  'Constitution & Constitutional History',
  'Laws & Codes',
  'Policies & Strategies',
  'Economy & Official Reports',
  'Historical Documents',
  'Islamic Sources',
  'Treaties & Conventions',
  'UN & Global Frameworks',
  'Regional & Bilateral Agreements',
]

export const SCOPES = [
  { id: 'all', label: 'All' },
  { id: 'Pakistan', label: 'Pakistan' },
  { id: 'International', label: 'International' },
  { id: 'Other countries', label: 'Other countries' },
]

/** Syllabus page slugs (/css-syllabus/:slug) that differ from the Key Documents subject slugs. */
const SYLLABUS_ALIASES = {
  'general-science-and-ability': 'gsa',
  'general-science-ability': 'gsa',
  'comparative-study-of-major-religions': 'comparative-religions',
  'accountancy-and-auditing': 'accountancy-auditing',
  'governance-and-public-policies': 'governance-public-policies',
  'town-planning-and-urban-management': 'town-planning',
  'history-of-pakistan-and-india': 'history-pakistan-india',
  'islamic-history-and-culture': 'islamic-history',
  'history-of-usa': 'history-usa',
  'agriculture-and-forestry': 'agriculture-forestry',
  'muslim-law-and-jurisprudence': 'muslim-law',
  'journalism-and-mass-communication': 'journalism',
}

/** Key Documents subject slug for a syllabus page slug, or '' if none. */
export function keyDocsSubjectFor(syllabusSlug) {
  const s = SYLLABUS_ALIASES[syllabusSlug] || syllabusSlug
  return SUBJECT_LABEL[s] ? s : ''
}
