import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Rectangle, TileLayer, Tooltip, useMap } from 'react-leaflet'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './App.css'
import logo from './assets/guardian-angel-logo.png'
import {
  compulsorySubjects,
  detailedSubjectPages,
  optionalGroups,
  slugify,
} from './data/syllabusData'
import { jsPDF } from 'jspdf'

const SITE_URL = 'https://mhzguardianangel.vercel.app'

const DEFAULT_SEO = {
  title: 'Guardian Angel | CSS Preparation Platform Pakistan',
  description:
    'Guardian Angel provides free CSS preparation resources in Pakistan, including CSS syllabus, CSS rules, past papers, current affairs, Pakistan affairs, and guided study planning.',
  keywords:
    'CSS Pakistan, FPSC CSS exam, CSS preparation, CSS syllabus, CSS past papers, CSS rules, current affairs Pakistan, Pakistan affairs, CSS essay preparation, CSS optional subjects',
}

const SEO_BY_PATH = {
  '/': {
    title: 'Guardian Angel | Free CSS Preparation Platform in Pakistan',
    description:
      'Prepare for the FPSC CSS exam with free CSS syllabus coverage, past papers, current affairs analysis, Pakistan affairs updates, and practical study guidance.',
  },
  '/css-syllabus': {
    title: 'CSS Syllabus | Compulsory and Optional Subjects',
    description:
      'Explore the complete FPSC CSS syllabus with compulsory and optional subjects to build a focused and strategic preparation plan.',
  },
  '/css-rules': {
    title: 'CSS Rules and Eligibility | FPSC Guidance',
    description:
      'Review CSS eligibility, age limit, attempts, domicile, and official rule guidance to verify your FPSC CSS exam readiness.',
  },
  '/css-past-papers': {
    title: 'CSS Past Papers | Download and Practice',
    description:
      'Access CSS past papers by subject to identify examiner trends, practice answer writing, and strengthen high scoring preparation.',
  },
  '/css-study-material': {
    title: 'CSS Study Material | Free Preparation Resources',
    description:
      'Get free CSS study material for compulsory and optional subjects with topic wise coverage for consistent and exam oriented preparation.',
  },
  '/global-affairs': {
    title: 'Global Affairs | Current Affairs, Pakistan Affairs, Global Conflict Map',
    description:
      'Track global current affairs, Pakistan specific developments, and global conflict signals through an interactive map for CSS preparation.',
  },
  '/signin': {
    title: 'Sign In | Guardian Angel',
    description:
      'Sign in to Guardian Angel to access personalized CSS preparation features and your protected study planner.',
  },
  '/guardian-study-planner': {
    title: 'Guardian Study Planner | CSS Planning Tool',
    description:
      'Create a disciplined CSS study routine with a practical planner built for consistency, revision cycles, and answer writing goals.',
  },
  '/blog': {
    title: 'CSS Blog | Guardian Angel Insights',
    description:
      'Read practical CSS preparation blogs on strategy, current affairs analysis, answer writing, and exam discipline by Guardian Angel.',
  },
}

const pillars = [
  {
    title: 'Premium Quality Content',
    text: 'Guardian Angel material is designed according to FPSC standards and focuses on topper level preparation.',
  },
  {
    title: 'Completely Free',
    text: 'No subscriptions. No hidden charges. Knowledge is Priceless.',
  },
  {
    title: 'Smart Preparation',
    text: 'Guardian Angel focuses on strategic preparation, not unnecessary workload.',
  },
  {
    title: 'Equal Opportunity',
    text: 'Students from every city, village, and background can prepare for CSS.',
  },
]

const homeFaqs = [
  {
    question: 'What is CSS in Pakistan and why is the FPSC CSS exam so competitive?',
    answer:
      'CSS (Central Superior Services) is Pakistan’s top federal competitive examination conducted by FPSC. It is highly competitive because candidates are tested on analytical writing, current affairs, Pakistan affairs, general ability, and optional subjects under strict merit and allocation standards.',
  },
  {
    question: 'What are the latest CSS eligibility criteria, age limit, education requirement, and attempts?',
    answer:
      'Always verify from official FPSC notifications, but core CSS exam eligibility areas usually include age limit, educational qualification, nationality, domicile, and number of attempts. Do not rely on social media rumors; read the latest FPSC rules and public notices yourself before applying.',
  },
  {
    question: 'How can I create a complete CSS preparation plan for compulsory and optional subjects?',
    answer:
      'Build a weekly study plan around CSS compulsory subjects (Essay, Precis, General Science and Ability, Current Affairs, Pakistan Affairs, Islamic Studies/Comparative Religion) and your selected optional subjects. Use topic wise targets, answer writing practice, and monthly revision cycles.',
  },
  {
    question: 'How should beginners start CSS preparation with FPSC syllabus and past papers?',
    answer:
      'Start with the official FPSC CSS syllabus and then map each topic with past paper trends. Build a weekly plan for compulsory subjects, optional subject coverage, answer writing, and revision. Past papers should guide preparation direction, not random notes.',
  },
  {
    question: 'What is the best strategy for CSS Current Affairs and Pakistan Affairs preparation?',
    answer:
      'Use a structured method: daily newspaper analysis, weekly issue briefs, monthly revision sheets, and timed answer practice. Focus on causes, impacts, policy options, and Pakistan’s national interest. Depth and analysis beat copied facts.',
  },
  {
    question: 'How should I prepare CSS Essay and English Precis for high marks?',
    answer:
      'For CSS Essay and English Precis, focus on clarity, structure, grammar, argument flow, and regular writing drills under timed conditions. Read quality editorials, outline before writing, and get critical feedback. Improvement comes from iteration, not shortcuts.',
  },
  {
    question: 'How important are FPSC past papers and examiner trends in CSS preparation?',
    answer:
      'Past papers are essential because they reveal recurring themes, paper style, and depth expected by examiners. Use them to prioritize topics, but avoid memorized templates. FPSC rewards relevance, balanced argument, and independent analysis in answers.',
  },
  {
    question: 'Can self study beat academy culture for CSS exam preparation in Pakistan?',
    answer:
      'Yes. Self study can outperform academy dependence when done with discipline and accountability. A serious candidate who follows FPSC syllabus, authentic books, past papers, and writing practice can build stronger conceptual understanding than someone passively consuming lectures.',
  },
  {
    question: 'Can I pass CSS without joining expensive academies in Pakistan?',
    answer:
      'Yes. Many serious Jawans prepare through disciplined self study, authentic books, official documents, and consistent writing practice. Academy dependence is not a guarantee of success; clarity, consistency, and self accountability are.',
  },
  {
    question: 'Is relying on ready made CSS notes enough for exam success?',
    answer:
      'No. Notes can help in quick revision, but over reliance weakens conceptual command and originality. FPSC rewards critical thinking and argument quality. Build your own topic outlines after research so your answers remain unique and high scoring.',
  },
  {
    question: 'Which optional subjects are best in CSS and how should I choose them?',
    answer:
      'There is no universal “best optional subject.” Choose based on syllabus fit, interest, background, scoring potential over recent trends, and overlap with compulsory papers. A well chosen subject plus smart preparation is better than chasing hearsay.',
  },
  {
    question: 'How do I avoid low quality notes culture and improve critical thinking for CSS?',
    answer:
      'Replace copy paste notes with active research: compare multiple sources, ask why and how, build your own thesis, and write evidence based arguments. This develops original thinking, which is exactly what competitive civil service exams require.',
  },
  {
    question: 'What is the right mindset for CSS success: consistency, self belief, and faith?',
    answer:
      'CSS is a marathon. Stay consistent, review progress weekly, correct mistakes honestly, and protect your confidence. Work hard with discipline, keep self belief, and place your trust in Allah Almighty for outcomes while fulfilling your responsibility with excellence.',
  },
  {
    question: 'How many hours should I study daily for CSS and how do I stay motivated?',
    answer:
      'Quality matters more than raw hours. Most candidates improve with focused daily blocks, regular writing, and weekly performance review. Keep strong self belief, do honest effort, and place your trust in Allah Almighty while maintaining discipline and patience.',
  },
]

const blogPosts = [
  {
    slug: 'how-to-start-css-preparation-smartly',
    title: 'How to Start CSS Preparation Smartly in Pakistan',
    date: '2026-03-17T11:18:00+05:00',
    readTime: '5 min read',
    author: 'Guardian Angel',
    excerpt:
      'Most Jawans fail early because they start with random notes instead of structure. Begin from the official syllabus, define weekly outputs, and align study blocks with past paper patterns.',
    internalLinks: [
      { label: 'Explore CSS Syllabus', to: '/css-syllabus' },
      { label: 'Build your plan in Study Planner', to: '/guardian-study-planner' },
    ],
    externalLinks: [
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
      { label: 'Pakistan Bureau of Statistics', url: 'https://www.pbs.gov.pk/' },
    ],
  },
  {
    slug: 'css-essay-and-precis-writing-framework',
    title: 'CSS Essay and Precis: A Practical Writing Framework',
    date: '2026-03-17T12:42:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Strong writing comes from repeatable structure: thesis clarity, argument flow, evidence placement, and conclusion discipline. Practice with time limits and weekly review loops.',
    internalLinks: [
      { label: 'Practice with CSS Past Papers', to: '/css-past-papers' },
      { label: 'Use AI Examiner for feedback', to: '/guardian-study-planner' },
    ],
    externalLinks: [
      { label: 'Dawn Editorials', url: 'https://www.dawn.com/' },
      { label: 'UN Official Portal', url: 'https://www.un.org/' },
    ],
  },
  {
    slug: 'current-affairs-analysis-for-css',
    title: 'Current Affairs Analysis for CSS: Depth Over Headlines',
    date: '2026-03-17T14:07:00+05:00',
    readTime: '5 min read',
    author: 'Guardian Angel',
    excerpt:
      'Reading news is not enough. Convert events into causes, implications, policy options, and Pakistan centric conclusions. This turns information into examiner worthy analysis.',
    internalLinks: [
      { label: 'Track Global Affairs Feed', to: '/global-affairs?tab=global' },
      { label: 'Review Pakistan Affairs Feed', to: '/global-affairs?tab=pakistan' },
    ],
    externalLinks: [
      { label: 'Ministry of Foreign Affairs Pakistan', url: 'https://mofa.gov.pk/' },
      { label: 'State Bank of Pakistan', url: 'https://www.sbp.org.pk/' },
    ],
  },
  {
    slug: 'optional-subject-selection-without-hype',
    title: 'Choosing CSS Optional Subjects Without Hype',
    date: '2026-03-17T15:36:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Do not chase rumors about scoring trends in isolation. Pick optionals based on interest, overlap, writing comfort, and long term sustainability for consistent performance.',
    internalLinks: [
      { label: 'Check optional groups in syllabus', to: '/css-syllabus' },
      { label: 'Use Subject Locker in planner', to: '/guardian-study-planner' },
    ],
    externalLinks: [
      { label: 'HEC Pakistan', url: 'https://hec.gov.pk/' },
      { label: 'World Bank Data', url: 'https://data.worldbank.org/' },
    ],
  },
  {
    slug: 'self-study-discipline-and-consistency',
    title: 'Self Study Discipline: The Real CSS Advantage',
    date: '2026-03-17T22:14:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Academy dependence can hide weak fundamentals. Self study with measurable daily targets, revision cycles, and honest feedback creates durable performance for competitive exams.',
    internalLinks: [
      { label: 'Read CSS Rules and eligibility', to: '/css-rules' },
      { label: 'Get free CSS Study Material', to: '/css-study-material' },
    ],
    externalLinks: [
      { label: 'Press Information Department Pakistan', url: 'https://pid.gov.pk/' },
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
    ],
  },
  {
    slug: 'research-mindset-for-css-success',
    title: 'Research Mindset for CSS Success: Think Beyond Ready-Made Notes',
    date: '2026-03-18T23:41:00+05:00',
    readTime: '5 min read',
    author: 'Guardian Angel',
    excerpt:
      'Top CSS Jawans do not memorize copied notes. They compare sources, build arguments, test assumptions, and write original analysis. Research based preparation creates durable confidence and better marks.',
    internalLinks: [
      { label: 'Read CSS Rules and standards', to: '/css-rules' },
      { label: 'Practice with CSS Past Papers', to: '/css-past-papers' },
    ],
    externalLinks: [
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
      { label: 'World Bank Data', url: 'https://data.worldbank.org/' },
    ],
  },
  {
    slug: 'stop-academy-dependence-build-self-study-system',
    title: 'Stop Academy Dependence and Build a Self Study System',
    date: '2026-03-18T00:26:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Academies can support, but dependency weakens initiative. Build your own weekly system with topic goals, writing drills, review checkpoints, and correction loops. Ownership of preparation drives real growth.',
    internalLinks: [
      { label: 'Open CSS Study Material', to: '/css-study-material' },
      { label: 'Use Guardian Study Planner', to: '/guardian-study-planner' },
    ],
    externalLinks: [
      { label: 'HEC Pakistan', url: 'https://hec.gov.pk/' },
      { label: 'Pakistan Bureau of Statistics', url: 'https://www.pbs.gov.pk/' },
    ],
  },
  {
    slug: 'confidence-without-comparison-in-css-journey',
    title: 'Confidence Without Comparison in Your CSS Journey',
    date: '2026-03-18T01:12:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Do not measure your future by someone else’s pace. Consistent personal progress, not social comparison, creates exam readiness. Compete with your previous self and improve one measurable metric each week.',
    internalLinks: [
      { label: 'Track your progress in planner', to: '/guardian-study-planner' },
      { label: 'Review optional subjects strategy', to: '/css-syllabus' },
    ],
    externalLinks: [
      { label: 'State Bank of Pakistan', url: 'https://www.sbp.org.pk/' },
      { label: 'Dawn News', url: 'https://www.dawn.com/' },
    ],
  },
  {
    slug: 'healthy-competition-no-judgement-css',
    title: 'Healthy Competition in CSS: No Judgement, No Negativity',
    date: '2026-03-18T02:37:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Competitive exams require discipline, not arrogance. Respect fellow Jawans, avoid judgemental thinking, and focus on your preparation ethics. A healthy mindset sustains performance under pressure.',
    internalLinks: [
      { label: 'Improve writing with AI Examiner', to: '/guardian-study-planner' },
      { label: 'Read current affairs updates', to: '/global-affairs?tab=global' },
    ],
    externalLinks: [
      { label: 'United Nations', url: 'https://www.un.org/' },
      { label: 'Press Information Department Pakistan', url: 'https://pid.gov.pk/' },
    ],
  },
  {
    slug: 'faith-hardwork-and-destiny-css-success',
    title: 'Faith, Hard Work, and Destiny: A Balanced CSS Success Mindset',
    date: '2026-03-18T13:05:00+05:00',
    readTime: '5 min read',
    author: 'Guardian Angel',
    excerpt:
      'Work with excellence, stay patient, and keep faith in Allah Almighty. Your duty is sincere effort and disciplined consistency. Outcomes are in Allah’s wisdom, and what is written for you is always best.',
    internalLinks: [
      { label: 'Start your disciplined study plan', to: '/guardian-study-planner' },
      { label: 'Review CSS Rules before exam cycle', to: '/css-rules' },
    ],
    externalLinks: [
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
      { label: 'Ministry of Foreign Affairs Pakistan', url: 'https://mofa.gov.pk/' },
    ],
  },
  {
    slug: 'css-motivation-consistency-over-intensity',
    title: 'CSS Motivation Strategy: Consistency Over Intensity',
    date: '2026-03-18T11:53:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'Burnout comes from irregular high intensity bursts. Sustainable success comes from stable daily blocks, realistic revision cycles, and weekly reflection. Small consistent wins beat short lived extremes.',
    internalLinks: [
      { label: 'Get structured plan from Strategy Builder', to: '/guardian-study-planner' },
      { label: 'Practice from verified past papers', to: '/css-past-papers' },
    ],
    externalLinks: [
      { label: 'Pakistan Bureau of Statistics', url: 'https://www.pbs.gov.pk/' },
      { label: 'World Bank Data', url: 'https://data.worldbank.org/' },
    ],
  },
  {
    slug: 'css-jawan-spirit-discipline-and-unity',
    title: 'CSS Jawans: The Soldiers of Knowledge',
    date: '2026-03-19T00:44:00+05:00',
    readTime: '4 min read',
    author: 'Guardian Angel',
    excerpt:
      'A CSS Jawan is not just a student but a soldier of knowledge who lives and breathes the mission of CSS, someone who eats, sleeps, thinks, and drinks CSS with complete dedication and discipline. This identity is not limited to success or failure because a CSS Jawan includes every person connected to this journey whether an aspirant, a struggling candidate, a qualifier, or a serving officer, with no discrimination among them as all share the same purpose of growth and service to the nation. The journey is not only about passing an exam but about building character, consistency, and intellectual strength, and through platforms like Guardian Angel, this mission is supported so that every CSS Jawan has the opportunity to turn effort into achievement and purpose into impact.',
    internalLinks: [
      { label: 'Build mission routine in Guardian Study Planner', to: '/guardian-study-planner' },
      { label: 'Practice with CSS Past Papers', to: '/css-past-papers' },
    ],
    externalLinks: [
      { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' },
      { label: 'Press Information Department Pakistan', url: 'https://pid.gov.pk/' },
    ],
  },
]

const getBlogWordCount = (post) => {
  const source = `${post?.excerpt || ''}`.trim()
  if (!source) return 0
  return source.split(/\s+/).filter(Boolean).length
}

const getBlogReadTime = (post) => {
  const words = getBlogWordCount(post)
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

const BLOG_CATEGORY_FILTERS = [
  'All',
  'Motivation',
  'Self Study',
  'Current Affairs',
  'Writing Skills',
  'Mindset & Faith',
]
const FEATURED_BLOG_SLUGS = [
  'css-jawan-spirit-discipline-and-unity',
  'research-mindset-for-css-success',
]

const getBlogCategories = (post) => {
  const text = `${post?.title || ''} ${post?.excerpt || ''}`.toLowerCase()
  const tags = new Set()

  if (/\bmotivation|discipline|consistency|confidence\b/.test(text)) tags.add('Motivation')
  if (/\bself study|academy|notes|research\b/.test(text)) tags.add('Self Study')
  if (/\bcurrent affairs|pakistan affairs|news|foreign|policy\b/.test(text)) tags.add('Current Affairs')
  if (/\bessay|precis|writing|argument|thesis\b/.test(text)) tags.add('Writing Skills')
  if (/\bfaith|allah|destiny|mindset|judgement|competition\b/.test(text)) tags.add('Mindset & Faith')
  if (post?.slug === 'css-jawan-spirit-discipline-and-unity') {
    tags.add('Self Study')
    tags.add('Mindset & Faith')
  }

  if (tags.size === 0) tags.add('Motivation')
  return Array.from(tags)
}

const getFaqHelpfulLinks = (question) => {
  const q = (question || '').toLowerCase()
  const officialFpsc = { label: 'FPSC Official Website', url: 'https://fpsc.gov.pk/' }
  const officialHec = { label: 'HEC Pakistan', url: 'https://hec.gov.pk/' }
  const pbs = { label: 'Pakistan Bureau of Statistics', url: 'https://www.pbs.gov.pk/' }
  const sbp = { label: 'State Bank of Pakistan', url: 'https://www.sbp.org.pk/' }
  const mofa = { label: 'Ministry of Foreign Affairs Pakistan', url: 'https://mofa.gov.pk/' }
  const pid = { label: 'Press Information Department', url: 'https://pid.gov.pk/' }
  const un = { label: 'United Nations', url: 'https://www.un.org/' }
  const worldBank = { label: 'World Bank Data', url: 'https://data.worldbank.org/' }
  const dawn = { label: 'Dawn News', url: 'https://www.dawn.com/' }
  const internalRules = { label: 'Read CSS Rules on Guardian Angel', url: '/css-rules' }
  const internalSyllabus = { label: 'Explore CSS Syllabus', url: '/css-syllabus' }
  const internalPastPapers = { label: 'Practice CSS Past Papers', url: '/css-past-papers' }
  const internalStudyMaterial = { label: 'Open CSS Study Material', url: '/css-study-material' }
  const internalPlanner = { label: 'Use Guardian Study Planner', url: '/guardian-study-planner' }
  const internalCurrentAffairs = { label: 'Track Current Affairs and Pakistan Affairs', url: '/global-affairs?tab=global' }
  const internalMap = { label: 'Open Global Conflict Map', url: '/global-affairs?tab=map' }

  let links = [officialFpsc, internalPlanner, internalSyllabus]

  if (q.includes('eligibility') || q.includes('age limit') || q.includes('attempts')) {
    links = [officialFpsc, officialHec, internalRules, internalSyllabus]
  } else if (q.includes('syllabus') || q.includes('optional') || q.includes('subjects')) {
    links = [officialFpsc, internalSyllabus, internalStudyMaterial, internalPlanner]
  } else if (q.includes('past papers') || q.includes('examiner trends')) {
    links = [officialFpsc, internalPastPapers, internalSyllabus, internalPlanner]
  } else if (q.includes('current affairs') || q.includes('pakistan affairs')) {
    links = [dawn, pid, mofa, pbs, internalCurrentAffairs, internalMap]
  } else if (q.includes('essay') || q.includes('precis') || q.includes('english')) {
    links = [dawn, internalPastPapers, internalStudyMaterial, internalPlanner]
  } else if (q.includes('self study') || q.includes('notes') || q.includes('academy')) {
    links = [officialFpsc, sbp, worldBank, un, internalStudyMaterial, internalPlanner]
  } else if (q.includes('strategy') || q.includes('plan') || q.includes('hours')) {
    links = [officialFpsc, pbs, sbp, internalPlanner, internalPastPapers]
  }

  const unique = links.filter((item, index, arr) => arr.findIndex((x) => x.url === item.url) === index)
  return unique.slice(0, 5)
}

const cssRulesSections = [
  {
    title: 'CSS Age Limit',
    content: [
      "1. No candidate shall be eligible for admission to the competitive examination unless he is neither below the age of twenty one years nor above the age of thirty years on the cut off date.",
      "Explanation: A candidate born on or before the 31st day of December, 1988 and on or after the 2nd day of January, 1998 shall not be eligible for the competitive examination of the year 2019.",
      "2. Two years relaxation in upper age limit of a candidate shall be admissible in respect of the following categories, namely:",
      "(a) the candidates belonging to the scheduled caste and Buddhist community subject to production of a certificate, in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf;",
      "(b) the candidates belonging to the recognized Tribes who are permanent residents of the areas mentioned below and whose families have been living in these areas, subject to production of a certificate, in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf:",
      "(i) Baluchistan;",
      "(ii) Tribal Areas of D.I.Khan and Peshawar Divisions (including former Frontier States of Dir, Swat, Chitral and Amb);",
      "(iii) former excluded (Baloch) area forming part of the Dera Ghazi Khan and Rajanpur Districts;",
      "(iv) former Tribal Areas of Mardan and Hazara Divisions; and",
      "(v) Upper Tanawal Area of Hazara Division;",
      "(c) the candidates who are permanent residents of Azad Kashmir Territory, subject to production of a certificate in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by the Division to which business of Azad Jammu and Kashmir stands allocated;",
      "(d) the candidates who are permanent residents of Gilgit Baltistan including Gilgit, Diamir, Baltistan, Ghizer and Guanche, subject to production of a certificate in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by the Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf;",
      "(e) the special candidates, namely, physically impaired, hearing or speech impaired and visually impaired, subject to production of certificate of disability in support of their claim issued by an officer of the Federal Government or, as the case may be, Provincial Government duly authorized in this behalf;",
      "(f) in service Government servants, armed forces personnel, contract employees, including the Government servants of Azad Jammu and Kashmir, who possess a minimum of two years continuous Government service as on the cut off date subject to production of departmental permission certificate from the competent authority as set out by the Commission from time to time. Employees of nationalized banks, State Bank of Pakistan, Water and Power Development Authority, regulatory authorities, autonomous bodies and other semi autonomous bodies are not entitled to the age relaxation under these rules:",
      "Provided that period of extraordinary leave (EOL) shall not be considered as period spent on duty under Fundamental Rule 9(6) for grant of age relaxation under these rules.",
      "3. The relaxation in upper age limits prescribed in these rules shall be permitted upto the maximum period of an individual concession and not by the total period of the concessions taken together, if admissible in any case.",
      "4. Except as provided in these rules, a candidate shall not be entitled to further relaxation in age limit under any other rule for the time being in force or on any other ground.",
    ],
  },
  {
    title: 'CSS Cut off Date',
    content: [
      "The cutoff date for determining the eligibility of the candidate in terms of age, qualifications, domicile shall be the 31st day of December of the year preceding the year of competitive examination.",
      "Explanation: For competitive examination 2019 the cut off date thereof shall be the 31st day of December, 2018.",
    ],
  },
  {
    title: 'CSS Educational Qualifications',
    content: [
      "1. A candidate for competitive examination must hold at least a second division or grade \"C\" bachelor's degree in any faculty of one of the Pakistani universities or an equivalent degree or comparable educational qualifications of a foreign university recognized by the Higher Education Commission (HEC), subject to production of equivalence certificate issued by HEC.",
      "2. Where a candidate does not hold the required degree on or before the cut off date, he shall be required to produce a certificate from the duly authorized officer of the concerned degree awarding institution, to the effect that the candidate has fulfilled all the requirements of the said degree and has cleared and passed the examination for the said degree on or before the cut off date. The candidate however would be required to produce the said degree before the final result is declared by the Commission.",
      "3. A candidate who has obtained a third division or 'D' grade in his bachelor's degree shall be eligible for the competitive examination in cases where he has obtained a higher division or grade in master's degree.",
    ],
  },
  {
    title: 'CSS Nationality',
    content: [
      '1. Candidates for competitive examination must be a citizen of Pakistan or a person deriving his nationality from the State of Jammu and Kashmir.',
      '2. A candidate who has married a person who is not a citizen of Pakistan shall not be eligible for appointment provided that a person who marries a foreign national of any country recognized by Federal Government with the prior permission of Government may be regarded as eligible for appointment.',
    ],
  },
  {
    title: 'CSS Domicile',
    content: [
      '1. Seats in respect of the Occupational Groups and Services shall be allocated in accordance with the policy as may be prescribed by the Federal Government before finalizing the appointments and for that purpose the candidates shall produce domicile certificate issued by the competent authority in accordance with the law and the rules.',
      '2. A candidate who has acquired the citizenship of Pakistan by registration under the Pakistan Citizenship Act, 1951 (II of 1951) and the rules made thereunder shall produce along with the application an attested copy of the certificate of citizenship. A candidate who has not been registered as a citizen of Pakistan but claims that he should be deemed to be citizen of Pakistan under the Pakistan Citizenship Act, 1951 (II of 1951) shall produce proof to the effect that he fulfills the conditions on the basis of which he claims to be deemed as a citizen of Pakistan. A candidate who derives his nationality from the State of Jammu and Kashmir shall produce along with the application a certificate issued by the Division to which business of the Azad Jammu and Kashmir stands allocated duly signed by an officer not below the rank of Deputy Secretary in support of his claim.',
      '3. Candidates of Azad Jammu and Kashmir shall produce domicile certificate alongwith permanent residence certificate along with the application forms issued by the Division to which business of the Azad Jammu and Kashmir stands allocated duly signed by an officer not below the rank of Deputy Secretary in support of his claim. No such certificates shall be accepted at any later stage.',
      '4. Domicile once claimed by a candidate and accepted by the Commission for the purpose of admission to competitive examination shall be final. No change will be allowed at a subsequent examination or selection.',
      '5. Domicile claimed by a candidate and accepted at the time of his first entry into Government service shall be treated as final for the purpose of candidature and allocation and no subsequent change in his domicile shall be accepted.',
    ],
  },
  {
    title: 'CSS Application Form',
    content: [
      "1. All applications for the competitive examination must be made online through the Commission's website www.fpsc.gov.pk.",
      '2. Online applications must be made on or before the closing date as advertised by the Commission.',
      "3. Printed copy of duly filled online application form (i.e. hardcopy) may be obtained and after signing it, copies of all documents and certificates as mentioned in application form alongwith original treasury receipt may be attached with it and dispatched to the Secretary of the Commission, so as to reach the Commission's headquarters within ten days of the closing date.",
      '4. An online application received incomplete, wrongly filled in or its hardcopy not accompanied with any one of the documents mentioned in the application form, shall be rejected.',
      '5. Hardcopy of the online application, if reached to the Commission after the stipulated period of ten days from the closing date, it shall not be accepted and online form already submitted to the Commission shall stand rejected.',
      '6. Any correction in the printed hard copy of online form may be made by hand and initialled before dispatch or submission to the Commission, whereafter no request for change in any entry of online application or its hard copy shall be accepted.',
      '7. No plea that hardcopy of online application form or any document attached therewith has been lost or delayed in the post shall be entertained.',
      "8. The candidate shall have to pay or deposit two hundred and fifty Rupees in the Commission's head of account as fine, if hard copy of online application is received without signature, subject to no other deficiency in application or attached documents, otherwise his application shall stand rejected.",
      '9. Hardcopy of the online application must be dispatched in a separate envelope. Two or more applications in one envelope shall not be acceptable.',
      "10. Candidate shall pay two thousand two hundred Rupees, or such other fee as the Commission may determine from time to time, as application fee for competitive examination as per procedure prescribed in Appendix II and deposited in the nearest Government's treasury or in State Bank or National Bank of Pakistan under the head of account C02101 Organs of State Exam Fee (FPSC Receipt). Cash, postal orders, bank drafts and cheques shall not be accepted by the Commission.",
      '11. Original treasury receipt for written examination must be attached with the application form to be deposited to the Commission. Without providing original treasury receipt, the application of the candidate shall be rejected.',
      '12. Subjects for the competitive examination shall comprise compulsory papers of 600 marks and optional papers of 600 marks.',
      '13. Optional subjects must be selected carefully, as wrong selection of subjects shall lead to rejection of candidature.',
      '14. Combination of optional subjects once chosen before closing date for submission of online application or corrected in hard copy of online application shall be treated as final and no request for change in subjects shall be allowed thereafter.',
      '15. A candidate who misses any compulsory or optional subject of written examination for medical or any other reasons shall neither be allowed to appear in the remaining subjects nor separate examination for re appearing in that missed paper shall be allowed.',
      '16. No candidate shall be eligible to avail more than three chances of the competitive examination within prescribed age limits.',
      'Explanation. A candidate shall be deemed to have attempted the examination and his chance stand consumed, if he actually appeared in any one or more papers of the competitive examination and even if he tendered blank answer book or sheet and even if rejected subsequently.',
      '17. A candidate who conceals the number of previous attempts, shall be liable to prosecution leading to his disqualification under these rules.',
      "18. No candidate shall be admitted to the examination hall who does not hold original Computerized National Identity Card (CNIC) and admission certificate generated or downloaded from the Commission's website i.e. www.fpsc.gov.pk as admission certificate shall not be sent through post.",
      '19. A candidate who arrives at examination hall or centre late, than the time mentioned in admission certificate and date sheet, he shall not be allowed to sit in the examination.',
      '20. Candidates shall be admitted to the examination provisionally at their own risk subject to their being found eligible in all respects. On detailed scrutiny of the applications after the announcement of result of the written examination, if any candidate is found ineligible in any respect under these rules his candidature shall be cancelled and rejected regardless of the fact whether he has appeared in the examination or qualified therein.',
      '21. To avoid inconvenience, candidates shall ensure before appearing at the examination that they fulfill all requirements of the rules, relating to the examination.',
    ],
  },
  {
    title: 'CSS Occupational Groups',
    content: [
      'The competitive examination shall be conducted by the Commission in respect of the Occupational Groups and Services consisting of:',
      '1. Commerce and Trade Group',
      '2. Foreign Service of Pakistan',
      '3. Information Group',
      '4. Inland Revenue Service',
      '5. Military Lands and Cantonments Group',
      '6. Office Management Group',
      '7. Pakistan Administrative Service',
      '8. Pakistan Audit and Accounts Service',
      '9. Pakistan Customs Service',
      '10. Police Service of Pakistan',
      '11. Postal Group',
      '12. Railways (Commercial and Transportation) Group',
    ],
  },
  {
    title: 'CSS Qualifying Marks for Written Exam',
    content: [
      '1. A candidate who fails to secure at least 40% marks in any of the compulsory subjects, 33% marks in any of the optional subjects and 50% marks in the aggregate shall be considered to have failed in written examination and shall not be eligible for medical examination, psychological assessment and viva voce.',
      '2. Only the candidates declared qualified in the written examination and found eligible shall be called for subsequent medical examination, psychological assessment and viva voce.',
    ],
  },
  {
    title: 'CSS Medical Examination',
    content: [
      '1. All candidates must be in good mental and bodily health and free from any physical defect likely to interfere with the discharge of their duties. The candidates who after such medical examination which the Commission and the appointing authority may prescribe are found not to satisfy these requirements shall not be appointed except special candidates as mentioned in sub rule (2) of CSS Competitive Examination Rules, 2019.',
      '2. Special candidates in the categories of physically impaired, hearing or speech impaired and visually impaired shall be eligible to compete for competitive examination against all Occupational Groups and Services according to his choice.',
      '3. Special candidates who are visually impaired or physically impaired shall be provided helper (writer), if they have been, by any Federal or a Provincial Council for Rehabilitation of Disabled Persons, declared permanently incapacitated with respect to writing and a disability certificate in that regard has been attached by them with application form and also requested for provision of helper in their application form. The Commission shall arrange the helper from within the available staff of the Commission deputed at the examination centre. The role of the helper would merely be to reproduce in writing the words so uttered by the special candidate. No intellectual contribution by the helper shall be permissible. The educational level of the helper would be graduation, intermediate or matriculation as per availability at the examination centre. No request for helper of choice or venue of the examination shall be entertained. The special candidate alongwith helper shall remain within the examination hall till conclusion of the paper.',
      '4. Extra time of 15 minutes per hour shall only be allowed to visually impaired candidates. The other categories of special candidates shall not be allowed extra time.',
      "5. The special candidate referred to in sub rules (3) and (4) of CSS Competitive Examination Rules, 2019 may attempt the question paper on computer, as the case may be, for which facility shall only be provided at the Commission's headquarters and its provincial offices, however, no TA/DA shall be admissible. Such computer literate candidates shall fill the relevant entries in the online application form, else they shall not be allowed to attempt the paper on computer.",
      '6. No application or medical certificate regarding claim for disability or request for provision of helper or computer on medical grounds or sudden accident, shall be accepted after the closing date, except where the claim has been made in the application form before the closing date and certificate of disability as aforesaid attached as an evidence.',
      '7. Candidates who qualify the written examination shall be medically examined by the medical board constituted for the purpose. If any candidate remains absent twice in his medical examination, his candidature shall automatically stand rejected and no appeal in this regard shall be entertained and his chance shall be considered as consumed.',
      "8. In order to prevent disappointment, candidates may get themselves examined by a Government's medical officer of the standing of a civil surgeon before applying for admission to the examination.",
    ],
  },
  {
    title: 'CSS Viva Voce',
    content: [
      '1. A candidate who is declared qualified in written examination shall be interviewed by a board who shall have before them a record of his career, both academic and extramural and he shall be asked questions on matters of general interest. The object of the interview is to assess his suitability for the services for which he is entered and in framing their assessment the board shall attach particular importance to the moral and ethical qualities of the candidates, his intelligence and alertness of mind, his vigour and strength of character and his potential qualities of leadership. The board shall take into consideration his extramural activities such as sports, debates, hobbies, etc., and their effect on his physique and character, in assessing his merit.',
      '2. All candidates are expected to have basic knowledge regarding Islam and Pakistan. Questions may be asked in the viva voce on these subjects. Persons securing less than pass marks in these subjects shall not be considered for appointment, irrespective of their proficiency in other fields. However, the non Muslim candidates shall not be asked any question regarding Islam.',
      '3. Viva voce shall be of 300 marks. A candidate who fails to secure at least 100 marks in viva voce shall be considered to have failed and shall not be eligible for appointment.',
      '4. The result of viva voce shall be intimated to all candidates in due course of time.',
    ],
  },
]

const formatPastPaperTitle = (relativePath) => {
  const fileName = relativePath.split('/').pop() || ''
  const noTimestamp = fileName
    .replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const withoutExt = noTimestamp.replace(/\.pdf$/i, '')
  return withoutExt
    .replace(/&amp;/gi, '&')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const formatStudySlideTitle = (fileName) => {
  const withoutExt = fileName.replace(/\.(ppt|pptx|pdf)$/i, '')
  return withoutExt
    .replace(/^Guardian_Angel_CSS_/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractLectureNumber = (fileName) => {
  const match = fileName.match(/Lecture_(\d+)/i)
  return match ? Number(match[1]) : null
}

const criminologySlideFiles = [
  'Guardian_Angel_CSS_Criminology_Lecture_1_Motivation.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_2_Section_I.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_3_Section_II.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_4_Section_III.pptx',
  'Guardian_Angel_CSS_Criminology_Lecture_5_Section_IV.pptx',
]

const genderStudiesSlideFiles = [
  'Guardian_Angel_CSS_Gender_Studies_Lecture_1_Motivation.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_2_Section_I.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_3_Social_Construction_of_Gender.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_4_Feminist_Theories_and_Practice.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_5_Feminist_Movements.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_6_Gender_and_Development.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_7_Status_of_Women_in_Pakistan.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_8_Gender_and_Governance.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_9_Gender_Based_Violence.pptx',
  'Guardian_Angel_CSS_Gender_Studies_Lecture_10_Case_Studies.pptx',
]

const internationalRelationsISlideFiles = [
  'Guardian_Angel_CSS_International_Relations_Lecture_1_Motivation.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_2_Introduction.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_3_Theories_and_Approaches.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_4_International_Political_Security.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_5_Strategic_Approach.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_6_International_Political_Economy.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_7_International_Political_Community.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_8_Approaches_to_Peace.pptx',
  'Guardian_Angel_CSS_International_Relations_Lecture_9_International_Political_Institutions.pptx',
]

const internationalRelationsIISlideFiles = [
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_1_Interwar_Period.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_2_Cold_War.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_3_Post_Cold_War.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_4_International_and_Regional_Organizations.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_5_Foreign_Policy_Selected_Countries.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_6_South_Asia.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_7_Weapons_of_Mass_Destruction.pptx',
  'Guardian_Angel_CSS_International_Relations_Paper_II_Lecture_8_Contemporary_Issues.pptx',
]

const businessAdministrationSlideFiles = [
  'Guardian_Angel_CSS_Business_Administration_Lecture_1_Motivation.pptx',
  'Guardian_Angel_CSS_Business_Administration_Lecture_2_Management.pptx',
  'Guardian_Angel_CSS_Business_Administration_Lecture_3_HR_Management.pptx',
  'Guardian_Angel_CSS_Business_Administration_Lecture_4_Financial_Management.pptx',
  'Guardian_Angel_CSS_Business_Administration_Lecture_5_Operations_and_Supply_Chain_Management.pptx',
  'Guardian_Angel_CSS_Business_Administration_Lecture_6_Marketing.pptx',
]

const criminologySlides = criminologySlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS Crimionlgy Lecture Sides/${fileName}`, import.meta.url).href,
}))

const genderStudiesSlides = genderStudiesSlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS Gender Studies Lecture Sides/${fileName}`, import.meta.url).href,
}))

const internationalRelationsISlides = internationalRelationsISlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS International Relations I Lecture Slides/${fileName}`, import.meta.url).href,
}))

const internationalRelationsIISlides = internationalRelationsIISlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS International Relations II Lecture Slides/${fileName}`, import.meta.url).href,
}))

const businessAdministrationSlides = businessAdministrationSlideFiles.map((fileName) => ({
  title: formatStudySlideTitle(fileName),
  lectureNumber: extractLectureNumber(fileName),
  fileName,
  url: new URL(`../data/CSS Business Administration Lecture Slides/${fileName}`, import.meta.url).href,
}))

const cssStudyMaterials = [
  {
    subject: 'Criminology',
    description: 'Foundational to advanced criminology lectures curated for CSS Jawans.',
    slides: criminologySlides,
  },
  {
    subject: 'Gender Studies',
    description: 'Complete lecture sequence covering core concepts, theories, and case studies.',
    slides: genderStudiesSlides,
  },
  {
    subject: 'International Relations I',
    description: 'Paper I lecture sequence covering theory, security, strategy, economy, and institutions.',
    slides: internationalRelationsISlides,
  },
  {
    subject: 'International Relations II',
    description:
      'Paper II lecture sequence covering interwar period, Cold War, South Asia, organizations, and contemporary issues.',
    slides: internationalRelationsIISlides,
  },
  {
    subject: 'Business Administration',
    description:
      'Lecture sequence covering management, HR, finance, operations, supply chain, and marketing for CSS preparation.',
    slides: businessAdministrationSlides,
  },
]

const cssPastPapers2025Paths = [
  'assets/media/2025-06-05-06-24-08-Accountancy-&amp;-Auditing-I-.pdf',
  'assets/media/2025-06-05-06-24-11-Accountancy-&amp;-Auditing-II-.pdf',
  'assets/media/2025-06-05-06-24-16-AGRICULTURE-&amp;-FORESTRY-.pdf',
  'assets/media/2025-06-05-06-24-19-ANTHROPOLOGY--.pdf',
  'assets/media/2025-06-05-06-24-23-APPLIED-MATHS.pdf',
  'assets/media/2025-06-05-06-24-27-ARABIC.pdf',
  'assets/media/2025-06-05-06-24-32-BALOCHI.pdf',
  'assets/media/2025-06-05-06-24-36-BOTANY.pdf',
  'assets/media/2025-06-05-06-24-40-BRITISH-HISTORY.pdf',
  'assets/media/2025-06-05-06-24-44-BUSINESS-ADMN.pdf',
  'assets/media/2025-06-05-06-24-48-CHEMISTRY-1.pdf',
  'assets/media/2025-06-05-06-24-52-CHEMISTRY-2.pdf',
  'assets/media/2025-06-05-06-24-56-COMARATIVE-ST.-NM-.pdf',
  'assets/media/2025-06-05-06-25-04-COMPUTER-SCIENCE-PAPER-1.pdf',
  'assets/media/2025-06-05-06-25-08-COMPUTER-SCIENCE-PAPER-2.pdf',
  'assets/media/2025-06-05-06-25-12-CONSTITUTIONAL-LAW.pdf',
  'assets/media/2025-06-05-06-25-16-CRIMINOLOGY.pdf',
  'assets/media/2025-06-05-06-25-20-ECONOMICS-PAPER-1.pdf',
  'assets/media/2025-06-05-06-25-25-ECONOMICS-PAPER-2.pdf',
  'assets/media/2025-06-05-06-25-33-ENGLISH-(P&amp;C).pdf',
  'assets/media/2025-06-05-06-25-37-ENGLISH-LITERATURE.pdf',
  'assets/media/2025-06-05-06-27-15-ENVIRONMENTAL-SC..pdf',
  'assets/media/2025-06-05-06-27-22-ESSAY-25.pdf',
  'assets/media/2025-06-05-06-27-29-EUROPEAN-HISTORY.pdf',
  'assets/media/2025-06-05-06-27-34-GENDER-STUDIES.pdf',
  'assets/media/2025-06-05-06-27-42-GEOGRAPHY.pdf',
  'assets/media/2025-06-05-06-27-45-GEOLOGY.pdf',
  'assets/media/2025-06-05-06-29-50-GK2--(CA)-.pdf',
  'assets/media/2025-06-05-06-29-55-GK3-PAK-AFFAIRS-.pdf',
  'assets/media/2025-06-05-06-30-01-GK-I.pdf',
  'assets/media/2025-06-05-06-32-49-GOVERNANCE-&amp;-P.P..pdf',
  'assets/media/2025-06-05-06-32-52-History-of-USA.pdf',
  'assets/media/2025-06-05-06-32-56-HISTORY-PAK-&amp;-INDIA.pdf',
  'assets/media/2025-06-05-06-32-59-INTERNATIONAL-LAW.pdf',
  'assets/media/2025-06-05-06-33-04-IR-1.pdf',
  'assets/media/2025-06-05-06-33-07-IR-II.pdf',
  'assets/media/2025-06-05-06-33-10-ISLAMIC-HISTORY.pdf',
  'assets/media/2025-06-05-06-33-15-ISLAMIC-STUDIES.pdf',
  'assets/media/2025-06-05-06-33-20-JOURNALISM-&amp;-Mass-communication-.pdf',
  'assets/media/2025-06-05-06-33-25-LAW.pdf',
  'assets/media/2025-06-05-06-33-28-MERCANTILE-LAW.pdf',
  'assets/media/2025-06-05-06-33-33-MUSLIM-LAW-&amp;-JURIS.pdf',
  'assets/media/2025-06-05-06-33-40-PASHTO-.pdf',
  'assets/media/2025-06-05-06-33-44-PERSIAN.pdf',
  'assets/media/2025-06-05-06-33-48-PHILOSOPHY.pdf',
  'assets/media/2025-06-05-06-33-53-PHYSICS-1.pdf',
  'assets/media/2025-06-05-06-33-56-PHYSICS-2.pdf',
  'assets/media/2025-06-05-06-34-00-POL.SCIENCE-PAPER-1.pdf',
  'assets/media/2025-06-05-06-34-05-POL.SCIENCE-PAPER-2.pdf',
  'assets/media/2025-06-05-06-34-11-PSYCHOLOGY.pdf',
  'assets/media/2025-06-05-06-34-16-PUBLIC-ADMNISTRATION.pdf',
  'assets/media/2025-06-05-06-34-20-PUNJABI.pdf',
  'assets/media/2025-06-05-06-34-23-PURE-MATHS.pdf',
  'assets/media/2025-06-05-06-34-30-SINDHI.pdf',
  'assets/media/2025-06-05-06-34-34-SOCIOLOGY-.pdf',
  'assets/media/2025-06-05-06-34-39-STATISTICS.pdf',
  'assets/media/2025-06-05-06-34-43-TOWN-PLANNING.pdf',
  'assets/media/2025-06-05-06-34-49-URDU-LITERATURE.pdf',
  'assets/media/2025-06-05-06-34-56-ZOOLOGY.pdf',
]

const cssPastPapers2025 = cssPastPapers2025Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapers2024Paths = [
  'assets/media/2024-06-27-05-06-15-PURE-MATHS.pdf',
  'assets/media/2024-06-27-05-06-15-AGRICULTURE-&amp;-FORESTRY-.pdf',
  'assets/media/2024-06-27-05-06-15-ARABIC.pdf',
  'assets/media/2024-06-27-05-06-15-BALOCHI.pdf',
  'assets/media/2024-06-27-05-06-15-CRIMINOLOGY.pdf',
  'assets/media/2024-06-27-05-06-15-ECONOMICS-PAPER-2.pdf',
  'assets/media/2024-06-27-05-06-15-ECONOMICS-PAPER-1.pdf',
  'assets/media/2024-06-27-05-06-15-CONSTITUTIONAL-LAW.pdf',
  'assets/media/2024-06-27-05-06-15-COMPUTER-SCIENCE-PAPER-1.pdf',
  'assets/media/2024-06-27-05-06-15-COMPUTER-SCIENCE-PAPER-2.pdf',
  'assets/media/2024-06-27-05-06-15-ENGLISH-LITERATURE.pdf',
  'assets/media/2024-06-27-05-06-15-ENVIRONMENTAL-SC..pdf',
  'assets/media/2024-06-27-05-06-15-ESSAY.pdf',
  'assets/media/2024-06-27-05-06-15-GENDER-STUDIES.pdf',
  'assets/media/2024-06-27-05-06-15-EUROPEAN-HISTORY.pdf',
  'assets/media/2024-06-27-05-06-15-ENGLISH-(P&amp;C).pdf',
  'assets/media/2024-06-27-05-06-15-History-of-USA.pdf',
  'assets/media/2024-06-27-05-06-15-GOVERNANCE-&amp;-P.P..pdf',
  'assets/media/2024-06-27-05-06-15-GK-I.pdf',
  'assets/media/2024-06-27-05-06-15-GK2--(CA)-.pdf',
  'assets/media/2024-06-27-05-06-15-GK3-PAK-AFFAIRS-.pdf',
  'assets/media/2024-06-27-05-06-15-GEOGRAPHY.pdf',
  'assets/media/2024-06-27-05-06-15-INTERNATIONAL-LAW.pdf',
  'assets/media/2024-06-27-05-06-15-HISTORY-PAK-&amp;-INDIA.pdf',
  'assets/media/2024-06-27-05-06-15-IR-II.pdf',
  'assets/media/2024-06-27-05-06-15-ISLAMIC-HISTORY.pdf',
  'assets/media/2024-06-27-05-06-15-LAW.pdf',
  'assets/media/2024-06-27-05-06-15-JOURNALISM-&amp;-Mass-communication-.pdf',
  'assets/media/2024-06-27-05-06-15-ISLAMIC-STUDIES.pdf',
  'assets/media/2024-06-27-05-06-15-MUSLIM-LAW-&amp;-JURIS.pdf',
  'assets/media/2024-06-27-05-06-15-PERSIAN.pdf',
  'assets/media/2024-06-27-05-06-15-PHILOSOPHY.pdf',
  'assets/media/2024-06-27-05-06-15-PASHTO-.pdf',
  'assets/media/2024-06-27-05-06-15-PSYCHOLOGY.pdf',
  'assets/media/2024-06-27-05-06-15-POL.SCIENCE-PAPER-2.pdf',
]

const cssPastPapers2024 = cssPastPapers2024Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapers2023Paths = [
  'assets/media/2024-06-13-Computer-Science,-Paper-2.pdf',
  'assets/media/2024-06-13-Economics-Paper-1.pdf',
  'assets/media/2024-06-13-English-(P&amp;C)-subjective.pdf',
  'assets/media/2024-06-13-Economics-2.pdf',
  'assets/media/2024-06-13-English-Literature.pdf',
  'assets/media/2024-06-13-Criminology.pdf',
  'assets/media/2024-06-13-Environmental-Science.pdf',
  'assets/media/2024-06-13-Essay.pdf',
  'assets/media/2024-06-13-European-History.pdf',
  'assets/media/2024-06-13-Gender-Studies.pdf',
  'assets/media/2024-06-13-Geology.pdf',
  'assets/media/2024-06-13-Geography.pdf',
  'assets/media/2024-06-13-GK3-(Pakistan-Affairs).pdf',
  'assets/media/2024-06-13-Governance-&amp;-P.Policies.pdf',
  'assets/media/2024-06-13-GK-I-(General-Science-and-Ability).pdf',
  'assets/media/2024-06-13-History-of-Pakistan-&amp;-India.pdf',
  'assets/media/2024-06-13-IR-II.pdf',
  'assets/media/2024-06-13-International-Law.pdf',
  'assets/media/2024-06-13-IR-1.pdf',
  'assets/media/2024-06-13-History-of-USA.pdf',
  'assets/media/2024-06-13-Islamic-History-and-Culture.pdf',
  'assets/media/2024-06-13-Islamic-Studies.pdf',
  'assets/media/2024-06-13-Law.pdf',
  'assets/media/2024-06-13-Journalism-and-Mass-Communication.pdf',
  'assets/media/2024-06-13-Persian.pdf',
  'assets/media/2024-06-13-Philosophy.pdf',
  'assets/media/2024-06-13-Muslim-Law-&amp;-Jurisprudence.pdf',
  'assets/media/2024-06-13-Physics-Paper-2.pdf',
  'assets/media/2024-06-13-Physics-Paper-1.pdf',
  'assets/media/2024-06-13-Mercantile-Law.pdf',
  'assets/media/2024-06-13-Pol-Science-Paper-1.pdf',
  'assets/media/2024-06-13-Psychology.pdf',
  'assets/media/2024-06-13-Punjabi-subjective.pdf',
  'assets/media/2024-06-13-Pol-Science-Paper-2.pdf',
  'assets/media/2024-06-13-Pure-Mathematics.pdf',
  'assets/media/2024-06-13-Public-Administration.pdf',
  'assets/media/2024-06-13-Town-Planning-and-Urban-Mgmt.pdf',
  'assets/media/2024-06-13-Pushto.pdf',
  'assets/media/2024-06-13-Sociology.pdf',
  'assets/media/2024-06-13-Sindhi.pdf',
  'assets/media/2024-06-13-Statistics.pdf',
  'assets/media/2024-06-13-Urdu-Literature.pdf',
  'assets/media/2024-06-13-Zoology.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-I.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-II.pdf',
  'assets/media/2024-06-13-Agriculture-&amp;-Forestry.pdf',
  'assets/media/2024-06-13-Applied-Mathematics.pdf',
  'assets/media/2024-06-13-Anthropology.pdf',
  'assets/media/2024-06-13-Arabic.pdf',
  'assets/media/2024-06-13-Balochi.pdf',
  'assets/media/2024-06-13-Botany.pdf',
  'assets/media/2024-06-13-British-History.pdf',
  'assets/media/2024-06-13-Chemistry,-Paper-I.pdf',
  'assets/media/2024-06-13-Chemistry-II.pdf',
  'assets/media/2024-06-13-Business-Administration.pdf',
  'assets/media/2024-06-13-Comparitive--Studies.-NM.pdf',
]

const cssPastPapers2023 = cssPastPapers2023Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapers2022Paths = [
  'assets/media/2024-06-13-Constitutional-Law-subjective.pdf',
  'assets/media/2024-06-13-European-History-subjective.pdf',
  'assets/media/2024-06-13-Gender-Studies-subjective.pdf',
  'assets/media/2024-06-13-GK3-PAK-AFFAIRS-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-GK-I--subjective.pdf',
  'assets/media/2024-06-13-History-of-Pakistan-&amp;-India-subjective.pdf',
  'assets/media/2024-06-13-International-Law--subjective.pdf',
  'assets/media/2024-06-13-HISTORY-OF-THE-USA-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-IR-1-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-IR-II-Subjective-.pdf',
  'assets/media/2024-06-13-ISLAMIC-HISTORY-AND-CULTURE-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-LAW-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-JOURNALISM-&amp;-MASS-COM-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Islamic-Studies-subjective.pdf',
  'assets/media/2024-06-13-PASHTO-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-MERCANTILE-LAW-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Muslim-Law-&amp;-Jurisprudence-subjective.pdf',
  'assets/media/2024-06-13-PHILOSOPHY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-PHYSICS-PAPER-1-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Persian-subjective.pdf',
  'assets/media/2024-06-13-POL.SCIENCE-PAPER-1.-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Physics-II-subjective.pdf',
  'assets/media/2024-06-13-POL.SCIENCE-PAPER-2.-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-PURE-MATHEMATICS-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Public-Administration-subjective.pdf',
  'assets/media/2024-06-13-Psychology-subjective.pdf',
  'assets/media/2024-06-13-SOCIOLOGY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Sindhi-subjective.pdf',
  'assets/media/2024-06-13-Statistics-subjective.pdf',
  'assets/media/2024-06-13-TOWN-PLANNING-&amp;-URBAN-MNGT-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Urdu-Literature-subjective.pdf',
  'assets/media/2024-06-13-Zoology-subjective.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-II--subjective.pdf',
  'assets/media/2024-06-13-Accountancy-&amp;-Auditing-I--subjective.pdf',
  'assets/media/2024-06-13-AGRICULTURE-&amp;-FORESTRY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-ANTHROPOLOGY-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-Balochi-subjective.pdf',
  'assets/media/2024-06-13-Botany-subjective.pdf',
  'assets/media/2024-06-13-BUSINESS-ADMINISTRATION-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-APPLIED-MATHEMATICS-SUBJECTIVE.pdf',
  'assets/media/2024-06-13-British-History-subjective.pdf',
  'assets/media/2024-06-13-Chemistry,-Paper-I-subjective.pdf',
  'assets/media/2024-06-13-Chemistry-II--subjective.pdf',
  'assets/media/2024-06-13-COMARATIVE-ST.-NM-SUBJECTIVE-(1).pdf',
  'assets/media/2024-06-13-Computer-Science,-Paper-2-subjective.pdf',
  'assets/media/2024-06-13-COMPUTER-SCIENCE-PAPER-1-SUBJECTIVE.pdf',
]

const cssPastPapers2022 = cssPastPapers2022Paths.map((path) => ({
  title: formatPastPaperTitle(path),
  url: `https://www.fpsc.gov.pk/${path.replace(/&amp;/gi, '&')}`,
}))

const cssPastPapersByYear = [
  {
    year: '2025',
    sourceUrl: 'https://www.fpsc.gov.pk/category/css-2025-descriptive-papers-1241569033-2025-06-05',
    papers: cssPastPapers2025,
  },
  {
    year: '2024',
    sourceUrl: 'https://www.fpsc.gov.pk/category/css-2023-descriptive-papers-516644049-2024-06-27',
    papers: cssPastPapers2024,
  },
  {
    year: '2023',
    sourceUrl: 'https://fpsc.gov.pk/category/css-2023-descriptive-papers-1663083777-2024-06-13',
    papers: cssPastPapers2023,
  },
  {
    year: '2022',
    sourceUrl: 'https://fpsc.gov.pk/category/css-2023-descriptive-papers-815643912-2024-06-13',
    papers: cssPastPapers2022,
  },
]

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DUMMY_TEST_PROFILE = {
  username: 'guardian.student',
  password: 'Study@123',
  fullName: 'Guardian Test Student',
}
const TESTING_SIGNIN_DRAFT_KEY = 'ga-testing-signin-draft'
const TESTING_PLANNER_FORM_KEY = 'ga-testing-planner-form'

const DEFAULT_PLANNER_FORM = {
  examDate: '',
  studyHours: '6',
  productiveHours: ['07:00-08:00', '08:00-09:00', '09:00-10:00'],
  stage: 'beginner',
  cssAttempt: 'first',
  difficulty: 'difficult',
  learningPreference: 'lectures-first',
}

const PRODUCTIVE_HOUR_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const startHour = index + 5
  const endHour = startHour + 1
  const id = `${`${startHour}`.padStart(2, '0')}:00-${`${endHour}`.padStart(2, '0')}:00`
  return {
    id,
    startHour,
    label: `${`${startHour}`.padStart(2, '0')}:00 - ${`${endHour}`.padStart(2, '0')}:00`,
  }
})
const PLANNER_CORE_COMPULSORY_SUBJECTS = compulsorySubjects.slice(0, 5)
const COMPULSORY_ELECTIVE_OPTIONS = [
  'Islamiat (100 Marks)',
  'Comparative Study of Major Religions (For Non Muslims)',
]
const WATERMARK_IMAGE_URL = new URL('../data/watermark.png', import.meta.url).href
const LOCAL_OUTLINE_IMAGE_URLS = {
  punjabi: [new URL('../data/punjabi-literature-outline-merged.png', import.meta.url).href],
  sindhi: [new URL('../data/sindhi-literature-outline-merged.png', import.meta.url).href],
  balochi: [new URL('../data/balochi-literature-outline-merged.png', import.meta.url).href],
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

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatClock = (totalMinutes) => {
  const safeMinutes = ((totalMinutes % 1440) + 1440) % 1440
  const hour24 = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60
  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${`${minute}`.padStart(2, '0')} ${suffix}`
}

const formatStopwatch = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return `${`${hours}`.padStart(2, '0')}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`
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

function Header({ theme, onToggleTheme, authUser, onLogout }) {
  const [animateToggle, setAnimateToggle] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isResourceMenuOpen, setIsResourceMenuOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Global Affairs', to: '/global-affairs' },
    {
      label: 'CSS Resource Library',
      children: [
        { label: 'CSS Rules', to: '/css-rules' },
        { label: 'CSS Syllabus', to: '/css-syllabus' },
        { label: 'CSS Past Papers', to: '/css-past-papers' },
        { label: 'CSS Study Material', to: '/css-study-material' },
      ],
    },
    ...(authUser ? [{ label: 'Guardian Study Planner', to: '/guardian-study-planner' }] : []),
    { label: 'Blogs', to: '/blog' },
  ]

  const handleThemeToggle = () => {
    setAnimateToggle(true)
    onToggleTheme()
    window.setTimeout(() => setAnimateToggle(false), 800)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setIsResourceMenuOpen(false)
  }
  const handleResourceMenuToggle = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsResourceMenuOpen((current) => !current)
  }

  const isResourceRoute = (pathname) =>
    pathname === '/css-rules' ||
    pathname === '/css-syllabus' ||
    pathname === '/css-past-papers' ||
    pathname === '/css-study-material'

  const renderNavLabel = (label) => label

  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <Link className="brand" to="/" aria-label="Guardian Angel home">
          <img src={logo} alt="Guardian Angel logo" />
          <div>
            <strong>Guardian Angel</strong>
            <span>Knowledge Is Priceless</span>
          </div>
        </Link>

        <button
          className={`nav-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
          <div className="nav-links">
            {navItems.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className={`nav-item-group ${isResourceRoute(location.pathname) ? 'nav-active' : ''} ${
                    isResourceMenuOpen ? 'open' : ''
                  }`}
                  onMouseEnter={() => {
                    if (!isMobileMenuOpen) setIsResourceMenuOpen(true)
                  }}
                  onMouseLeave={() => {
                    if (!isMobileMenuOpen) setIsResourceMenuOpen(false)
                  }}
                >
                  <button
                    type="button"
                    className="nav-group-trigger"
                    aria-expanded={isResourceMenuOpen}
                    aria-haspopup="true"
                    onClick={handleResourceMenuToggle}
                  >
                    {item.label}
                  </button>
                  <div className="nav-submenu">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.label}
                        to={child.to}
                        className={({ isActive }) => `nav-sub-link ${isActive ? 'nav-active' : ''}`}
                        onClick={closeMobileMenu}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : item.to.startsWith('/#') ? (
                <a key={item.label} href={item.to} onClick={closeMobileMenu}>
                {renderNavLabel(item.label)}
                </a>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-active' : '')}
                  onClick={closeMobileMenu}
                >
                {renderNavLabel(item.label)}
                </NavLink>
              ),
            )}
          </div>

          <div className="nav-actions">
            <a className="btn btn-nav" href="/#student-message" onClick={closeMobileMenu}>
              Start Preparation
            </a>
            {authUser ? (
              <button
                className="btn btn-secondary nav-auth-btn"
                type="button"
                onClick={() => {
                  closeMobileMenu()
                  onLogout()
                }}
              >
                Logout
              </button>
            ) : (
              <Link className="btn btn-secondary nav-auth-btn" to="/signin" onClick={closeMobileMenu}>
                Sign In
              </Link>
            )}
            <button
              className={`btn btn-secondary theme-toggle ${animateToggle ? 'animate' : ''}`}
              type="button"
              onClick={handleThemeToggle}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span aria-hidden="true" className="theme-icon">
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" role="img">
                    <circle cx="12" cy="12" r="4.2" />
                    <path d="M12 2.2v3M12 18.8v3M2.2 12h3M18.8 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M19.2 4.8l-2.1 2.1M6.9 17.1l-2.1 2.1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M21 14.8A9.2 9.2 0 1 1 9.2 3a7.5 7.5 0 1 0 11.8 11.8Z" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

function HomePage() {
  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal-on-scroll')
    if (revealItems.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            currentObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <HomeFaqStructuredData />
      <section className="intro" id="home">
        <div className="intro-video" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="metadata" poster={logo}>
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="intro-overlay" aria-hidden="true" />

        <section className="hero container">
          <div className="hero-copy reveal-on-scroll">
            
            <h1>Empowering Pakistan’s Future Leaders</h1>
            <p className="subtext">
              Guardian Angel is an independent platform dedicated to helping CSS Jawans across
              Pakistan access premium quality education completely free of cost.
            </p>
            
          </div>
          <div className="hero-constitutional-note reveal-on-scroll">
            <p>
              The Constitution of Pakistan <span className="guardian-highlight-word">(Article 25-A)</span>{' '}
              guarantees free and compulsory education for
              every citizen.
            </p>
            <p>
              <span className="guardian-highlight-word">Guardian Angel</span> is committed to upholding
              this right by making quality knowledge accessible to all.
            </p>
          </div>
        </section>
      </section>

      <main>
        <section className="mission container glass-panel reveal-on-scroll" id="mission">
          <div className="section-title">
            <h2>Knowledge is Priceless</h2>
          </div>
          <p className="mission-body">
            Talent should never be limited by money. In Pakistan, thousands of brilliant students
            cannot afford expensive academies. Guardian Angel exists to bridge that gap. Guardian Angel&apos;s mission is to democratize CSS education in Pakistan by providing
            world class preparation resources free of cost, ensuring that every talented student,
            regardless of financial background, has the opportunity to compete.
          </p>
          
        </section>

        <section className="highlights container" id="why-guardian-angel">
          {pillars.map((item, index) => (
            <article
              className="card reveal-on-scroll"
              key={item.title}
              style={{ '--reveal-delay': `${index * 100}ms` }}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="message container glass-panel reveal-on-scroll" id="student-message">
          <div className="message-content">
            <div className="section-title">
              <h2>CSS is not just an examination.</h2>
            </div>
            <p className="message-body">
              It is a gateway to leadership, service, and national impact. Guardian Angel stands
              with every hardworking aspirant who dreams of wearing the badge of Pakistan&apos;s
              civil service.
            </p>
          </div>
          <div className="message-actions">
            <Link className="btn btn-primary home-action-btn" to="/css-rules">
              Browse CSS Rules
            </Link>
      </div>
        </section>

        <section className="cta container reveal-on-scroll" id="join">
          <div>
            
            <h2>If you have the determination, Guardian Angel will provide the guidance</h2>
            <p className="cta-subtext">
              High quality study material built for Jawans who are ready to work hard and
              serve the nation.
        </p>
      </div>
          <Link className="btn btn-primary home-action-btn" to="/css-syllabus">
            Browse CSS Syllabus
          </Link>
        </section>

        <section className="home-faq container reveal-on-scroll" id="css-faq">
          <div className="section-title">
            <p>CSS Frequently Asked Questions</p>
            <h2>Smart Preparation, Not Notes Culture</h2>
          </div>
          <HomeFaqAccordion />
        </section>
      </main>
    </>
  )
}

function HomeFaqAccordion() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0)

  return (
    <div className="home-faq-accordion">
      {homeFaqs.map((faq, index) => {
        const isOpen = openFaqIndex === index
        return (
          <article key={faq.question} className={`home-faq-item ${isOpen ? 'open' : ''}`}>
            <button
              className="home-faq-trigger"
              type="button"
              onClick={() => setOpenFaqIndex((current) => (current === index ? -1 : index))}
              aria-expanded={isOpen}
            >
              <h3>{faq.question}</h3>
              <span className="home-faq-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            <div className={`home-faq-body ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
              <p>{faq.answer}</p>
              <div className="home-faq-links">
                {getFaqHelpfulLinks(faq.question).map((item) =>
                  item.url.startsWith('/') ? (
                    <Link key={`${faq.question}-${item.label}`} to={item.url} className="home-faq-link-chip">
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={`${faq.question}-${item.label}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="home-faq-link-chip"
                    >
                      {item.label}
                    </a>
                  ),
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

function HomeFaqStructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
}

function CssSyllabusPage() {
  return (
    <main className="page-main">
      <section className="syllabus container" id="css-syllabus">
        <div className="section-title">
          <p>CSS Syllabus</p>
          <h2>Compulsory and Optional Subjects</h2>
        </div>

        <article className="syllabus-block">
          <h3>Compulsory Subjects Syllabus</h3>
          <ul className="syllabus-list syllabus-list-links">
            {compulsorySubjects.map((subject) => (
              <li key={subject}>
                <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
              </li>
            ))}
          </ul>
        </article>

        <div className="optional-groups">
          {optionalGroups.map((item) => (
            <article className="group-card" key={item.group}>
              <h3>{item.group}</h3>
              <p className="group-rule">{item.rules}</p>
              <ul className="syllabus-list syllabus-list-links">
                {item.subjects.map((subject) => (
                  <li key={subject}>
                    <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

      </section>
    </main>
  )
}

function CssRulesPage() {
  const [openRuleIndex, setOpenRuleIndex] = useState(0)
  const handleRuleToggle = (index, event) => {
    const headerButton = event.currentTarget
    const topBefore = headerButton.getBoundingClientRect().top

    setOpenRuleIndex((current) => (current === index ? -1 : index))

    window.requestAnimationFrame(() => {
      const topAfter = headerButton.getBoundingClientRect().top
      const delta = topAfter - topBefore
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'auto' })
    })
  }

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Rules</p>
          <h2>Introduction as per CSS Rules 2019</h2>
        </div>

        <p className="rules-source">
          Source:{' '}
          <a
            href="https://fpsc.gov.pk/"
            target="_blank"
            rel="noreferrer"
          >
            Federal Public Service Commission (FPSC)
          </a>
        </p>

        <div className="rules-accordion">
          {cssRulesSections.map((rule, index) => {
            const isOpen = openRuleIndex === index
            return (
              <article className={`rule-item ${isOpen ? 'open' : ''}`} key={rule.title}>
                <button
                  className="rule-header"
                  type="button"
                  onClick={(event) => handleRuleToggle(index, event)}
                  aria-expanded={isOpen}
                >
                  <span>{rule.title}</span>
                  <span className="rule-icon">{isOpen ? '−' : '+'}</span>
                </button>
                <div className={`rule-body ${isOpen ? 'open' : ''}`}>
                  <div className="rule-content">
                    {rule.content.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function CssPastPapersPage() {
  const [query, setQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(() => cssPastPapersByYear[0]?.year || '')
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false)
  const normalizedQuery = query.trim().toLowerCase()
  const paperCount = cssPastPapersByYear.reduce((total, item) => total + item.papers.length, 0)
  const selectedYearData = cssPastPapersByYear.find((item) => item.year === selectedYear) || null
  const visiblePapers = selectedYearData
    ? normalizedQuery
      ? selectedYearData.papers.filter((paper) => paper.title.toLowerCase().includes(normalizedQuery))
      : selectedYearData.papers
    : []

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Past Papers</p>
          <h2>CSS 2025 Descriptive Papers</h2>
        </div>

        <p className="rules-source">
          Source format:{' '}
          <a
            href="https://fpsc.gov.pk/"
            target="_blank"
            rel="noreferrer"
          >
            Federal Public Service Commission (FPSC)
          </a>
        </p>

        <div className="papers-toolbar">
          <div className={`year-select ${isYearMenuOpen ? 'open' : ''}`}>
            <button
              className="year-select-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isYearMenuOpen}
              onClick={() => setIsYearMenuOpen((current) => !current)}
            >
              <span>{selectedYear || 'Select year'}</span>
              <span className="year-select-icon">⌄</span>
            </button>
            {isYearMenuOpen ? (
              <div className="year-select-menu" role="listbox" aria-label="Select CSS past papers year">
                {cssPastPapersByYear.map((item) => (
                  <button
                    key={item.year}
                    type="button"
                    role="option"
                    aria-selected={selectedYear === item.year}
                    className={selectedYear === item.year ? 'selected' : ''}
                    onClick={() => {
                      setSelectedYear(item.year)
                      setQuery('')
                      setIsYearMenuOpen(false)
                    }}
                  >
                    {item.year}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <input
            type="search"
            placeholder="Search paper name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search CSS past papers"
            disabled={!selectedYearData}
          />
          <p>{selectedYearData ? `${visiblePapers.length} papers` : `${paperCount} papers total`}</p>
        </div>

        {!selectedYearData ? (
          <article className="papers-empty">
            <h3>Select a year to view papers</h3>
            <p>Choose a year from the dropdown above. Papers for that year will appear instantly.</p>
          </article>
        ) : (
          <>
            <p className="papers-year-source">
              Source:{' '}
              <a href={selectedYearData.sourceUrl} target="_blank" rel="noreferrer">
                FPSC CSS {selectedYearData.year} Descriptive Papers
              </a>
            </p>

            <div className="papers-grid">
              {visiblePapers.map((paper) => (
                <article className="paper-item" key={paper.url}>
                  <h3>{paper.title}</h3>
                  <a className="btn btn-primary" href={paper.url} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function CssStudyMaterialPage() {
  const [query, setQuery] = useState('')
  const [downloadingSubject, setDownloadingSubject] = useState('')
  const [openSubject, setOpenSubject] = useState('')
  const totalSlides = cssStudyMaterials.reduce((count, group) => count + group.slides.length, 0)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredTotal = cssStudyMaterials.reduce(
    (count, group) =>
      count +
      group.slides.filter((slide) => slide.title.toLowerCase().includes(normalizedQuery)).length,
    0,
  )

  const getPublicSlideUrl = (slide) => new URL(slide.url, window.location.origin).toString()

  const triggerSlideDownload = (slide) => {
    const publicSlideUrl = getPublicSlideUrl(slide)
    const anchor = document.createElement('a')
    anchor.href = publicSlideUrl
    anchor.download = slide.fileName
    anchor.rel = 'noopener'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  const handleDownloadAll = async (group) => {
    const visibleSlides = group.slides.filter((slide) =>
      slide.title.toLowerCase().includes(normalizedQuery),
    )
    if (visibleSlides.length === 0) return

    setDownloadingSubject(group.subject)
    for (const slide of visibleSlides) {
      triggerSlideDownload(slide)
      await new Promise((resolve) => window.setTimeout(resolve, 170))
    }
    window.setTimeout(() => setDownloadingSubject(''), 250)
  }

  const openSlideViewer = (slide) => {
    const publicSlideUrl = getPublicSlideUrl(slide)
    const onlineViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicSlideUrl)}`
    window.open(onlineViewerUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Study Material</p>
          <h2>Criminology, Gender Studies, and IR Lecture Slides</h2>
        </div>

        <p className="rules-source">
          Access organized lecture slides with quick view and one click download.
          <strong>{` ${totalSlides} slides available in total.`}</strong>
        </p>

        <div className="study-toolbar">
          <input
            type="search"
            placeholder="Search by slide title (e.g. Lecture 3, International Relations, Criminology)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search CSS study material slides"
          />
          <p>
            {normalizedQuery ? `${filteredTotal} matching slides` : `${totalSlides} total slides`}
          </p>
        </div>

        <div className="study-groups">
          {cssStudyMaterials.map((group) => {
            const visibleSlides = group.slides.filter((slide) =>
              slide.title.toLowerCase().includes(normalizedQuery),
            )
            const isOpen = openSubject === group.subject

            return (
              <article className={`study-group-card ${isOpen ? 'open' : ''}`} key={group.subject}>
                <button
                  className="study-group-trigger"
                  type="button"
                  onClick={() => setOpenSubject((current) => (current === group.subject ? '' : group.subject))}
                  aria-expanded={isOpen}
                >
                  <span>{group.subject}</span>
                  <span className="rule-icon">{isOpen ? '−' : '+'}</span>
                </button>

                <div className={`study-group-body ${isOpen ? 'open' : ''}`}>
                  <header className="study-group-head">
                    <div className="study-group-topbar">
                      <div>
                        <p>{group.description}</p>
                      </div>
                      <div className="study-group-meta">
                        <span>{`${visibleSlides.length}/${group.slides.length} shown`}</span>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => handleDownloadAll(group)}
                          disabled={visibleSlides.length === 0 || downloadingSubject === group.subject}
                        >
                          {downloadingSubject === group.subject
                            ? 'Downloading...'
                            : `Download All (${visibleSlides.length})`}
                        </button>
                      </div>
                    </div>
                  </header>

                  {visibleSlides.length === 0 ? (
                    <article className="papers-empty study-empty">
                      <h3>No matching slides in {group.subject}</h3>
                      <p>Try a different keyword to view slides for this section.</p>
                    </article>
                  ) : (
                    <div className="study-slides-grid">
                      {visibleSlides.map((slide) => (
                        <article className="study-slide-item" key={slide.url}>
                          <div>
                            <div className="study-slide-top">
                              <p className="study-slide-tag">Lecture Slide</p>
                              <span className="study-lecture-badge">
                                {slide.lectureNumber ? `Lecture ${slide.lectureNumber}` : 'Lecture'}
                              </span>
                            </div>
                            <h4>{slide.title}</h4>
                          </div>
                          <div className="study-slide-actions">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => openSlideViewer(slide)}
                            >
                              View Slide
                            </button>
                            <a
                              className="btn btn-primary"
                              href={getPublicSlideUrl(slide)}
                              download={slide.fileName}
                            >
                              Download
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function BlogPage() {
  const { blogSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedBlog, setSelectedBlog] = useState(null)
  const featuredPosts = blogPosts
    .filter((post) => FEATURED_BLOG_SLUGS.includes(post.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const visiblePosts = blogPosts.filter((post) =>
    activeCategory === 'All' ? true : getBlogCategories(post).includes(activeCategory),
  )
  const regularPosts = visiblePosts.filter((post) => !FEATURED_BLOG_SLUGS.includes(post.slug))
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Guardian Angel CSS Blog',
    url: `${SITE_URL}/blog`,
    blogPost: blogPosts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: post.date,
      dateModified: post.date,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Guardian Angel',
      },
      description: post.excerpt,
      timeRequired: `PT${Math.max(1, Math.ceil(getBlogWordCount(post) / 200))}M`,
      mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    })),
  }
  const openBlogModal = (post) => {
    setSelectedBlog(post)
    const targetPath = `/blog/${post.slug}`
    if (location.pathname !== targetPath) {
      navigate(targetPath)
    }
  }
  const closeBlogModal = () => {
    setSelectedBlog(null)
    if (location.pathname !== '/blog') {
      navigate('/blog')
    }
  }

  useEffect(() => {
    if (!blogSlug) {
      setSelectedBlog(null)
      return
    }
    const matched = blogPosts.find((post) => post.slug === blogSlug) || null
    setSelectedBlog(matched)
  }, [blogSlug])

  useEffect(() => {
    if (!selectedBlog) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event) => {
      if (event.key === 'Escape') closeBlogModal()
    }
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [selectedBlog])

  return (
    <main className="page-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="container blog-page" id="css-blog">
        <div className="section-title">
          <p>Guardian Angel Blog</p>
          <h2>CSS Strategy, Writing, and Current Affairs Insights</h2>
        </div>
        <p className="rules-source">
          Concise, practical mini blogs designed for  CSS Jawans.
        </p>

        <div className="blog-category-chips" role="tablist" aria-label="Blog categories">
          {BLOG_CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={`blog-category-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="blog-featured-section">
          <div className="blog-featured-head">
            <h3>Featured</h3>
          </div>
          <div className="blog-grid blog-featured-grid">
            {featuredPosts.map((post) => (
              <article
                className="blog-card blog-card-featured"
                key={`featured-${post.slug}`}
                id={`featured-${post.slug}`}
                role="button"
                tabIndex={0}
                onClick={() => openBlogModal(post)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openBlogModal(post)
                  }
                }}
              >
                <p className="blog-featured-badge">Featured</p>
                <h3>{post.title}</h3>
                <p className="blog-meta">
                  By <strong>{post.author}</strong> · {formatNewsTimestamp(post.date)} · {getBlogReadTime(post)}
                </p>
                <p className="blog-excerpt">{post.excerpt}</p>
                <div className="blog-tag-row">
                  {getBlogCategories(post).map((tag) => (
                    <span key={`${post.slug}-featured-${tag}`} className="blog-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="blog-featured-separator" aria-hidden="true" />

        <div className="blog-grid">
          {regularPosts.map((post) => (
            <article
              className="blog-card"
              key={post.slug}
              id={post.slug}
              role="button"
              tabIndex={0}
              onClick={() => openBlogModal(post)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openBlogModal(post)
                }
              }}
            >
              <h3>{post.title}</h3>
              <p className="blog-meta">
                By <strong>{post.author}</strong> · {formatNewsTimestamp(post.date)} · {getBlogReadTime(post)}
              </p>
              <p className="blog-excerpt">{post.excerpt}</p>
              <div className="blog-tag-row">
                {getBlogCategories(post).map((tag) => (
                  <span key={`${post.slug}-${tag}`} className="blog-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="blog-links">
                <div className="blog-link-row">
                  {post.internalLinks.map((item) => (
                    <Link
                      key={`${post.slug}-${item.to}`}
                      to={item.to}
                      className="home-faq-link-chip"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="blog-links">
                <div className="blog-link-row">
                  {post.externalLinks.map((item) => (
                    <a
                      key={`${post.slug}-${item.url}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="home-faq-link-chip"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
        {selectedBlog ? (
          <div className="blog-modal-overlay" onClick={closeBlogModal} role="dialog" aria-modal="true">
            <article className="blog-modal-card" onClick={(event) => event.stopPropagation()}>
              <button type="button" className="blog-modal-close" onClick={closeBlogModal} aria-label="Close blog">
                ×
              </button>
              <h3>{selectedBlog.title}</h3>
              <p className="blog-meta">
                By <strong>{selectedBlog.author}</strong> · {formatNewsTimestamp(selectedBlog.date)} ·{' '}
                {getBlogReadTime(selectedBlog)}
              </p>
              <p className="blog-modal-content">{selectedBlog.excerpt}</p>
              <div className="blog-links">
                <div className="blog-link-row">
                  {selectedBlog.internalLinks.map((item) => (
                    <Link
                      key={`${selectedBlog.slug}-modal-${item.to}`}
                      to={item.to}
                      className="home-faq-link-chip"
                      onClick={closeBlogModal}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="blog-links">
                <div className="blog-link-row">
                  {selectedBlog.externalLinks.map((item) => (
                    <a
                      key={`${selectedBlog.slug}-modal-${item.url}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="home-faq-link-chip"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </main>
  )
}

function SubjectDetailPage() {
  const { subjectSlug } = useParams()
  const slugAliases = {
    'english-precis-composition': 'english',
    gsa: 'general-science-ability',
    'islamic-studies': 'islamiat',
    'comparative-religions': 'comparative-study-of-major-religions',
  }

  const resolvedSlug = slugAliases[subjectSlug] ?? subjectSlug
  const subject = detailedSubjectPages.find(
    (item) => item.slug === resolvedSlug || item.sourceSlug === resolvedSlug,
  )

  if (!subject) {
    return (
      <main className="page-main">
        <section className="container subject-page">
          <h1>Subject not found</h1>
          <p>Please return to the syllabus page and choose a listed subject.</p>
          <Link className="btn btn-primary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-main">
      <section className="container subject-page">
        <p className="kicker">Detailed CSS Subject Page</p>
        <h1>{subject.title}</h1>
        <div className="subject-meta-grid">
          <article className="subject-meta-card">
            <h3>Marks</h3>
            <p>{subject.marks}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Category</h3>
            <p>{subject.category}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Group</h3>
            <p>{subject.group}</p>
          </article>
        </div>

        <article className="subject-outline">
          <h2>Course Outline</h2>
          {subject.outlineImages?.length > 0 ? (
            <div className="outline-images">
              {subject.outlineImages.map((imagePath) => (
                <img key={imagePath} src={imagePath} alt={`${subject.title} course outline`} />
              ))}
            </div>
          ) : subject.outlineSections?.length > 0 ? (
            <div className="outline-sections">
              {subject.outlineSections.map((section) => (
                <section className="outline-section" key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.points?.length > 0 ? (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : subject.outline.length > 0 ? (
            <ul>
              {subject.outline.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p>Detailed outline is not available yet for this subject.</p>
          )}
        </article>

        <div className="subject-actions">
          <Link className="btn btn-secondary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </div>
      </section>
    </main>
  )
}

function SignInPage({ onSignIn, authUser }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(TESTING_SIGNIN_DRAFT_KEY)
      const draft = raw ? JSON.parse(raw) : null
      return {
        username: draft?.username || '',
        password: draft?.password || '',
      }
    } catch {
      return { username: '', password: '' }
    }
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (authUser) {
      const nextPath = location.state?.from || '/guardian-study-planner'
      navigate(nextPath, { replace: true })
    }
  }, [authUser, navigate, location.state])

  useEffect(() => {
    try {
      localStorage.setItem(TESTING_SIGNIN_DRAFT_KEY, JSON.stringify(form))
    } catch {
      // Ignore storage failures and continue with in-memory interactions.
    }
  }, [form])

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const isValidUser =
      form.username.trim() === DUMMY_TEST_PROFILE.username &&
      form.password === DUMMY_TEST_PROFILE.password

    if (!isValidUser) {
      setError('Invalid credentials. Use the testing credentials shown below.')
      return
    }

    onSignIn({
      username: DUMMY_TEST_PROFILE.username,
      fullName: DUMMY_TEST_PROFILE.fullName,
    })

    const nextPath = location.state?.from || '/guardian-study-planner'
    navigate(nextPath, { replace: true })
  }

  return (
    <main className="page-main">
      <section className="container auth-page">
        <div className="section-title">
          <p>Sign In Required</p>
          <h2>Access Guardian Study Planner</h2>
        </div>

        <article className="planner-card auth-card">
          <h3>Testing Credentials</h3>
          <p className="auth-note">
            Username: <strong>{DUMMY_TEST_PROFILE.username}</strong> | Password:{' '}
            <strong>{DUMMY_TEST_PROFILE.password}</strong>
          </p>

          <form className="planner-form" onSubmit={handleSubmit}>
            <label>
              Username
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({ ...current, username: event.target.value }))
                }
                required
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>

            <button className="btn btn-primary planner-submit" type="submit">
              Sign In
            </button>
            {error ? <p className="planner-error">{error}</p> : null}
          </form>
        </article>
      </section>
    </main>
  )
}

function GuardianStudyPlannerPage({ authUser }) {
  const profileStorageKey = `ga-profile-${authUser.username}`
  const [activePlannerTab, setActivePlannerTab] = useState('subjects')
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(profileStorageKey)
      const profile = raw ? JSON.parse(raw) : null
      const fallbackRaw = localStorage.getItem(TESTING_PLANNER_FORM_KEY)
      const fallbackForm = fallbackRaw ? JSON.parse(fallbackRaw) : null
      return {
        ...DEFAULT_PLANNER_FORM,
        ...(fallbackForm || {}),
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
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')
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
      if (COMPULSORY_ELECTIVE_OPTIONS.includes(stored)) return stored
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
  const [outlinePdfFileName, setOutlinePdfFileName] = useState('Guardian_Angel_CSS_Course_Outline.pdf')
  const [isGeneratingOutlinePdf, setIsGeneratingOutlinePdf] = useState(false)
  const [weeklyReportPdfUrl, setWeeklyReportPdfUrl] = useState('')
  const [weeklyReportPdfFileName, setWeeklyReportPdfFileName] = useState(
    'Guardian_Angel_Report.pdf',
  )
  const [isGeneratingWeeklyReportPdf, setIsGeneratingWeeklyReportPdf] = useState(false)
  const [performancePdfUrl, setPerformancePdfUrl] = useState('')
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
    try {
      const profilePayload = {
        username: authUser.username,
        fullName: authUser.fullName,
        plannerForm: form,
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
      localStorage.setItem(profileStorageKey, JSON.stringify(profilePayload))
      localStorage.setItem(TESTING_PLANNER_FORM_KEY, JSON.stringify(form))
    } catch {
      // Ignore storage failures and continue with in-memory interactions.
    }
  }, [
    authUser,
    profileStorageKey,
    form,
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
      const nextPdfUrl = URL.createObjectURL(blob)
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
      formula: {
        expression:
          'effectiveHours = baseHours x urgencyFactor x attemptFactor x difficultyFactor x productivityFactor',
        values: {
          baseHours: studyHours,
          urgencyFactor,
          attemptFactor,
          difficultyFactor,
          productivityFactor,
        },
      },
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
      const drawDmcStyleTable = (title, rows, sectionType) => {
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
      const nextPdfUrl = URL.createObjectURL(blob)
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
        `Performance formula: finalScore = baseScore x socialPenaltyFactor | baseScore: ${basePerformanceScore}, socialPenaltyFactor: ${socialPerformancePenaltyFactor.toFixed(2)}, finalScore: ${performanceScore}`,
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
      const nextPdfUrl = URL.createObjectURL(blob)
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
  const handleViewPerformancePdf = () => {
    if (!performancePdfUrl) return
    setError('')
    const opened = window.open(performancePdfUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      setError('Popup was blocked. Please allow popups to open the PDF in a new tab.')
    }
  }
  const handleDownloadPerformancePdf = () => {
    if (!performancePdfUrl) return
    setError('')
    const opened = window.open(performancePdfUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      setError('Popup was blocked. Please allow popups to open the PDF in a new tab.')
    }
  }
  const postWeeklyPdfToNativeApp = async (action) => {
    if (!weeklyReportPdfUrl) return false
    if (
      typeof window === 'undefined' ||
      !window.ReactNativeWebView ||
      typeof window.ReactNativeWebView.postMessage !== 'function'
    ) {
      return false
    }
    try {
      const response = await fetch(weeklyReportPdfUrl)
      if (!response.ok) return false
      const blob = await response.blob()
      const dataUrl = await fileToDataUrl(blob)
      const payloadString = String(dataUrl || '')
      const fileName = weeklyReportPdfFileName || 'Guardian_Angel_Report.pdf'
      const chunkSize = 24000
      const totalChunks = Math.ceil(payloadString.length / chunkSize)
      if (totalChunks <= 1) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'ga_pdf_blob',
            action,
            fileName,
            dataUrl: payloadString,
          }),
        )
      } else {
        const streamId = `ga_pdf_ui_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: 'ga_pdf_chunk_start',
            id: streamId,
            action,
            fileName,
            total: totalChunks,
          }),
        )
        for (let index = 0; index < totalChunks; index += 1) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({
              type: 'ga_pdf_chunk',
              id: streamId,
              index,
              total: totalChunks,
              chunk: payloadString.slice(index * chunkSize, (index + 1) * chunkSize),
            }),
          )
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ga_pdf_chunk_end', id: streamId }))
      }
      return true
    } catch {
      return false
    }
  }
  const handleViewWeeklyReportPdf = async () => {
    if (!weeklyReportPdfUrl) return
    const handledInApp = await postWeeklyPdfToNativeApp('view')
    if (handledInApp) return
    const opened = window.open(weeklyReportPdfUrl, '_blank', 'noopener,noreferrer')
    if (!opened) {
      window.location.href = weeklyReportPdfUrl
    }
  }
  const handleDownloadWeeklyReportPdf = async () => {
    if (!weeklyReportPdfUrl) return
    const handledInApp = await postWeeklyPdfToNativeApp('download')
    if (handledInApp) return
    const link = document.createElement('a')
    link.href = weeklyReportPdfUrl
    link.download = weeklyReportPdfFileName || 'Guardian_Angel_Report.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
      const dayKey = formatDayKey(completedAt)
      setTimerSessions((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          completedAt: completedAt.toISOString(),
          dayKey,
          durationSeconds: finalElapsedSeconds,
        },
      ])
      setCompletedDays((current) => ({ ...current, [dayKey]: true }))
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
                        <a className="btn btn-secondary" href={outlinePdfUrl} target="_blank" rel="noreferrer">
                          View PDF
                        </a>
                        <a className="btn btn-secondary" href={outlinePdfUrl} download={outlinePdfFileName}>
                          Download PDF
                        </a>
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
                      <div className="productive-hours-grid">
                        {PRODUCTIVE_HOUR_OPTIONS.map((slot) => (
                          <label key={slot.id} className="productive-hour-option">
                            <input
                              type="checkbox"
                              checked={form.productiveHours.includes(slot.id)}
                              onChange={() => handleProductiveHourToggle(slot.id)}
                            />
                            <span>{slot.label}</span>
                          </label>
                        ))}
                      </div>
                    </label>

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

                    <div className="planner-formula">
                      <h4>Testing Formula (Visible for QA)</h4>
                      <p>{plan.formula.expression}</p>
                      <ul className="planner-list">
                        <li>baseHours: {plan.formula.values.baseHours}</li>
                        <li>urgencyFactor: {plan.formula.values.urgencyFactor.toFixed(2)}</li>
                        <li>attemptFactor: {plan.formula.values.attemptFactor.toFixed(2)}</li>
                        <li>difficultyFactor: {plan.formula.values.difficultyFactor.toFixed(2)}</li>
                        <li>productivityFactor: {plan.formula.values.productivityFactor.toFixed(2)}</li>
                      </ul>
                    </div>

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
                      <p className="planner-meta">
                        Performance formula: <strong>finalScore = baseScore x socialPenaltyFactor</strong> |
                        baseScore:{' '}
                        <strong className={resolveScoreToneClass(basePerformanceScore)}>
                          {basePerformanceScore}
                        </strong>
                        , socialPenaltyFactor:{' '}
                        <strong>{socialPerformancePenaltyFactor.toFixed(2)}</strong>, finalScore:{' '}
                        <strong className={resolveScoreToneClass(performanceScore)}>{performanceScore}</strong>
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
                              onClick={handleViewPerformancePdf}
                            >
                              View PDF
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
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

          <div className="study-metrics">
            <article className="metric-card">
              <p>Today Studied</p>
              <strong>{studiedTodayMinutes} min</strong>
            </article>
            <article className="metric-card">
              <p>Today Required</p>
              <strong>{requiredDailyMinutes || '--'} min</strong>
            </article>
            <article className="metric-card">
              <p>Still Needed Today</p>
              <strong>{requiredDailyMinutes ? `${remainingTodayMinutes} min` : 'Generate a plan'}</strong>
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
                  <span className="chart-bar" style={{ height: `${item.ratio}%` }} />
                </div>
                <small>{item.label}</small>
                <em>{item.studiedMinutes}m</em>
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
                        onClick={handleViewWeeklyReportPdf}
                      >
                        View Report PDF
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
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

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top container">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="Guardian Angel home">
            <img src={logo} alt="Guardian Angel logo" />
            <div>
              <strong>Guardian Angel</strong>
              <span>Knowledge Is Priceless</span>
            </div>
          </Link>
          <p>
            Empowering Pakistan&apos;s Future Leaders
          </p>
        </div>

        <div className="footer-links">
          <h4>Explore</h4>
          <Link to="/css-syllabus">CSS Syllabus</Link>
          <Link to="/css-rules">CSS Rules</Link>
          <Link to="/css-past-papers">CSS Past Papers</Link>
          <Link to="/css-study-material">CSS Study Material</Link>
          <Link to="/guardian-study-planner">Guardian Study Planner</Link>
        </div>

        <div className="footer-links">
          <h4>Core Values</h4>
          <a href="/#why-guardian-angel">Premium Quality</a>
          <a href="/#why-guardian-angel">Completely Free</a>
          <a href="/#why-guardian-angel">Equal Opportunity</a>
          <a href="/#mission">Knowledge is Priceless</a>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} Guardian Angel. All rights reserved.</p>
      </div>
    </footer>
  )
}

function formatNewsTimestamp(value) {
  if (!value) return ''
  try {
    const date = typeof value === 'number' ? new Date(value) : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function normalizeNewsSnippet(value) {
  if (typeof value !== 'string') return ''
  let decoded = value
  if (typeof document !== 'undefined') {
    const parser = document.createElement('textarea')
    parser.innerHTML = decoded
    decoded = parser.value
  }
  return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function NewsCardMedia({ image }) {
  const [hasLoadError, setHasLoadError] = useState(false)
  const hasImage = typeof image === 'string' && image.trim() && !hasLoadError

  return (
    <div className="current-affairs-card-media" aria-hidden="true">
      {hasImage ? (
        <img src={image} alt="" loading="lazy" onError={() => setHasLoadError(true)} />
      ) : (
        <div className="current-affairs-card-media-fallback">
          <span>Image not available</span>
        </div>
      )}
    </div>
  )
}

function WorldAffairsPage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('global')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [refreshSeed, setRefreshSeed] = useState(0)

  const pageSize = 24
  const maxResultsCap = 100000
  const effectiveTotal = Math.min(totalResults || 0, maxResultsCap)
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize) || 1)

  const fetchNews = async ({ signal } = {}) => {
    setStatus('loading')
    setError('')
    try {
      const effectiveQuery = appliedQuery
      const cacheKey = `ga-global-affairs-cache::${effectiveQuery.toLowerCase()}::p${page}::s${pageSize}`
      const cacheTtlMs = 8 * 60 * 1000

      try {
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw)
          if (
            cached?.ts &&
            Array.isArray(cached?.items) &&
            typeof cached?.totalResults === 'number' &&
            Date.now() - cached.ts < cacheTtlMs
          ) {
            setItems(cached.items)
            setTotalResults(cached.totalResults)
            setLastUpdatedAt(cached.ts)
            setStatus('success')
            return
          }
        }
      } catch {
        // Ignore cache failures.
      }

      const url =
        '/api/global-affairs?' +
        new URLSearchParams({
          q: effectiveQuery,
          pageSize: String(pageSize),
          page: String(page),
        }).toString()

      const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`News service returned ${res.status}`)
      const data = await res.json()
      const articles = Array.isArray(data?.articles) ? data.articles : []
      const nextTotalResults = typeof data?.totalResults === 'number' ? data.totalResults : 0
      const normalized = articles
        .map((article) => ({
          id: article?.url || article?.title || String(Math.random()),
          title: article?.title || 'Untitled',
          url: article?.url || '',
          source: article?.source?.name || '',
          domain: (() => {
            try {
              return article?.url ? new URL(article.url).hostname.replace(/^www\./, '') : ''
            } catch {
              return ''
            }
          })(),
          date: article?.publishedAt || '',
          image: article?.urlToImage || '',
          snippet: normalizeNewsSnippet(article?.description || ''),
        }))
        .filter((article) => article.url && article.title)

      setItems(normalized)
      setTotalResults(nextTotalResults)
      setLastUpdatedAt(Date.now())
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), items: normalized, totalResults: nextTotalResults }),
        )
      } catch {
        // Ignore cache failures.
      }
      setStatus('success')
    } catch (err) {
      if (err?.name === 'AbortError') return
      setItems([])
      setTotalResults(0)
      const message = err?.message || 'Unable to load news right now.'
      setError(
        message.includes('429')
          ? 'News provider is rate limiting requests (429). Please wait a minute and try Refresh again.'
          : message,
      )
      setStatus('error')
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchNews({ signal: controller.signal })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery, page, refreshSeed])

  const handleRefresh = () => {
    setRefreshSeed((current) => current + 1)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextAppliedQuery = query.trim() || 'global'
    setAppliedQuery(nextAppliedQuery)
    setPage(1)
  }

  return (
    <section className="current-affairs-shell">
      <div className="current-affairs-toolbar glass-panel">
        <div className="current-affairs-toolbar-head">
          <h3>Global headlines</h3>
          <p>
            Powered by World News API. Last updated{' '}
            {lastUpdatedAt ? <strong>{formatNewsTimestamp(lastUpdatedAt)}</strong> : '—'}.
          </p>
        </div>

        <form className="current-affairs-search" onSubmit={handleSubmit}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics (e.g., elections, economy, climate, tech)"
            aria-label="Search global affairs"
          />
          <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
            Search
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleRefresh} disabled={status === 'loading'}>
            Refresh
          </button>
        </form>
      </div>

      {status === 'loading' ? (
        <div className="current-affairs-loading">
          <p>Fetching the latest headlines…</p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="current-affairs-error glass-panel">
          <h3>Couldn’t load news</h3>
          <p>{error}</p>
          <button className="btn btn-primary" type="button" onClick={handleRefresh}>
            Try again
          </button>
        </div>
      ) : null}

      {status === 'success' ? (
        <>
          <div className="current-affairs-grid">
            {items.length === 0 ? (
              <div className="current-affairs-empty glass-panel">
                <h3>No results</h3>
                <p>Try searching a broader topic like “global”, “economy”, or “technology”.</p>
              </div>
            ) : (
              items.map((article) => (
                <a
                  key={article.id}
                  className="current-affairs-card"
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <NewsCardMedia image={article.image} />
                  <div className="current-affairs-card-body">
                    <p className="current-affairs-meta">
                      <span>{article.domain || article.source || 'Global'}</span>
                      {article.date ? <span>• {formatNewsTimestamp(article.date)}</span> : null}
                    </p>
                    <h3>{article.title}</h3>
                    {article.snippet ? <p className="current-affairs-snippet">{article.snippet}</p> : null}
                    <span className="current-affairs-readmore">Read full story →</span>
                  </div>
                </a>
              ))
            )}
          </div>

          {items.length > 0 ? (
            <div className="current-affairs-pagination" aria-label="News pagination controls">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={status === 'loading' || page <= 1}
              >
                ← Prev
              </button>
              <p className="current-affairs-pagination-meta">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>{' '}
                {effectiveTotal > 0 ? <span>• {effectiveTotal} results</span> : null}
              </p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={status === 'loading' || page >= totalPages}
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function PakistanAffairsPage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | error | success
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('pakistan')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [feed, setFeed] = useState('top') // top | all | politics
  const [refreshSeed, setRefreshSeed] = useState(0)

  const pageSize = 24
  const maxResultsCap = 100000
  const effectiveTotal = Math.min(totalResults || 0, maxResultsCap)
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize) || 1)

  const fetchNews = async ({ signal } = {}) => {
    setStatus('loading')
    setError('')
    try {
      const effectiveQuery = appliedQuery
      const cacheKey = `ga-pakistan-affairs-cache::${feed}::${effectiveQuery.toLowerCase()}::p${page}::s${pageSize}`
      const cacheTtlMs = 8 * 60 * 1000

      try {
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw)
          if (
            cached?.ts &&
            Array.isArray(cached?.items) &&
            typeof cached?.totalResults === 'number' &&
            Date.now() - cached.ts < cacheTtlMs
          ) {
            setItems(cached.items)
            setTotalResults(cached.totalResults)
            setLastUpdatedAt(cached.ts)
            setStatus('success')
            return
          }
        }
      } catch {
        // Ignore cache failures.
      }

      const url =
        '/api/current-affairs?' +
        new URLSearchParams({
          q: effectiveQuery,
          pageSize: String(pageSize),
          page: String(page),
          feed,
        }).toString()

      const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error(`News service returned ${res.status}`)
      const data = await res.json()
      const articles = Array.isArray(data?.articles) ? data.articles : []
      const nextTotalResults = typeof data?.totalResults === 'number' ? data.totalResults : 0
      const normalized = articles
        .map((article) => ({
          id: article?.url || article?.title || String(Math.random()),
          title: article?.title || 'Untitled',
          url: article?.url || '',
          source: article?.source?.name || '',
          domain: (() => {
            try {
              return article?.url ? new URL(article.url).hostname.replace(/^www\./, '') : ''
            } catch {
              return ''
            }
          })(),
          date: article?.publishedAt || '',
          image: article?.urlToImage || '',
          snippet: normalizeNewsSnippet(article?.description || ''),
        }))
        .filter((article) => article.url && article.title)

      setItems(normalized)
      setTotalResults(nextTotalResults)
      setLastUpdatedAt(Date.now())
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), items: normalized, totalResults: nextTotalResults }),
        )
      } catch {
        // Ignore cache failures.
      }
      setStatus('success')
    } catch (err) {
      if (err?.name === 'AbortError') return
      setItems([])
      setTotalResults(0)
      const message = err?.message || 'Unable to load news right now.'
      setError(
        message.includes('429')
          ? 'News provider is rate limiting requests (429). Please wait a minute and try Refresh again.'
          : message,
      )
      setStatus('error')
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchNews({ signal: controller.signal })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery, page, feed, refreshSeed])

  const handleRefresh = () => {
    setRefreshSeed((current) => current + 1)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextAppliedQuery = query.trim() || 'pakistan'
    setAppliedQuery(nextAppliedQuery)
    setPage(1)
  }

  return (
    <main className="page-main container">
      <section className="section-title">
        <p>Live updates from Pakistan</p>
        <h2>Pakistan Affairs</h2>
      </section>

      <section className="current-affairs-shell">
        <div className="current-affairs-toolbar glass-panel">
          <div className="current-affairs-toolbar-head">
            <h3>Pakistan headlines</h3>
            <p>
              Powered by World News API. Last updated{' '}
              {lastUpdatedAt ? <strong>{formatNewsTimestamp(lastUpdatedAt)}</strong> : '—'}.
            </p>
          </div>

          <div className="current-affairs-feed-tabs" role="tablist" aria-label="Pakistan affairs feed">
            <button
              type="button"
              className={`current-affairs-feed-tab ${feed === 'top' ? 'active' : ''}`}
              onClick={() => {
                setFeed('top')
                setPage(1)
              }}
            >
              Top News
            </button>
            <button
              type="button"
              className={`current-affairs-feed-tab ${feed === 'all' ? 'active' : ''}`}
              onClick={() => {
                setFeed('all')
                setPage(1)
              }}
            >
              Search News
            </button>
            <button
              type="button"
              className={`current-affairs-feed-tab ${feed === 'politics' ? 'active' : ''}`}
              onClick={() => {
                setFeed('politics')
                setPage(1)
              }}
            >
              Politics
            </button>
          </div>

          <form className="current-affairs-search" onSubmit={handleSubmit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Pakistan topics (e.g., elections, economy, security)"
              aria-label="Search Pakistan affairs"
            />
            <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
              Search
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleRefresh} disabled={status === 'loading'}>
              Refresh
            </button>
          </form>
        </div>

        {status === 'loading' ? (
          <div className="current-affairs-loading">
            <p>Fetching the latest headlines…</p>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="current-affairs-error glass-panel">
            <h3>Couldn’t load news</h3>
            <p>{error}</p>
            <button className="btn btn-primary" type="button" onClick={handleRefresh}>
              Try again
            </button>
          </div>
        ) : null}

        {status === 'success' ? (
          <>
            <div className="current-affairs-grid">
              {items.length === 0 ? (
                <div className="current-affairs-empty glass-panel">
                  <h3>No results</h3>
                  <p>Try searching a broader topic like “global”, “economy”, or “technology”.</p>
                </div>
              ) : (
                items.map((article) => (
                  <a
                    key={article.id}
                    className="current-affairs-card"
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NewsCardMedia image={article.image} />
                    <div className="current-affairs-card-body">
                      <p className="current-affairs-meta">
                        <span>{article.domain || article.source || 'Global'}</span>
                        {article.date ? <span>• {formatNewsTimestamp(article.date)}</span> : null}
                      </p>
                      <h3>{article.title}</h3>
                      {article.snippet ? <p className="current-affairs-snippet">{article.snippet}</p> : null}
                      <span className="current-affairs-readmore">Read full story →</span>
                    </div>
                  </a>
                ))
              )}
            </div>

            {items.length > 0 ? (
              <div className="current-affairs-pagination" aria-label="News pagination controls">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={status === 'loading' || page <= 1 || feed === 'top'}
                >
                  ← Prev
                </button>
                <p className="current-affairs-pagination-meta">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>{' '}
                  {effectiveTotal > 0 ? <span>• {effectiveTotal} results</span> : null}
                </p>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={status === 'loading' || page >= totalPages || feed === 'top'}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  )
}

function GlobalConflictMapTab() {
  const normalizeCountryDisplayName = (value) => {
    const raw = String(value || '').trim()
    if (raw.toLowerCase() === 'israel') return 'Occupied Palestine'
    return raw
  }
  const [showConflicts, setShowConflicts] = useState(false)
  const [countries, setCountries] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const loadConflicts = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/global-conflicts')
      if (!res.ok) throw new Error(`Conflict API returned ${res.status}`)
      const data = await res.json()
      const nextCountries = Array.isArray(data?.countries)
        ? data.countries.map((country) => ({
            ...country,
            country: normalizeCountryDisplayName(country.country),
            conflicts: Array.isArray(country.conflicts)
              ? country.conflicts.map((conflict) => ({
                  ...conflict,
                  countryName: normalizeCountryDisplayName(
                    conflict.countryName || conflict.country || country.country,
                  ),
                }))
              : [],
          }))
        : []
      setCountries(nextCountries)
      if (nextCountries.length === 0) setLoadError('No conflict data returned right now. Please try again.')
    } catch (error) {
      if (error?.name === 'AbortError') return
      setLoadError(error?.message || 'Unable to load conflict map data.')
    } finally {
      setIsLoading(false)
    }
  }

  const allConflicts = countries.flatMap((country) =>
    (country.conflicts || []).map((conflict) => ({
      ...conflict,
      countryName: country.country,
    })),
  )

  const openCountryConflict = (country) => {
    setSelectedCountry(country)
    setSelectedConflict((country?.conflicts || [])[0] || null)
  }

  const OccupiedPalestineMask = () => {
    const map = useMap()
    const [zoomLevel, setZoomLevel] = useState(map.getZoom())

    useEffect(() => {
      const syncZoomLevel = () => setZoomLevel(map.getZoom())
      map.on('zoomend', syncZoomLevel)
      return () => map.off('zoomend', syncZoomLevel)
    }, [map])

    const getMaskByZoom = (zoom) => {
      if (zoom <= 3) {
        return {
          bounds: [
            [30.4, 34.0],
            [31.75, 35.95],
          ],
          center: [31.03, 35.0],
        }
      }
      if (zoom === 4) {
        return {
          bounds: [
            [30.55, 34.25],
            [31.55, 35.75],
          ],
          center: [31.06, 34.99],
        }
      }
      if (zoom === 5) {
        return {
          bounds: [
            [30.72, 34.48],
            [31.42, 35.56],
          ],
          center: [31.09, 35.0],
        }
      }
      return {
        bounds: [
          [30.84, 34.62],
          [31.34, 35.4],
        ],
        center: [31.09, 35.0],
      }
    }

    const mask = getMaskByZoom(zoomLevel)
    return (
      <>
        <Rectangle
          bounds={mask.bounds}
          pathOptions={{
            color: '#e6ddcb',
            weight: 0,
            fillColor: '#f1eadb',
            fillOpacity: 0.98,
          }}
        />
        <CircleMarker center={mask.center} radius={1} pathOptions={{ opacity: 0, fillOpacity: 0 }}>
          <Tooltip permanent direction="center" className="occupied-palestine-overlay-label">
            Occupied Palestine
          </Tooltip>
        </CircleMarker>
      </>
    )
  }

  return (
    <section className="global-map-shell">
      <div className="global-map-head glass-panel">
        <div>
          <h3>Global Map</h3>
          <p>Track major conflict hotspots and open each marker for a concise situation brief.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            const next = !showConflicts
            setShowConflicts(next)
            if (next) {
              setSelectedCountry(null)
              setSelectedConflict(null)
              loadConflicts()
            }
          }}
        >
          {showConflicts ? 'Hide Global Conflicts' : 'View Global Conflicts'}
        </button>
      </div>

      {isLoading ? <p className="global-map-note">Loading live conflict data...</p> : null}
      {loadError ? <p className="global-map-note error">{loadError}</p> : null}

      <div className="global-map-board glass-panel">
        <MapContainer
          center={[30.3753, 69.3451]}
          zoom={5}
          minZoom={2}
          maxZoom={8}
          worldCopyJump
          className="global-leaflet-map"
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Garmin, GeoTechnologies, Inc, USGS, METI/NASA'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          <CircleMarker
            center={[30.3753, 69.3451]}
            radius={7}
            pathOptions={{ color: '#f2d56b', weight: 2, fillColor: '#f2d56b', fillOpacity: 0.35 }}
          />
          <OccupiedPalestineMask />
          {showConflicts
            ? countries.map((country) => (
                <CircleMarker
                  key={country.countryId}
                  center={[country.lat, country.lon]}
                  radius={8}
                  pathOptions={{ color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.72 }}
                  eventHandlers={{ click: () => openCountryConflict(country) }}
                />
              ))
            : null}
        </MapContainer>
      </div>

      {showConflicts ? (
        <div className="global-conflict-list">
          {allConflicts.map((conflict) => (
            <button
              key={`${conflict.id}_${conflict.countryName || conflict.country || ''}`}
              type="button"
              className="global-conflict-item"
              onClick={() => {
                const country = countries.find((item) => item.country === conflict.countryName)
                if (country) setSelectedCountry(country)
                setSelectedConflict(conflict)
              }}
            >
              <strong>{conflict.title}</strong>
              <span>{conflict.countryName}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedConflict ? (
        <div
          className="global-conflict-modal-overlay"
          role="presentation"
          onClick={() => {
            setSelectedConflict(null)
            setSelectedCountry(null)
          }}
        >
          <article
            className="global-conflict-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedConflict.title} details`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="global-conflict-modal-close"
              type="button"
              aria-label="Close conflict details"
              onClick={() => {
                setSelectedConflict(null)
                setSelectedCountry(null)
              }}
            >
              ×
            </button>
            <div className="global-conflict-modal-content">
              <h4>{selectedConflict.title}</h4>
              <p className="global-conflict-modal-meta">
                <strong>{selectedConflict.countryName || selectedConflict.country || selectedCountry?.country}</strong>
              </p>
              <p>{selectedConflict.summary}</p>
              <p>
                <strong>Started:</strong> {selectedConflict.startedAt ? formatNewsTimestamp(selectedConflict.startedAt) : 'Unknown'}
              </p>
              {selectedConflict.articleUrl ? (
                <a className="btn btn-secondary" href={selectedConflict.articleUrl} target="_blank" rel="noreferrer">
                  Read source
                </a>
              ) : null}
              {selectedCountry?.conflicts?.length > 1 ? (
                <div className="global-conflict-modal-list">
                  <p><strong>Other conflicts in this country:</strong></p>
                  <div>
                    {selectedCountry.conflicts.map((conflict) => (
                      <button
                        key={conflict.id}
                        type="button"
                        className="global-conflict-modal-list-btn"
                        onClick={() =>
                          setSelectedConflict({
                            ...conflict,
                            countryName: selectedCountry.country,
                          })
                        }
                      >
                        {conflict.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setSelectedConflict(null)
                  setSelectedCountry(null)
                }}
              >
                Close
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

function GlobalAffairsPage({ defaultTab = 'global' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const allowedTabs = ['global', 'pakistan', 'map']
  const getResolvedTab = (value) => {
    if (!value) return defaultTab
    return allowedTabs.includes(value) ? value : defaultTab
  }

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    return getResolvedTab(params.get('tab'))
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlTab = getResolvedTab(params.get('tab'))
    if (urlTab !== activeTab) setActiveTab(urlTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, defaultTab])

  const switchTab = (tabId) => {
    const nextTab = getResolvedTab(tabId)
    setActiveTab(nextTab)
    const params = new URLSearchParams(location.search)
    params.set('tab', nextTab)
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: true },
    )
  }

  return (
    <main className="page-main container">
      <section className="section-title">
        <p>International & Pakistan coverage</p>
        <h2>Global Affairs</h2>
      </section>

      <div className="current-affairs-feed-tabs" role="tablist" aria-label="Global vs Pakistan affairs">
        <button
          type="button"
          className={`current-affairs-feed-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => switchTab('global')}
        >
          Current Affairs (World)
        </button>
        <button
          type="button"
          className={`current-affairs-feed-tab ${activeTab === 'pakistan' ? 'active' : ''}`}
          onClick={() => switchTab('pakistan')}
        >
          Pakistan Affairs
        </button>
        <button
          type="button"
          className={`current-affairs-feed-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => switchTab('map')}
        >
          Global Map
        </button>
      </div>

      {activeTab === 'global' ? <WorldAffairsPage /> : null}
      {activeTab === 'pakistan' ? <PakistanAffairsPage /> : null}
      {activeTab === 'map' ? <GlobalConflictMapTab /> : null}
    </main>
  )
}

function StickyNotesWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem('ga-sticky-notes')
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('ga-sticky-notes', JSON.stringify(notes))
    } catch {
      // Ignore storage failures.
    }
  }, [notes])

  const handlePaste = async () => {
    try {
      if (!navigator?.clipboard?.readText) return
      const text = await navigator.clipboard.readText()
      if (typeof text === 'string' && text.trim()) {
        setDraft((current) => (current ? `${current}\n${text}` : text))
        setIsOpen(true)
      }
    } catch {
      // Clipboard can fail due to browser permissions.
    }
  }

  const handleSave = () => {
    const text = draft.trim()
    if (!text) return
    const note = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text,
      createdAt: Date.now(),
    }
    setNotes((current) => [note, ...current].slice(0, 30))
    setDraft('')
    setIsOpen(true)
  }

  const handleDelete = (id) => setNotes((current) => current.filter((note) => note.id !== id))

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Ignore copy failures.
    }
  }

  return (
    <div className="sticky-notes-wrap" aria-label="Sticky notes">
      <button
        className="sticky-notes-fab"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? 'Close sticky notes' : 'Open sticky notes'}
        title="Sticky notes"
      >
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path d="M6.5 3.8h11c1 0 1.8.8 1.8 1.8v9.3c0 .5-.2.9-.5 1.3l-3.7 3.7c-.3.3-.8.5-1.3.5H6.5c-1 0-1.8-.8-1.8-1.8V5.6c0-1 .8-1.8 1.8-1.8Z" fill="none" />
          <path d="M15.5 19.8v-3.2c0-.8.6-1.4 1.4-1.4h3.2" fill="none" />
          <path d="M8 8h8M8 11.2h8M8 14.4h5.6" fill="none" />
        </svg>
      </button>

      {isOpen ? (
        <div className="sticky-notes-panel glass-panel" role="dialog" aria-label="Sticky notes panel">
          <div className="sticky-notes-head">
            <div>
              <h3>Sticky Notes</h3>
              <p>Paste anything here and save it for later.</p>
            </div>
            <button className="btn btn-secondary" type="button" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>

          <div className="sticky-notes-compose">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Paste or type notes…"
              rows={5}
            />
            <div className="sticky-notes-actions">
              <button className="btn btn-secondary" type="button" onClick={handlePaste}>
                Paste
              </button>
              <button className="btn btn-primary" type="button" onClick={handleSave} disabled={!draft.trim()}>
                Save note
              </button>
            </div>
          </div>

          <div className="sticky-notes-list">
            {notes.length === 0 ? (
              <div className="sticky-notes-empty">
                <p>No saved notes yet.</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="sticky-note">
                  <p className="sticky-note-meta">{formatNewsTimestamp(note.createdAt)}</p>
                  <pre className="sticky-note-text">{note.text}</pre>
                  <div className="sticky-note-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => handleCopy(note.text)}>
                      Copy
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => handleDelete(note.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 220)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <button
      className={`scroll-top-btn ${isVisible ? 'visible' : ''}`}
      type="button"
      aria-label="Back to top"
      aria-hidden={!isVisible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

const upsertMetaTag = (name, content, attr = 'name') => {
  if (!content) return
  const selector = `meta[${attr}="${name}"]`
  let tag = document.head.querySelector(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const upsertLinkTag = (rel, href) => {
  if (!href) return
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

const resolveRouteSeo = (pathname, search) => {
  if (pathname.startsWith('/blog/')) {
    return {
      title: 'CSS Blog Article | Guardian Angel',
      description:
        'Read detailed CSS preparation blog articles on strategy, self study, writing quality, and exam mindset by Guardian Angel.',
    }
  }

  if (pathname.startsWith('/css-syllabus/')) {
    return {
      title: 'CSS Subject Details | Guardian Angel',
      description:
        'Review subject wise CSS syllabus details and prepare each topic with better structure, relevant references, and focused answer writing practice.',
    }
  }

  if (pathname === '/global-affairs') {
    const tab = new URLSearchParams(search).get('tab')
    if (tab === 'pakistan') {
      return {
        title: 'Pakistan Affairs News | Guardian Angel',
        description:
          'Follow Pakistan affairs updates, policy developments, and national issues relevant for CSS preparation and quality analytical writing.',
      }
    }
    if (tab === 'map') {
      return {
        title: 'Global Conflict Map | Guardian Angel',
        description:
          'Explore an interactive global conflict map with conflict summaries to support stronger current affairs analysis for CSS preparation.',
      }
    }
  }

  return SEO_BY_PATH[pathname] || DEFAULT_SEO
}

function SeoMetaManager() {
  const location = useLocation()

  useEffect(() => {
    const seo = resolveRouteSeo(location.pathname, location.search)
    const canonicalUrl = `${SITE_URL}${location.pathname}${location.search || ''}`

    document.title = seo.title
    document.documentElement.setAttribute('lang', 'en')

    upsertMetaTag('description', seo.description)
    upsertMetaTag('keywords', DEFAULT_SEO.keywords)
    upsertMetaTag('robots', 'index, follow, max-image-preview:large')

    upsertMetaTag('og:title', seo.title, 'property')
    upsertMetaTag('og:description', seo.description, 'property')
    upsertMetaTag('og:type', 'website', 'property')
    upsertMetaTag('og:url', canonicalUrl, 'property')
    upsertMetaTag('og:site_name', 'Guardian Angel', 'property')
    upsertMetaTag('og:image', `${SITE_URL}/favicon.png`, 'property')

    upsertMetaTag('twitter:card', 'summary_large_image')
    upsertMetaTag('twitter:title', seo.title)
    upsertMetaTag('twitter:description', seo.description)
    upsertMetaTag('twitter:image', `${SITE_URL}/favicon.png`)

    upsertLinkTag('canonical', canonicalUrl)
  }, [location.pathname, location.search])

  return null
}

function useRemoveVisibleWordHyphens() {
  useEffect(() => {
    const shouldSkipNode = (node) => {
      const parent = node.parentElement
      if (!parent) return true
      const blockedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE'])
      return blockedTags.has(parent.tagName)
    }

    const normalizeNodeText = (node) => {
      if (!node || shouldSkipNode(node)) return
      const original = node.nodeValue || ''
      if (!original || original.includes('http://') || original.includes('https://')) return
      const normalized = original.replace(/\b([A-Za-z]+)-([A-Za-z]+)\b/g, '$1 $2')
      if (normalized !== original) node.nodeValue = normalized
    }

    const normalizeTree = (root) => {
      if (!root) return
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let current = walker.nextNode()
      while (current) {
        normalizeNodeText(current)
        current = walker.nextNode()
      }
    }

    normalizeTree(document.body)

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          normalizeNodeText(mutation.target)
          return
        }

        mutation.addedNodes.forEach((addedNode) => {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            normalizeNodeText(addedNode)
            return
          }
          if (addedNode.nodeType === Node.ELEMENT_NODE) normalizeTree(addedNode)
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])
}

function App() {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const raw = localStorage.getItem('ga-auth-user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ga-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('ga-theme', theme)
    } catch {
      // Ignore storage failures and continue with in-memory theme.
    }
  }, [theme])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined

    const root = document.documentElement

    const handlePointerMove = (event) => {
      root.style.setProperty('--cursor-x', `${event.clientX}px`)
      root.style.setProperty('--cursor-y', `${event.clientY}px`)
      root.style.setProperty('--cursor-glow-opacity', '1')
    }

    const handlePointerLeave = () => {
      root.style.setProperty('--cursor-glow-opacity', '0')
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  useEffect(() => {
    try {
      if (authUser) localStorage.setItem('ga-auth-user', JSON.stringify(authUser))
      else localStorage.removeItem('ga-auth-user')
    } catch {
      // Ignore storage failures and continue with in-memory auth state.
    }
  }, [authUser])

  useRemoveVisibleWordHyphens()

  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <SeoMetaManager />
      <div className="site">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          authUser={authUser}
          onLogout={() => setAuthUser(null)}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pakistan-affairs" element={<GlobalAffairsPage defaultTab="pakistan" />} />
          <Route path="/global-affairs" element={<GlobalAffairsPage defaultTab="global" />} />
          <Route path="/css-syllabus" element={<CssSyllabusPage />} />
          <Route path="/css-rules" element={<CssRulesPage />} />
          <Route path="/css-past-papers" element={<CssPastPapersPage />} />
          <Route path="/css-study-material" element={<CssStudyMaterialPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:blogSlug" element={<BlogPage />} />
          <Route
            path="/signin"
            element={<SignInPage authUser={authUser} onSignIn={(user) => setAuthUser(user)} />}
          />
          <Route
            path="/guardian-study-planner"
            element={
              authUser ? (
                <GuardianStudyPlannerPage authUser={authUser} />
              ) : (
                <Navigate to="/signin" replace state={{ from: '/guardian-study-planner' }} />
              )
            }
          />
          <Route path="/css-syllabus/:subjectSlug" element={<SubjectDetailPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer />
        <StickyNotesWidget />
        <BackToTopButton />
      </div>
    </BrowserRouter>
  )
}

export default App
