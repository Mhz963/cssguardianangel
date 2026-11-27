import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import './App.css'
import './styles/refresh.css'
import logo from './assets/guardian-angel-logo-192.webp'
import { ensureFreshSession, supabase } from './utils/supabaseClient.js'
import { usePlannerReminderBootstrap, usePlannerReminderPopup } from './plannerReminderClient.js'
import { detectPasswordRecoveryFromUrl, isPasswordRecoveryPending, markPasswordRecovery } from './utils/authRecovery.js'
import { PdfAppExperienceHost } from './PdfAppExperience.jsx'
import { isSuperAdminEmail } from './utils/adminClient.js'
import { SITE_URL, YOUTUBE_PAGE_URL } from './siteConfig.js'

// Route pages load on demand so the home page ships only what it needs.
const GuardianEnglishPage = lazy(() => import('./pages/GuardianEnglishPage.jsx'))
const GuardianStudyPlannerPage = lazy(() => import('./pages/GuardianStudyPlannerPage.jsx'))
const BlogPage = lazy(() => import('./pages/BlogPage.jsx'))
const LegacyBlogSlugRedirect = lazy(() => import('./pages/BlogPage.jsx').then((m) => ({ default: m.LegacyBlogSlugRedirect })))
const KeyDocumentsPage = lazy(() => import('./pages/KeyDocumentsPage.jsx'))
const CssStudyMaterialPage = lazy(() => import('./pages/CssStudyMaterialPage.jsx'))
const GlobalAffairsPage = lazy(() => import('./pages/GlobalAffairsPage.jsx'))
const SignInPage = lazy(() => import('./pages/SignInPage.jsx'))
const CssPastPapersPage = lazy(() => import('./pages/CssPastPapersPage.jsx'))
const PrivacyPolicyPage = lazy(() => import('./pages/InfoPages.jsx').then((m) => ({ default: m.PrivacyPolicyPage })))
const DeleteAccountPage = lazy(() => import('./pages/InfoPages.jsx').then((m) => ({ default: m.DeleteAccountPage })))
const TermsPage = lazy(() => import('./pages/InfoPages.jsx').then((m) => ({ default: m.TermsPage })))
const AboutGuardianAngelPage = lazy(() => import('./pages/InfoPages.jsx').then((m) => ({ default: m.AboutGuardianAngelPage })))
const CssRulesPage = lazy(() => import('./pages/CssRulesPage.jsx'))
const CssSyllabusPage = lazy(() => import('./pages/CssSyllabusPage.jsx'))
const SubjectDetailPage = lazy(() => import('./pages/SubjectDetailPage.jsx'))
const StickyNotesWidget = lazy(() => import('./components/StickyNotesWidget.jsx'))
const ProfilePage = lazy(() => import('./ProfilePage.jsx'))
const AdminDashboardPage = lazy(() => import('./AdminDashboardPage.jsx'))
const GuardianPortfolioPage = lazy(() => import('./GuardianPortfolioPage.jsx'))
const GuardianPortfolioPublicPage = lazy(() => import('./GuardianPortfolioPublicPage.jsx'))
const ConflictAtlasPage = lazy(() => import('./pages/ConflictAtlasPage.jsx'))
const PortfolioLanding = lazy(() => import('./pages/portfolio/PortfolioLanding.jsx'))
const PortfolioBrowse = lazy(() => import('./pages/portfolio/PortfolioBrowse.jsx'))
const PortfolioExample = lazy(() => import('./pages/portfolio/PortfolioExample.jsx'))

const GOOGLE_PLAY_APP_URL = 'https://play.google.com/store/apps/details?id=com.cssguardianangel.app'
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/profile.php?id=61572039072912'
const INSTAGRAM_PAGE_URL = 'https://www.instagram.com/cssguardianangel/'
const LINKEDIN_PAGE_URL = 'https://www.linkedin.com/company/135217403/'


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
  '/key-documents': {
    title: 'Key Documents | Pakistan and International References',
    description:
      'Access key Pakistan and international documents including Constitution of Pakistan, UDHR, and UN Charter with quick view and download options.',
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
    title: 'About Guardian Angel | Equal Opportunity for CSS Aspirants',
    description:
      'Learn how Guardian Angel stands for equal educational opportunity, ethical CSS preparation, and free top-tier guidance for every CSS Jawan.',
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

const pillars = [
  {
    title: 'Premium Quality Content',
    text: 'The content of Guardian Angel is designed according to FPSC standards and focuses on topper level preparation.',
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
    text: 'Students from every city, village, and background can prepare for Central Superior Services.',
  },
]

const PILLAR_ICONS = ['award', 'heart', 'target', 'users']

const HOME_STATS = [
  { value: '425+', label: 'Lecture slide decks' },
  { value: '50+', label: 'Subjects covered' },
  { value: 'FPSC', label: 'Past papers by year' },
  { value: '100%', label: 'Free, always' },
]

const HOME_RESOURCES = [
  {
    icon: 'book',
    title: 'CSS Syllabus',
    text: 'Every compulsory and optional subject with detailed course outlines.',
    to: '/css-syllabus',
  },
  {
    icon: 'target',
    title: 'CSS Rules',
    text: 'Age limit, eligibility, attempts and the official FPSC rules, explained.',
    to: '/css-rules',
  },
  {
    icon: 'papers',
    title: 'FPSC Past Papers',
    text: 'Official question papers organised by year, ready to practise.',
    to: '/css-past-papers',
  },
  {
    icon: 'slides',
    title: 'Lecture Slides',
    text: '425+ slide decks to understand subjects and choose your optionals.',
    to: '/css-study-material',
  },
  {
    icon: 'scroll',
    title: 'Key Documents',
    text: 'The Constitution of Pakistan, UN Charter, UDHR and official sources.',
    to: '/key-documents',
  },
  {
    icon: 'globe',
    title: 'Current Affairs',
    text: 'Pakistan and global affairs with an interactive world conflict map.',
    to: '/global-affairs',
  },
  {
    icon: 'pen',
    title: 'Guardian English Lab',
    text: 'Grammar, sentence correction, pairs of words and vocabulary with instant feedback.',
    to: '/guardian-english',
  },
  {
    icon: 'calendar',
    title: 'Study Planner',
    text: 'A personal timetable, reminders and a progress report to stay on track.',
    to: '/guardian-study-planner',
  },
]

const HOME_STEPS = [
  {
    title: 'Understand the exam',
    text: 'Read the rules and eligibility, then go through the full syllabus subject by subject.',
    to: '/css-rules',
    cta: 'CSS rules',
  },
  {
    title: 'Learn from authentic sources',
    text: 'Study with lecture slides, key documents and FPSC past papers instead of ready-made notes.',
    to: '/css-study-material',
    cta: 'Study material',
  },
  {
    title: 'Plan, practise and track',
    text: 'Build your timetable in the Study Planner, set reminders and measure your progress.',
    to: '/guardian-study-planner',
    cta: 'Study Planner',
  },
]

const HOME_ICON_PATHS = {
  book: 'M12 6.5C10.2 5.2 7.6 4.5 4 4.5v13c3.6 0 6.2.7 8 2m0-13c1.8-1.3 4.4-2 8-2v13c-3.6 0-6.2.7-8 2m0-13v13',
  papers: 'M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v4h4M9.5 12h7M9.5 15.5h7M4 7v12a3 3 0 0 0 3 3h9',
  slides: 'M3 4.5h18v11H3zM12 15.5V20M8 20h8M10 7.8v4.4l3.8-2.2z',
  scroll: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2.5 5h5M9.5 11.5h5M9.5 15h3',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  pen: 'M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 7.5l3 3M12 20h8',
  calendar: 'M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 5h16M8.5 3v4M15.5 3v4M9 15l2 2 4-4',
  award: 'M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3.4 2.6L7.5 21l4.5-2.2 4.5 2.2-1.1-4.4',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.4A6 6 0 0 1 21 20',
}

function HomeIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={HOME_ICON_PATHS[name] || HOME_ICON_PATHS.book} />
    </svg>
  )
}

const HOME_FAQ_INITIAL = 6

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

const mapSupabaseUserToAuthUser = (user) => {
  if (!user) return null
  const meta = user.user_metadata || {}
  const email = String(user.email || '').trim()
  const usernameCandidate = String(meta.username || email.split('@')[0] || user.id.slice(0, 8)).trim()
  const fullNameCandidate = String(meta.full_name || meta.name || usernameCandidate || 'Guardian User').trim()
  return {
    id: user.id,
    email,
    username: usernameCandidate || `user-${user.id.slice(0, 8)}`,
    fullName: fullNameCandidate || 'Guardian User',
    name: fullNameCandidate || 'Guardian User',
  }
}

function Header({ theme, onToggleTheme, authUser, onLogout }) {
  const topbarRef = useRef(null)
  const [animateToggle, setAnimateToggle] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openNavGroup, setOpenNavGroup] = useState('')
  const [isDashboardMenuOpen, setIsDashboardMenuOpen] = useState(false)
  const location = useLocation()

  useLayoutEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(max-width: 720px)')
    const layoutWidth = () => {
      const vv = window.visualViewport
      if (vv && typeof vv.width === 'number' && vv.width > 0) return vv.width
      if (window.innerWidth > 0) return window.innerWidth
      return 721
    }
    const isNarrowLayout = () => mq.matches || layoutWidth() <= 720

    const updateMobileNavTop = () => {
      if (!isNarrowLayout()) {
        root.style.removeProperty('--ga-mobile-nav-top')
        return
      }
      const el = topbarRef.current
      if (!el) return
      const bottom = Math.max(0, Math.round(el.getBoundingClientRect().bottom))
      root.style.setProperty('--ga-mobile-nav-top', `${bottom}px`)
    }

    updateMobileNavTop()

    mq.addEventListener('change', updateMobileNavTop)

    const el = topbarRef.current
    let ro
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateMobileNavTop())
      ro.observe(el)
    }

    window.addEventListener('resize', updateMobileNavTop)
    window.addEventListener('scroll', updateMobileNavTop, { passive: true })
    window.visualViewport?.addEventListener('resize', updateMobileNavTop)
    window.visualViewport?.addEventListener('scroll', updateMobileNavTop)

    return () => {
      mq.removeEventListener('change', updateMobileNavTop)
      ro?.disconnect()
      window.removeEventListener('resize', updateMobileNavTop)
      window.removeEventListener('scroll', updateMobileNavTop)
      window.visualViewport?.removeEventListener('resize', updateMobileNavTop)
      window.visualViewport?.removeEventListener('scroll', updateMobileNavTop)
      root.style.removeProperty('--ga-mobile-nav-top')
    }
  }, [location.pathname, authUser, isMobileMenuOpen, theme])

  const isDashboardRoute = (pathname) =>
    pathname === '/dashboard' ||
    pathname === '/guardian-study-planner' ||
    pathname === '/profile' ||
    pathname === '/admin'
  const isSuperAdmin = isSuperAdminEmail(authUser?.email)
  const isResourceRoute = (pathname) =>
    pathname === '/css-rules' ||
    pathname === '/css-syllabus' ||
    pathname === '/css-past-papers' ||
    pathname === '/css-study-material' ||
    pathname === '/key-documents' ||
    pathname === '/global-affairs'
  const isAngelResourcesRoute = (pathname) =>
    pathname === '/guardian-study-planner' ||
    pathname.startsWith('/guardian-portfolio') ||
    pathname.startsWith('/guardian-english') ||
    pathname === '/guardian-conflict-atlas' ||
    pathname.startsWith('/p/')

  const navItems = [
    { label: 'Home', to: '/' },
    {
      id: 'css-library',
      label: 'CSS Resource Library',
      isActive: isResourceRoute(location.pathname),
      children: [
        { label: 'CSS Rules', to: '/css-rules' },
        { label: 'CSS Syllabus', to: '/css-syllabus' },
        { label: 'CSS Past Papers', to: '/css-past-papers' },
        { label: 'CSS Study Material', to: '/css-study-material' },
        { label: 'Key Documents', to: '/key-documents' },
        { label: 'Global Affairs', to: '/global-affairs' },
      ],
    },
    {
      id: 'angel-resources',
      label: 'Guardian Angel Resources',
      isActive: isAngelResourcesRoute(location.pathname),
      children: [
        { label: 'Guardian English Lab', to: '/guardian-english' },
        { label: 'Guardian Conflict Atlas', to: '/guardian-conflict-atlas' },
        { label: 'Guardian Study Planner', to: '/guardian-study-planner' },
        { label: 'Guardian Portfolio', to: '/guardian-portfolio' },
      ],
    },
    { label: 'Blogs', to: '/blogs' },
    { label: 'About Guardian Angel', to: '/about-guardian-angel' },
  ]

  const handleThemeToggle = () => {
    setAnimateToggle(true)
    closeMobileMenu()
    onToggleTheme()
    window.setTimeout(() => setAnimateToggle(false), 800)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setOpenNavGroup('')
    setIsDashboardMenuOpen(false)
  }
  const handleDashboardMenuToggle = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDashboardMenuOpen((current) => !current)
  }
  const handleNavGroupToggle = (event, groupId) => {
    event.preventDefault()
    event.stopPropagation()
    setOpenNavGroup((current) => (current === groupId ? '' : groupId))
  }

  const renderNavLabel = (label) => {
    const words = String(label || '').split(' ').filter(Boolean)
    if (words.length < 3) return label
    return <span className="nav-compact-label">{label}</span>
  }

  return (
    <header className="topbar" ref={topbarRef}>
      <div className="topbar-inner container">
        <Link className="brand" to="/" aria-label="Guardian Angel home">
          <img src={logo} alt="Guardian Angel logo" width="72" height="72" decoding="async" />
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
                  className={`nav-item-group ${item.isActive ? 'nav-active' : ''} ${
                    openNavGroup === item.id ? 'open' : ''
                  }`}
                  onMouseEnter={() => {
                    if (!isMobileMenuOpen) setOpenNavGroup(item.id)
                  }}
                  onMouseLeave={() => {
                    if (!isMobileMenuOpen) setOpenNavGroup('')
                  }}
                >
                  <button
                    type="button"
                    className="nav-group-trigger"
                    aria-expanded={openNavGroup === item.id}
                    aria-haspopup="true"
                    onClick={(event) => handleNavGroupToggle(event, item.id)}
                  >
                    {renderNavLabel(item.label)}
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
            {authUser ? (
              <div
                className={`nav-item-group nav-dashboard-group ${isDashboardRoute(location.pathname) ? 'nav-active' : ''} ${
                  isDashboardMenuOpen ? 'open' : ''
                }`}
                onMouseEnter={() => {
                  if (!isMobileMenuOpen) setIsDashboardMenuOpen(true)
                }}
                onMouseLeave={() => {
                  if (!isMobileMenuOpen) setIsDashboardMenuOpen(false)
                }}
              >
                <button
                  type="button"
                  className="btn btn-nav nav-dashboard-trigger"
                  aria-expanded={isDashboardMenuOpen}
                  aria-haspopup="true"
                  onClick={handleDashboardMenuToggle}
                >
                  Dashboard
                </button>
                <div className="nav-submenu nav-dashboard-submenu">
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-sub-link ${isActive ? 'nav-active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </NavLink>
                  {isSuperAdmin ? (
                    <NavLink
                      to="/admin"
                      className={({ isActive }) => `nav-sub-link ${isActive ? 'nav-active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      Admin Dashboard
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/profile"
                      className={({ isActive }) => `nav-sub-link ${isActive ? 'nav-active' : ''}`}
                      onClick={closeMobileMenu}
                    >
                      My Profile
                    </NavLink>
                  )}
                </div>
              </div>
            ) : (
              <Link className="btn btn-nav" to="/guardian-study-planner" onClick={closeMobileMenu}>
                Start Preparation
              </Link>
            )}
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
  const [introVideoOn, setIntroVideoOn] = useState(false)

  useEffect(() => {
    let idleId = 0
    let timeoutId = 0
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(() => setIntroVideoOn(true), { timeout: 2200 })
    } else if (typeof window !== 'undefined') {
      timeoutId = window.setTimeout(() => setIntroVideoOn(true), 600)
    }

    return () => {
      if (idleId && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal-on-scroll')
    if (revealItems.length === 0) return undefined

    // If something is already in the viewport on load, reveal it immediately (helps FCP/LCP).
    try {
      const viewportH = window.innerHeight || 800
      revealItems.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const intersects = rect.bottom >= 0 && rect.top <= viewportH * 1.05
        if (intersects) el.classList.add('is-visible')
      })
    } catch {
      // Ignore measurement errors; IntersectionObserver will still handle the rest.
    }

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
        <div className="intro-video intro-video--fit" aria-hidden="true">
          {introVideoOn ? (
            <video autoPlay loop muted playsInline preload="none" poster="/media/guardian-angel-intro-poster.webp">
              <source src="/media/guardian-angel-intro-720p.mp4" type="video/mp4" media="(max-width: 900px)" />
              <source src="/media/guardian-angel-intro-1080p.mp4" type="video/mp4" />
            </video>
          ) : null}
        </div>
        <div className="intro-overlay" aria-hidden="true" />

        <section className="hero container">
          <div className="hero-copy reveal-on-scroll">
            <h1>Empowering Pakistan’s Future Leaders</h1>
            <p className="subtext">
              Guardian Angel is an independent platform dedicated to helping CSS Jawans across
              Pakistan access premium quality education completely free of cost.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary hero-btn" to="/css-syllabus">
                Start with the syllabus
              </Link>
              <Link className="btn btn-secondary hero-btn hero-btn-ghost" to="/guardian-study-planner">
                Open Study Planner
              </Link>
            </div>
          </div>

          <dl className="hero-stats reveal-on-scroll">
            {HOME_STATS.map((stat) => (
              <div className="hero-stat" key={stat.label}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>

          <p className="hero-constitutional-note reveal-on-scroll">
            <span className="guardian-highlight-word">Article 25-A</span> of the Constitution of Pakistan promises free
            education. <span className="guardian-highlight-word">Guardian Angel</span> carries that promise to every
            CSS aspirant.
          </p>
        </section>
      </section>

      <main id="main-content">
        <section className="home-section container" id="resources">
          <header className="home-section-head reveal-on-scroll">
            <p className="home-eyebrow">Everything in one place</p>
            <h2>Your complete CSS toolkit</h2>
            <p className="home-section-lead">
              Authentic, organised and free. Pick up where you are and go further.
            </p>
          </header>
          <div className="home-resource-grid">
            {HOME_RESOURCES.map((item, index) => (
              <Link
                className="home-resource-card reveal-on-scroll"
                to={item.to}
                key={item.title}
                style={{ '--reveal-delay': `${index * 70}ms` }}
              >
                <span className="home-resource-icon" aria-hidden="true">
                  <HomeIcon name={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="home-resource-more" aria-hidden="true">
                  Explore <span className="home-arrow">→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-section container home-mission" id="mission">
          <div className="home-mission-copy reveal-on-scroll">
            <p className="home-eyebrow">Our mission</p>
            <h2>Knowledge is Priceless</h2>
            <p>
              Talent should never be limited by money. In Pakistan, thousands of brilliant students cannot afford
              expensive academies. Guardian Angel exists to bridge that gap.
            </p>
            <p>
              Our mission is to democratise CSS education by providing world class preparation resources free of cost,
              so every talented student, whatever their background, has the opportunity to compete.
            </p>
            <Link className="btn btn-secondary home-mission-link" to="/about-guardian-angel">
              Read Guardian&apos;s vision
            </Link>
          </div>
          <div className="home-pillars" id="why-guardian-angel">
            {pillars.map((item, index) => (
              <article
                className="home-pillar reveal-on-scroll"
                key={item.title}
                style={{ '--reveal-delay': `${index * 90}ms` }}
              >
                <span className="home-pillar-icon" aria-hidden="true">
                  <HomeIcon name={PILLAR_ICONS[index % PILLAR_ICONS.length]} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section container" id="how-to-prepare">
          <header className="home-section-head reveal-on-scroll">
            <p className="home-eyebrow">How to prepare</p>
            <h2>Three steps, one clear path</h2>
          </header>
          <ol className="home-steps">
            {HOME_STEPS.map((step, index) => (
              <li className="home-step reveal-on-scroll" key={step.title} style={{ '--reveal-delay': `${index * 100}ms` }}>
                <span className="home-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <Link className="home-step-link" to={step.to}>
                  {step.cta} <span className="home-arrow">→</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="home-section container" id="join">
          <div className="home-cta-band reveal-on-scroll">
            <div className="home-cta-copy">
              <p className="home-eyebrow">CSS is not just an examination</p>
              <h2>If you have the determination, Guardian Angel will provide the guidance.</h2>
              <p>
                It is a gateway to leadership, service and national impact. Start today on the web, or take Guardian
                Angel with you on Android.
              </p>
            </div>
            <div className="home-cta-actions">
              <Link className="btn btn-primary hero-btn" to="/css-syllabus">
                Browse the syllabus
              </Link>
              <Link className="btn btn-secondary hero-btn hero-btn-ghost" to="/css-rules">
                Read the CSS rules
              </Link>
              <a
                className="home-cta-play"
                href={GOOGLE_PLAY_APP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get CSS Guardian Angel on Google Play"
              >
                <img src="/google-play-badge.png" alt="" width="180" height="70" loading="lazy" />
              </a>
            </div>
          </div>
        </section>

        <section className="home-section container home-faq" id="css-faq">
          <header className="home-faq-head reveal-on-scroll">
            <p className="home-eyebrow">FAQ</p>
            <h2>CSS questions, answered</h2>
            <p className="home-section-lead">
              Straight answers on eligibility, planning, optional subjects and the right mindset.
            </p>
            <Link className="home-step-link" to="/blogs">
              More in the Guardian blogs <span className="home-arrow">→</span>
            </Link>
          </header>
          <HomeFaqAccordion />
        </section>
      </main>
    </>
  )
}

function HomeFaqAccordion() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const visibleFaqs = showAll ? homeFaqs : homeFaqs.slice(0, HOME_FAQ_INITIAL)

  return (
    <div className="home-faq-accordion">
      {visibleFaqs.map((faq, index) => {
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
      {homeFaqs.length > HOME_FAQ_INITIAL ? (
        <button className="home-faq-more" type="button" onClick={() => setShowAll((current) => !current)}>
          {showAll ? 'Show fewer questions' : `Show all ${homeFaqs.length} questions`}
        </button>
      ) : null}
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

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top container">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="Guardian Angel home">
            <img src={logo} alt="Guardian Angel logo" width="72" height="72" decoding="async" />
            <div>
              <strong>Guardian Angel</strong>
              <span>Knowledge Is Priceless</span>
            </div>
          </Link>
          <p className="footer-motto">Empowering Pakistan&apos;s Future Leaders</p>
        </div>

        <div className="footer-links">
          <h4>Explore</h4>
          <Link to="/css-syllabus">CSS Syllabus</Link>
          <Link to="/css-rules">CSS Rules</Link>
          <Link to="/css-past-papers">CSS Past Papers</Link>
          <Link to="/css-study-material">CSS Study Material</Link>
          <Link to="/key-documents">Key Documents</Link>
          <Link to="/guardian-english">Guardian English Lab</Link>
          <Link to="/guardian-conflict-atlas">Guardian Conflict Atlas</Link>
          <Link to="/guardian-study-planner">Guardian Study Planner</Link>
          <Link to="/guardian-portfolio">Guardian Portfolio</Link>
        </div>

        <div className="footer-links">
          <h4>About Guardian Angel</h4>
          <Link to="/about-guardian-angel">Guardian's Vision</Link>
          <Link to="/blogs">Guardian Blogs</Link>
        </div>

        <div className="footer-store">
          <h4 className="footer-store-heading">Mobile app</h4>
          <a
            className="footer-google-play-link"
            href={GOOGLE_PLAY_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get CSS Guardian Angel on Google Play"
          >
            <img
              className="footer-google-play-img"
              src="/google-play-badge.png"
              alt=""
              decoding="async"
              loading="lazy"
            />
          </a>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} Guardian Angel. All rights reserved.</p>
        <div className="footer-bottom-right">
          <nav className="footer-social" aria-label="Social media">
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="CSS Guardian Angel on Facebook"
            >
              <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                />
              </svg>
            </a>
            <a
              href={INSTAGRAM_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="CSS Guardian Angel on Instagram (@cssguardianangel)"
            >
              <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 11-2.881 0 1.44 1.44 0 012.881 0z"
                />
              </svg>
            </a>
            <a
              href={LINKEDIN_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="CSS Guardian Angel on LinkedIn"
            >
              <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                />
              </svg>
            </a>
            <a
              href={YOUTUBE_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label="CSS Guardian Angel on YouTube"
            >
              <svg className="footer-social-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                />
              </svg>
            </a>
          </nav>
          <nav className="footer-legal" aria-label="Legal">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/delete-account">Delete account</Link>
          </nav>
        </div>
      </div>
    </footer>
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
  if (pathname.startsWith('/blogs/')) {
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

  if (pathname.startsWith('/guardian-english')) {
    const moduleTitles = {
      grammar: 'Grammar Practice',
      punctuation: 'Punctuation Practice',
      'sentence-correction': 'Sentence Correction Practice',
      'pairs-of-words': 'Pairs of Words Practice',
      'synonyms-antonyms': 'Synonyms & Antonyms Practice',
      vocabulary: 'CSS Vocabulary Builder',
      'past-papers': 'CSS English Past Paper References',
    }
    const slug = pathname.split('/')[2] || ''
    return {
      title: moduleTitles[slug]
        ? `${moduleTitles[slug]} | Guardian English Lab`
        : 'Guardian English Lab | CSS English Practice',
      description:
        'Practice for the CSS English (Precis & Composition) paper: grammar, punctuation, sentence correction, pairs of words, synonyms and antonyms, vocabulary and FPSC past paper references with instant feedback.',
    }
  }

  if (pathname.startsWith('/p/')) {
    return {
      title: 'Guardian Portfolio | Guardian Angel',
      description:
        'View a public Guardian Angel portfolio with work samples, skills, and contact links shared by a signed-in member.',
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

const KNOWN_ROUTES = new Set([
  '/', '/pakistan-affairs', '/global-affairs', '/css-syllabus', '/css-rules', '/css-past-papers', '/css-study-material',
  '/key-documents', '/constitution-of-pakistan', '/about-guardian-angel', '/privacy-policy', '/terms', '/delete-account', '/blogs', '/blog', '/signin',
  '/payment', '/dashboard', '/guardian-study-planner', '/guardian-conflict-atlas', '/guardian-portfolio', '/guardian-portfolio/edit', '/guardian-portfolio/browse', '/guardian-portfolio/example', '/guardian-resume-builder', '/profile', '/admin',
])
const KNOWN_ROUTE_PREFIXES = ['/blogs/', '/blog/', '/css-syllabus/', '/p/', '/guardian-english']

function isKnownRoute(pathname) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return KNOWN_ROUTES.has(path) || KNOWN_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function SkipToContentLink() {
  const handleClick = (event) => {
    const main = document.querySelector('main')
    if (!main) return
    event.preventDefault()
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
    main.focus()
    main.scrollIntoView()
  }
  return (
    <a className="skip-link" href="#main-content" onClick={handleClick}>
      Skip to main content
    </a>
  )
}

function PageLoader() {
  return (
    <main className="page-main page-loader" aria-busy="true">
      <section className="container">
        <p className="page-loader-text">Loading…</p>
      </section>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="page-main" id="main-content">
      <section className="container not-found-page">
        <p className="kicker">404</p>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or has moved.</p>
        <div className="not-found-actions">
          <Link className="btn btn-primary" to="/">
            Go to home
          </Link>
          <Link className="btn btn-secondary" to="/css-syllabus">
            Browse the CSS syllabus
          </Link>
        </div>
      </section>
    </main>
  )
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
    upsertMetaTag('robots', isKnownRoute(location.pathname) ? 'index, follow, max-image-preview:large' : 'noindex, follow')

    upsertMetaTag('og:title', seo.title, 'property')
    upsertMetaTag('og:description', seo.description, 'property')
    upsertMetaTag('og:type', 'website', 'property')
    upsertMetaTag('og:url', canonicalUrl, 'property')
    upsertMetaTag('og:site_name', 'Guardian Angel', 'property')
    upsertMetaTag('og:image', `${SITE_URL}/og-image.jpg`, 'property')

    upsertMetaTag('twitter:card', 'summary_large_image')
    upsertMetaTag('twitter:title', seo.title)
    upsertMetaTag('twitter:description', seo.description)
    upsertMetaTag('twitter:image', `${SITE_URL}/og-image.jpg`)

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

function PlannerReminderPopup({ popup, onDismiss }) {
  if (!popup) return null
  return (
    <div className="planner-reminder-popup-overlay" role="dialog" aria-modal="true" onClick={onDismiss}>
      <article className="planner-reminder-popup-card" onClick={(event) => event.stopPropagation()}>
        <p className="planner-reminder-popup-kicker">Study slot reminder</p>
        <h4>{popup.title || 'Guardian Angel — study slot'}</h4>
        <p>{popup.body}</p>
        <button type="button" className="btn btn-primary" onClick={onDismiss}>
          Got it
        </button>
      </article>
    </div>
  )
}

function PasswordRecoveryRedirect() {
  const navigate = useNavigate()
  const location = useLocation()

  useLayoutEffect(() => {
    if (detectPasswordRecoveryFromUrl()) {
      markPasswordRecovery()
    }
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    const goToResetPage = () => {
      markPasswordRecovery()
      const hash = window.location.hash || ''
      const currentSearch = new URLSearchParams(window.location.search)
      const nextSearch = new URLSearchParams()
      nextSearch.set('mode', 'reset')
      const code = currentSearch.get('code')
      if (code) nextSearch.set('code', code)

      if (location.pathname === '/signin' && currentSearch.get('mode') === 'reset') {
        return
      }

      navigate(
        {
          pathname: '/signin',
          search: `?${nextSearch.toString()}`,
          hash,
        },
        { replace: true },
      )
    }

    if (detectPasswordRecoveryFromUrl() || isPasswordRecoveryPending()) {
      if (location.pathname !== '/signin' || new URLSearchParams(location.search).get('mode') !== 'reset') {
        goToResetPage()
      }
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        goToResetPage()
      }
    })

    return () => subscription.subscription.unsubscribe()
  }, [location.pathname, location.search, navigate])

  return null
}

function AuthGuardedStudyPlanner({ authUser, isAuthReady, fromPath }) {
  if (!isAuthReady) return null
  if (!authUser) {
    return <Navigate to="/signin" replace state={{ from: fromPath }} />
  }
  return <GuardianStudyPlannerPage authUser={authUser} />
}

function App() {
  const [authUser, setAuthUser] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
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
    let isCancelled = false

    const bootstrapSession = async () => {
      if (!supabase) {
        setIsAuthReady(true)
        return
      }
      const session = await ensureFreshSession()
      if (!isCancelled) {
        setAuthUser(mapSupabaseUserToAuthUser(session?.user || null))
        setIsAuthReady(true)
      }
    }

    bootstrapSession()

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        ensureFreshSession()
      }
    }

    const { data: subscription } = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          setAuthUser(mapSupabaseUserToAuthUser(session?.user || null))
          setIsAuthReady(true)
        })
      : { data: null }

    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      isCancelled = true
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      subscription?.subscription?.unsubscribe?.()
    }
  }, [])

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setAuthUser(null)
  }

  useRemoveVisibleWordHyphens()
  usePlannerReminderBootstrap(authUser)
  const { popup: plannerReminderPopup, dismissPopup: dismissPlannerReminderPopup } = usePlannerReminderPopup()

  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <SeoMetaManager />
      <PasswordRecoveryRedirect />
      <SkipToContentLink />
      <div className="site">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          authUser={authUser}
          onLogout={handleLogout}
        />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pakistan-affairs" element={<GlobalAffairsPage defaultTab="pakistan" />} />
          <Route path="/global-affairs" element={<GlobalAffairsPage defaultTab="global" />} />
          <Route path="/css-syllabus" element={<CssSyllabusPage />} />
          <Route path="/css-rules" element={<CssRulesPage />} />
          <Route path="/css-past-papers" element={<CssPastPapersPage />} />
          <Route path="/css-study-material" element={<CssStudyMaterialPage />} />
          <Route path="/key-documents" element={<KeyDocumentsPage />} />
          <Route path="/constitution-of-pakistan" element={<Navigate to="/key-documents" replace />} />
          <Route path="/about-guardian-angel" element={<AboutGuardianAngelPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/delete-account" element={<DeleteAccountPage />} />
          <Route path="/blogs" element={<BlogPage authUser={authUser} />} />
          <Route path="/blogs/:blogSlug" element={<BlogPage authUser={authUser} />} />
          <Route path="/blog" element={<Navigate to="/blogs" replace />} />
          <Route path="/blog/:blogSlug" element={<LegacyBlogSlugRedirect />} />
          <Route
            path="/signin"
            element={<SignInPage authUser={authUser} isAuthReady={isAuthReady} />}
          />
          <Route path="/payment" element={<Navigate to="/guardian-study-planner" replace />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuardedStudyPlanner
                authUser={authUser}
                isAuthReady={isAuthReady}
                fromPath="/dashboard"
              />
            }
          />
          <Route
            path="/guardian-study-planner"
            element={
              <AuthGuardedStudyPlanner
                authUser={authUser}
                isAuthReady={isAuthReady}
                fromPath="/guardian-study-planner"
              />
            }
          />
          <Route
            path="/guardian-portfolio"
            element={
              <Suspense fallback={<main className="page-main" />}>
                <PortfolioLanding authUser={authUser} />
              </Suspense>
            }
          />
          <Route
            path="/guardian-portfolio/browse"
            element={
              <Suspense fallback={<main className="page-main" />}>
                <PortfolioBrowse />
              </Suspense>
            }
          />
          <Route
            path="/guardian-portfolio/example"
            element={
              <Suspense fallback={<main className="page-main" />}>
                <PortfolioExample />
              </Suspense>
            }
          />
          <Route
            path="/guardian-portfolio/edit"
            element={
              !isAuthReady ? null : authUser ? (
                <Suspense
                  fallback={
                    <main className="page-main">
                      <section className="container">
                        <p>Loading Guardian Portfolio…</p>
                      </section>
                    </main>
                  }
                >
                  <GuardianPortfolioPage authUser={authUser} />
                </Suspense>
              ) : (
                <Navigate to="/signin" replace state={{ from: '/guardian-portfolio/edit' }} />
              )
            }
          />
          <Route
            path="/p/:slug"
            element={
              <Suspense
                fallback={
                  <main className="page-main">
                    <section className="container">
                      <p>Loading portfolio…</p>
                    </section>
                  </main>
                }
              >
                <GuardianPortfolioPublicPage />
              </Suspense>
            }
          />
          <Route path="/guardian-resume-builder" element={<Navigate to="/guardian-portfolio" replace />} />
          <Route
            path="/profile"
            element={
              !isAuthReady ? null : authUser ? (
                <ProfilePage authUser={authUser} />
              ) : (
                <Navigate to="/signin" replace state={{ from: '/profile' }} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              !isAuthReady ? null : authUser ? (
                <AdminDashboardPage authUser={authUser} />
              ) : (
                <Navigate to="/signin" replace state={{ from: '/admin' }} />
              )
            }
          />
          <Route path="/css-syllabus/:subjectSlug" element={<SubjectDetailPage />} />
          <Route
            path="/guardian-conflict-atlas"
            element={
              <Suspense fallback={<main className="page-main" />}>
                <ConflictAtlasPage />
              </Suspense>
            }
          />
          <Route path="/guardian-english" element={<GuardianEnglishPage authUser={authUser} />} />
          <Route path="/guardian-english/:module" element={<GuardianEnglishPage authUser={authUser} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        <Footer />
        <Suspense fallback={null}>
          <StickyNotesWidget authUser={authUser} />
        </Suspense>
        <BackToTopButton />
        <PlannerReminderPopup popup={plannerReminderPopup} onDismiss={dismissPlannerReminderPopup} />
        <PdfAppExperienceHost />
      </div>
    </BrowserRouter>
  )
}

export default App
