import sourceOutlines from './subjectOutlines.json'

const compulsorySubjects = [
  'Essay (100 Marks)',
  'English (Precis & Composition) (100 Marks)',
  'General Science & Ability (100 Marks)',
  'Current Affairs (100 Marks)',
  'Pakistan Affairs (100 Marks)',
  'Islamiat (100 Marks)',
  'Comparative Study of Major Religions (For Non Muslims)',
]

const optionalGroups = [
  {
    group: 'Group I',
    rules: 'One subject of 200 marks can be opted.',
    subjects: [
      'Accountancy & Auditing (200 Marks)',
      'Economics (200 Marks)',
      'Computer Science (200 Marks)',
      'Political Science (200 Marks)',
      'International Relations (200 Marks)',
    ],
  },
  {
    group: 'Group II',
    rules: 'One subject of 200 marks or two subjects of 100 marks each can be opted.',
    subjects: [
      'Physics (200 Marks)',
      'Chemistry (200 Marks)',
      'Applied Mathematics (100 Marks)',
      'Pure Mathematics (100 Marks)',
      'Statistics (100 Marks)',
      'Geology (100 Marks)',
    ],
  },
  {
    group: 'Group III',
    rules: 'One subject of 100 marks can be opted.',
    subjects: [
      'Business Administration (100 Marks)',
      'Public Administration (100 Marks)',
      'Governance & Public Policies (100 Marks)',
      'Town Planning & Urban-Management (100 Marks)',
    ],
  },
  {
    group: 'Group IV',
    rules: 'One subject of 100 marks can be opted.',
    subjects: [
      'History of Pakistan & India (100 Marks)',
      'Islamic History & Culture (100 Marks)',
      'British History (100 Marks)',
      'European History (100 Marks)',
      'History of USA (100 Marks)',
    ],
  },
  {
    group: 'Group V',
    rules: 'One subject of 100 marks can be opted.',
    subjects: [
      'Gender Studies (100 Marks)',
      'Environmental Sciences (100 Marks)',
      'Agriculture & Forestry (100 Marks)',
      'Botany (100 Marks)',
      'Zoology (100 Marks)',
      'English Literature (100 Marks)',
      'Urdu Literature (100 Marks)',
    ],
  },
  {
    group: 'Group VI',
    rules: 'One subject of 100 marks can be opted.',
    subjects: [
      'Law (100 Marks)',
      'Constitutional Law (100 Marks)',
      'International Law (100 Marks)',
      'Muslim Law & Jurisprudence (100 Marks)',
      'Mercantile Law (100 Marks)',
      'Criminology (100 Marks)',
      'Philosophy (100 Marks)',
    ],
  },
  {
    group: 'Group VII',
    rules: 'One subject of 100 marks can be opted.',
    subjects: [
      'Journalism & Mass Communication (100 Marks)',
      'Psychology (100 Marks)',
      'Geography (100 Marks)',
      'Sociology (100 Marks)',
      'Anthropology (100 Marks)',
      'Punjabi (100 Marks)',
      'Sindhi (100 Marks)',
      'Pushto (100 Marks)',
      'Balochi (100 Marks)',
      'Persian (100 Marks)',
      'Arabic (100 Marks)',
    ],
  },
]

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

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
    outlineImages: sourceData?.outlineImages ?? [],
    outlineSections: sourceData?.outlineSections ?? [],
    outline: sourceData?.outline ?? [],
  }
})

export { compulsorySubjects, optionalGroups, detailedSubjectPages, slugify }
