import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import '../styles/english.css'
import { useEnglishProgress, streakFrom, MASTERED_BOX } from '../english/englishStore.js'
import {
  CorrectionModule,
  GrammarModule,
  GroupingModule,
  PairsModule,
  PastPapersModule,
  PunctuationModule,
  VocabularyModule,
} from '../english/EnglishModules.jsx'

const ENGLISH_BASE = '/guardian-english'

export const ENGLISH_MODULES = [
  {
    slug: 'grammar',
    title: 'Grammar',
    section: 'Supports Q4 and Q5',
    text: '500+ questions on tenses, articles, prepositions, conjunctions, phrasal verbs, agreement, voice and narration. Short rules, then practice.',
    Component: GrammarModule,
  },
  {
    slug: 'punctuation',
    title: 'Punctuation',
    section: 'Q5 · Punctuation and prepositions',
    text: 'Commas, semicolons, colons, apostrophes and capitals, the marks FPSC uses in its correction questions.',
    Component: PunctuationModule,
  },
  {
    slug: 'sentence-correction',
    title: 'Sentence Correction',
    section: 'Q4 · 10 marks',
    text: '860+ sentences, including 200 set by FPSC from 2000 to 2026. Fix the error and see exactly what to add and remove.',
    Component: CorrectionModule,
  },
  {
    slug: 'pairs-of-words',
    title: 'Pairs of Words',
    section: 'Q6 · 10 marks',
    text: 'Commonly confused words such as principal and principle. Study the difference, then test yourself.',
    Component: PairsModule,
  },
  {
    slug: 'synonyms-antonyms',
    title: 'Synonyms & Antonyms',
    section: 'Q1 · 20 marks',
    text: 'Match words by similar or opposite meaning in 60+ sets, then try the real FPSC multiple-choice questions.',
    Component: GroupingModule,
  },
  {
    slug: 'vocabulary',
    title: 'Vocabulary',
    section: '1,000+ CSS words',
    text: 'A CSS word list with Urdu meanings and daily spaced-repetition review, so words come back just before you forget them.',
    Component: VocabularyModule,
  },
  {
    slug: 'past-papers',
    title: 'Past Paper References',
    section: 'FPSC English papers',
    text: 'What FPSC actually asked, year by year: sentences to correct, synonyms, prepositions and pairs, with official PDFs.',
    Component: PastPapersModule,
  },
]

/** Old links keep working after a module is renamed. */
const RENAMED_MODULES = { 'grouping-of-words': 'synonyms-antonyms' }

const PAPER_MAP = [
  { part: 'Q1 Synonyms and antonyms (MCQs)', marks: 20, to: 'synonyms-antonyms', label: 'Synonyms & Antonyms, Vocabulary' },
  { part: 'Q2 Précis writing', marks: 20, status: 'Coming soon' },
  { part: 'Q3 Reading comprehension', marks: 20, status: 'Coming soon' },
  { part: 'Q4 Sentence correction', marks: 10, to: 'sentence-correction', label: 'Sentence Correction, Grammar' },
  { part: 'Q5 Punctuation and prepositions', marks: 10, to: 'punctuation', label: 'Punctuation, Grammar' },
  { part: 'Q6 Pairs of words', marks: 10, to: 'pairs-of-words', label: 'Pairs of Words' },
  { part: 'Q7 Translation (Urdu to English)', marks: 10, status: 'Coming soon' },
]

function moduleProgress(slug, progress) {
  switch (slug) {
    case 'grammar': {
      const done = Object.values(progress.grammar)
      return done.length ? `${done.length} topics practised` : ''
    }
    case 'punctuation':
      return progress.punctuation.attempts ? `Best ${progress.punctuation.best}%` : ''
    case 'sentence-correction': {
      const solved = Object.keys(progress.correction.solved).length
      return solved ? `${solved} sentences solved` : ''
    }
    case 'pairs-of-words':
      return progress.pairs.attempts ? `Best ${progress.pairs.best}%` : ''
    case 'synonyms-antonyms': {
      const sets = Object.keys(progress.grouping).length
      return sets ? `${sets} sets played` : ''
    }
    case 'vocabulary': {
      const cards = Object.values(progress.vocabulary.cards)
      const mastered = cards.filter((c) => c.box >= MASTERED_BOX).length
      return cards.length ? `${cards.length} words started · ${mastered} mastered` : ''
    }
    default:
      return ''
  }
}

function SyncNote({ store }) {
  if (!store.isSignedIn) {
    return (
      <p className="ge-sync">
        Progress is saved on this device. <Link to="/signin" state={{ from: ENGLISH_BASE }}>Sign in</Link> to keep it on every
        device.
      </p>
    )
  }
  if (store.syncState === 'synced') return <p className="ge-sync">Progress synced to your account.</p>
  if (store.syncState === 'loading') return <p className="ge-sync">Loading your progress…</p>
  return <p className="ge-sync">Progress is saved on this device.</p>
}

function EnglishHub({ store }) {
  const { progress } = store
  const accuracy = progress.totals.answered ? Math.round((progress.totals.correct / progress.totals.answered) * 100) : null
  const streak = streakFrom(progress.activityDays)
  return (
    <>
      <div className="ge-stat-row ge-hub-stats">
        <div className="ge-stat">
          <strong>{streak}</strong>
          <span>day streak</span>
        </div>
        <div className="ge-stat">
          <strong>{progress.totals.answered}</strong>
          <span>answers</span>
        </div>
        <div className="ge-stat">
          <strong>{accuracy === null ? '—' : `${accuracy}%`}</strong>
          <span>accuracy</span>
        </div>
      </div>
      <SyncNote store={store} />

      <div className="ge-grid ge-module-grid">
        {ENGLISH_MODULES.map((m) => {
          const note = moduleProgress(m.slug, progress)
          return (
            <Link className="ge-card ge-module-card" to={`${ENGLISH_BASE}/${m.slug}`} key={m.slug}>
              <p className="ge-module-section">{m.section}</p>
              <h3>{m.title}</h3>
              <p>{m.text}</p>
              <div className="ge-card-foot">
                <span className="ge-muted">{note || 'Start practising'}</span>
                <span className="ge-arrow" aria-hidden="true">
                  →
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      <section className="ge-paper">
        <h3 className="ge-topic-title">How the Lab maps to the English (Precis &amp; Composition) paper</h3>
        <div className="ge-table-wrap">
          <table className="ge-table">
            <thead>
              <tr>
                <th scope="col">Paper section</th>
                <th scope="col">Marks</th>
                <th scope="col">Practise here</th>
              </tr>
            </thead>
            <tbody>
              {PAPER_MAP.map((row) => (
                <tr key={row.part}>
                  <td>{row.part}</td>
                  <td>
                    <span className="ge-marks">{row.marks}</span>
                  </td>
                  <td>
                    {row.to ? (
                      <Link className="ge-table-link" to={`${ENGLISH_BASE}/${row.to}`}>
                        {row.label} <span aria-hidden="true">→</span>
                      </Link>
                    ) : (
                      <span className="ge-soon">{row.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ge-paper-cta">
          <div>
            <p className="ge-paper-cta-title">Built on the real FPSC papers</p>
            <p className="ge-paper-cta-text">
              The layout above follows the English (Precis &amp; Composition) papers of 2024 to 2026, 100 marks in all. See
              exactly what FPSC asked, year by year, from 1972 to 2026.
            </p>
          </div>
          <Link className="btn btn-primary" to={`${ENGLISH_BASE}/past-papers`}>
            See what each paper asked →
          </Link>
        </div>
      </section>
    </>
  )
}

export default function GuardianEnglishPage({ authUser }) {
  const { module: slug } = useParams()
  const { search } = useLocation()
  const store = useEnglishProgress(authUser)
  const current = slug ? ENGLISH_MODULES.find((m) => m.slug === slug) : null
  if (slug && RENAMED_MODULES[slug]) return <Navigate to={`${ENGLISH_BASE}/${RENAMED_MODULES[slug]}${search}`} replace />
  if (slug && !current) return <Navigate to={ENGLISH_BASE} replace />

  return (
    <main className="page-main ge-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>{current ? 'Guardian English Lab' : 'Guardian Angel Resources'}</p>
          <h2>{current ? current.title : 'Guardian English Lab'}</h2>
        </div>
        {current ? (
          <>
            <nav className="ge-crumbs" aria-label="Breadcrumb">
              <Link to={ENGLISH_BASE}>English Lab</Link>
              <span aria-hidden="true">/</span>
              <span>{current.title}</span>
              <span className="ge-crumb-section">{current.section}</span>
            </nav>
            <current.Component store={store} />
          </>
        ) : (
          <>
            <p className="ge-lead">
              Practice for the CSS English (Precis &amp; Composition) paper. Learn the rule, practise it and get
              instant feedback, with real FPSC questions from past papers. No sign-up needed.
            </p>
            <section className="ge-guide" id="ge-guide" aria-labelledby="ge-guide-title">
              <div className="ge-guide-copy">
                <p className="ge-guide-kicker">Video guide · 2 min</p>
                <h3 id="ge-guide-title">Master the CSS English paper, 15 minutes a day</h3>
                <p>
                  Every module in under two minutes: the FPSC Past Paper Questions, grammar, sentence correction, synonyms and
                  antonyms, the 1,082-word vocabulary builder and the past paper references.
                </p>
              </div>
              <video className="ge-guide-video" controls preload="none" playsInline poster="/media/english-lab-guide-poster.webp">
                <source src="/media/english-lab-guide.mp4" type="video/mp4" />
                Your browser cannot play this video.
              </video>
            </section>
            <EnglishHub store={store} />
          </>
        )}
      </section>
    </main>
  )
}
