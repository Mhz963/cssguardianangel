// Per-route SEO: titles, descriptions and structured data.
// Shared by the app (SeoMetaManager in App.jsx) and the build step (scripts/prerender-seo.mjs), so keep it plain JS.
import { compulsorySubjects, optionalGroups, slugify } from '../data/syllabusData.js'

export const DEFAULT_SEO = {
  title: 'Guardian Angel | Free Online CSS Preparation Website in Pakistan',
  description:
    'Free online CSS preparation website for Pakistan: FPSC syllabus, CSS rules, past papers, MPT mock tests, English practice, current affairs and free video guides.',
  keywords:
    'free CSS preparation, online CSS preparation, online CSS preparation classes free, CSS website Pakistan, Guardian Angel website, CSS rules, CSS eligibility criteria, CSS requirements in Pakistan, FPSC CSS exam, CSS syllabus, CSS past papers, CSS MPT, current affairs Pakistan, Pakistan affairs',
}

export const SEO_BY_PATH = {
  '/': {
    title: 'Guardian Angel | Free Online CSS Preparation Website in Pakistan',
    description:
      'Free online CSS preparation website for Pakistan: FPSC syllabus, CSS rules, past papers, MPT mock tests, English practice, current affairs and free video guides.',
  },
  '/css-syllabus': {
    title: 'CSS Syllabus | FPSC Compulsory and Optional Subjects',
    description:
      'Explore the complete FPSC CSS syllabus with compulsory and optional subjects to build a focused and strategic preparation plan.',
  },
  '/css-rules': {
    title: 'CSS Rules: Eligibility Criteria, Age Limit and Requirements in Pakistan',
    description:
      "CSS eligibility criteria and requirements in Pakistan: age limit 21 to 30, a bachelor's degree, three attempts, domicile, pass marks and the full FPSC CSS rules.",
  },
  '/css-past-papers': {
    title: 'CSS Past Papers | Download and Practice',
    description:
      'Access CSS past papers by subject to identify examiner trends, practice answer writing, and strengthen high scoring preparation.',
  },
  '/css-study-material': {
    title: 'CSS Study Material | Free Online CSS Preparation Notes and Slides',
    description:
      'Get free CSS study material for compulsory and optional subjects with topic wise coverage for consistent and exam oriented preparation.',
  },
  '/source-vault': {
    title: 'Source Vault | Key Documents for CSS: Constitutions, Laws, Treaties',
    description:
      '177 key documents for the CSS exam, from the Constitution of Pakistan and Objectives Resolution to the UN Charter, UNCLOS and the Paris Agreement, mapped to every CSS subject with official sources.',
  },
  '/css-past-papers/topic-wise': {
    title: 'Topic-wise CSS Past Papers | Most Repeated Topics by Subject',
    description:
      'Every FPSC CSS question for Essay, Current Affairs, Pakistan Affairs, Islamiat, GSA and International Relations, sorted by syllabus topic, with a topic-by-year heatmap of the most repeated topics.',
  },
  '/guardian-test-centre': {
    title: 'Guardian Test Centre | CSS MPT Mock Tests and MCQ Practice',
    description:
      'Free CSS MPT mock tests weighted like the real screening test, MCQ practice by subject and topic with explanations, and real FPSC MCQs from past papers.',
  },
  '/guardian-news-desk': {
    title: 'Guardian News Desk | Pakistan and World Current Affairs for CSS',
    description:
      "Today's Pakistan and world headlines from Dawn, BBC, UN News and other trusted outlets, sorted by CSS themes: governance, economy, security, diplomacy and climate. Refreshed every 15 minutes.",
  },
  '/signin': {
    title: 'Sign In | Guardian Angel',
    description:
      'Sign in to Guardian Angel to access personalized CSS preparation features and your protected study planner.',
  },
  '/payment': {
    title: 'Guardian Study Planner | Free Access',
    description:
      'Guardian Study Planner is now free for all signed-in users. Sign in to access Subject Locker, Strategy Builder, and your full CSS study workspace.',
  },
  '/guardian-study-planner': {
    title: 'Guardian Study Planner | Free CSS Planning Tool',
    description:
      'Sign in to access Subject Locker, Strategy Builder, Performance Analysis, Timer, Calendar, PDF reports, and AI Examiner — free for every CSS Jawan.',
  },
  '/guardian-portfolio': {
    title: 'Guardian Portfolio | Free Freelance Profiles for CSS Jawans',
    description:
      'Earn while you prepare for CSS. Create a free Fiverr-style profile, publish your skills as gigs and share one link to get orders. No fees, no commission.',
  },
  '/guardian-conflict-atlas': {
    title: 'Guardian Conflict Atlas | Ongoing Wars and Conflicts Map',
    description:
      'Every ongoing armed conflict on one world map centred on Pakistan: sides, start dates, casualties, summaries and the latest headlines, with sources. Updated every 6 hours.',
  },
  '/guardian-portfolio/browse': {
    title: 'Browse CSS Jawans | Guardian Portfolio',
    description:
      'Find tutors, writers, translators and researchers preparing for CSS. View their gigs and contact them directly. Free, with no commission.',
  },
  '/guardian-portfolio/example': {
    title: 'Example Profile | Guardian Portfolio',
    description:
      'See what a complete Guardian Portfolio looks like: headline, gigs with prices, work samples and contact details.',
  },
  '/guardian-portfolio/edit': {
    title: 'Portfolio Editor | Guardian Portfolio',
    description: 'Create and edit your free Guardian Portfolio in four short steps: profile, gigs, work samples, publish.',
  },
  '/blogs': {
    title: 'CSS Blog | Guardian Angel Insights',
    description:
      'Read practical CSS preparation blogs on strategy, current affairs analysis, answer writing, and exam discipline by Guardian Angel.',
  },
  '/about-guardian-angel': {
    title: 'About Guardian Angel | The Free CSS Preparation Website',
    description:
      'Guardian Angel is a free CSS preparation website for Pakistan, built for equal educational opportunity, ethical CSS preparation and top-tier guidance for every CSS Jawan.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Guardian Angel',
    description:
      'How Guardian Angel collects, uses, stores, and protects personal information when you use our CSS preparation website and related services.',
  },
  '/terms': {
    title: 'Terms of Use | Guardian Angel',
    description: 'The terms for using Guardian Angel, the free CSS preparation platform for Pakistan.',
  },
  '/delete-account': {
    title: 'Delete Your Account | Guardian Angel',
    description: 'How to permanently delete your Guardian Angel account and data from the website or the Android app.',
  },
}

const SUBJECT_NAMES = Object.fromEntries(
  [...compulsorySubjects, ...optionalGroups.flatMap((group) => group.subjects)].map((title) => [
    slugify(title),
    title.replace(/\s*\(\d+\s*Marks\)\s*$/i, '').trim(),
  ]),
)

export const resolveRouteSeo = (pathname) => {
  if (pathname.startsWith('/blogs/')) {
    return {
      title: 'CSS Blog Article | Guardian Angel',
      description:
        'Read detailed CSS preparation blog articles on strategy, self study, writing quality, and exam mindset by Guardian Angel.',
    }
  }

  if (pathname.startsWith('/css-syllabus/')) {
    const name = SUBJECT_NAMES[pathname.split('/')[2] || '']
    if (name) {
      return {
        title: `${name} CSS Syllabus and Outline | Guardian Angel`,
        description: `The FPSC CSS syllabus for ${name}: marks, group and the full course outline, with past papers, study material and key documents for the subject.`,
      }
    }
    return {
      title: 'CSS Subject Details | Guardian Angel',
      description:
        'Review subject wise CSS syllabus details and prepare each topic with better structure, relevant references, and focused answer writing practice.',
    }
  }

  if (pathname.startsWith('/guardian-english')) {
    const moduleTitles = {
      grammar: 'CSS Grammar Practice',
      punctuation: 'CSS Punctuation Practice',
      'sentence-correction': 'CSS Sentence Correction Practice',
      'pairs-of-words': 'CSS Pairs of Words Practice',
      'synonyms-antonyms': 'CSS Synonyms & Antonyms Practice',
      vocabulary: 'CSS Vocabulary Builder',
      'past-papers': 'CSS English Past Paper References',
    }
    const slug = pathname.split('/')[2] || ''
    return {
      title: moduleTitles[slug]
        ? `${moduleTitles[slug]} | Guardian English Lab`
        : 'CSS English Preparation | Guardian English Lab',
      description:
        'Free CSS English (Precis & Composition) practice: grammar, punctuation, sentence correction, pairs of words, synonyms and antonyms, vocabulary and FPSC past paper questions with instant feedback.',
    }
  }

  if (pathname.startsWith('/p/')) {
    return {
      title: 'Guardian Portfolio | Guardian Angel',
      description:
        'View a public Guardian Angel portfolio with work samples, skills, and contact links shared by a signed-in member.',
    }
  }

  return SEO_BY_PATH[pathname] || DEFAULT_SEO
}

// ---------------------------------------------------------------- structured data

const UPLOADED = '2026-11-27'

/** Tutorial videos shown on each page (VideoObject rich results). Durations are ISO 8601. */
export const PAGE_VIDEOS = {
  '/': {
    file: 'welcome-tour',
    name: 'How to Prepare for CSS Online | Complete Guardian Angel Guide',
    duration: 'PT2M58S',
    description:
      'A complete tour of Guardian Angel, the free online CSS preparation website for Pakistan: syllabus, past papers, MPT mocks, English practice, current affairs and the Study Planner.',
  },
  '/guardian-test-centre': {
    file: 'test-centre-tutorial',
    name: 'CSS MPT Preparation | MPT Mock Tests with Real FPSC MCQs',
    duration: 'PT1M50S',
    description:
      'Prepare for the CSS MPT with timed mocks on the official FPSC pattern, results by area and 1,048 MCQs including real FPSC questions.',
  },
  '/css-past-papers/topic-wise': {
    file: 'topic-wise-past-papers-tutorial',
    name: 'CSS Past Papers Topic Wise | Most Repeated FPSC Topics',
    duration: 'PT1M38S',
    description:
      'Topic-wise CSS past papers: 1,149 real FPSC questions sorted by syllabus topic, with the most repeated topics and timed practice.',
  },
  '/signin': {
    file: 'study-planner-tutorial',
    name: 'CSS Study Plan and Timetable | Guardian Study Planner Guide',
    duration: 'PT1M44S',
    description:
      'Build a personal CSS study plan: lock your subjects, generate a strategy for your exam date, track study time and follow your progress.',
  },
  '/css-syllabus': {
    file: 'resource-library-tutorial',
    name: 'CSS Syllabus, Study Material and Past Papers | All in One Place',
    duration: 'PT1M19S',
    description:
      'The CSS Rules, the full FPSC syllabus, lecture slides, past papers by year and the Source Vault, and how they fit together.',
  },
  '/source-vault': {
    file: 'source-vault-tutorial',
    name: 'Constitution of Pakistan and Key Documents for CSS | Source Vault Guide',
    duration: 'PT1M23S',
    description: '177 key documents for CSS, from the Constitution of Pakistan to the UN Charter, and how to cite them in your answers.',
  },
  '/guardian-news-desk': {
    file: 'news-desk-tutorial',
    name: 'CSS Current Affairs Preparation | 10 Minutes a Day with the News Desk',
    duration: 'PT1M16S',
    description: 'Pakistan and world current affairs for CSS, sorted by exam themes, in ten minutes a day.',
  },
  '/guardian-conflict-atlas': {
    file: 'conflict-atlas-tutorial',
    name: 'World Conflicts Map for CSS | International Relations and Current Affairs',
    duration: 'PT1M10S',
    description:
      'Every ongoing war and conflict on one map, with dates, sides, casualties, news and sources for CSS IR and Current Affairs.',
  },
  '/guardian-english': {
    file: 'english-lab-guide',
    name: 'CSS English Preparation | Grammar, Sentence Correction and Vocabulary',
    duration: 'PT1M41S',
    description:
      'Master the CSS English paper with real FPSC questions: grammar, sentence correction, synonyms and antonyms, and a 1,082-word vocabulary builder.',
  },
}

/** FAQ for the CSS Rules page. Every answer repeats what the page itself says (CSS Competitive Examination Rules, 2019). */
export const RULES_FAQ = [
  [
    'What is the age limit for the CSS exam?',
    'A candidate must be at least 21 and not more than 30 years old on the cut-off date, which is 31 December of the year before the exam. Two years of relaxation in the upper age limit is allowed for listed categories, including in-service government servants with two years of continuous service, residents of Balochistan, Azad Kashmir and Gilgit-Baltistan, and special candidates.',
  ],
  [
    'What education is required for CSS?',
    "At least a second division or grade C bachelor's degree from a Pakistani university, or an equivalent foreign degree recognised by the HEC. A candidate with a third division bachelor's degree is eligible if they have a higher division in a master's degree.",
  ],
  [
    'How many attempts are allowed in CSS?',
    'A candidate can take the CSS competitive examination at most three times within the prescribed age limits. Appearing in any paper counts as an attempt.',
  ],
  [
    'Who is eligible to apply for CSS?',
    'Citizens of Pakistan, or persons deriving their nationality from the State of Jammu and Kashmir, who meet the age, education and domicile requirements.',
  ],
  [
    'What are the passing marks in the CSS written exam?',
    'At least 40% in each compulsory subject, 33% in each optional subject and 50% in aggregate. The viva voce carries 300 marks and a candidate must score at least 100.',
  ],
  [
    'How many marks is the CSS written exam?',
    'The written examination has 600 marks of compulsory papers and 600 marks of optional papers, 1,200 in total, followed by a 300-mark viva voce.',
  ],
]

/** JSON-LD for one route: its tutorial video and, on the CSS Rules page, the FAQ. */
export const routeJsonLd = (pathname, siteUrl) => {
  const out = []
  const video = PAGE_VIDEOS[pathname]
  if (video) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: video.name,
      description: video.description,
      thumbnailUrl: [`${siteUrl}/media/${video.file}-poster.webp`],
      contentUrl: `${siteUrl}/media/${video.file}.mp4`,
      uploadDate: UPLOADED,
      duration: video.duration,
      publisher: {
        '@type': 'Organization',
        name: 'Guardian Angel',
        logo: { '@type': 'ImageObject', url: `${siteUrl}/favicon.png` },
      },
    })
  }
  if (pathname === '/css-rules') {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: RULES_FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    })
  }
  return out
}
