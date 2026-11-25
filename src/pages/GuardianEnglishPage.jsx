import { Link, Navigate, useParams } from 'react-router-dom'
import '../styles/english.css'
import { useEnglishProgress, streakFrom, MASTERED_BOX } from '../english/englishStore.js'
import {
  CorrectionModule,
  GrammarModule,
  GroupingModule,
  PairsModule,
  PunctuationModule,
  VocabularyModule,
} from '../english/EnglishModules.jsx'

const ENGLISH_BASE = '/guardian-english'

export const ENGLISH_MODULES = [
  {
    slug: 'grammar',
    title: 'Grammar',
    section: 'Grammar & Vocabulary · 20 marks',
    text: 'Tenses, articles, prepositions, conjunctions, phrasal verbs, agreement, voice and narration. Short rules, then practice.',
    Component: GrammarModule,
  },
  {
    slug: 'punctuation',
    title: 'Punctuation',
    section: 'Grammar & Sentence Correction',
    text: 'Commas, semicolons, colons, apostrophes and capitals, the marks FPSC uses in its correction questions.',
    Component: PunctuationModule,
  },
  {
    slug: 'sentence-correction',
    title: 'Sentence Correction',
    section: 'Sentence Correction · 10 marks',
    text: 'Fix one clear error in each sentence, changing nothing else. See exactly what to add and remove.',
    Component: CorrectionModule,
  },
  {
    slug: 'pairs-of-words',
    title: 'Pairs of Words',
    section: 'Pairs of Words · 10 marks',
    text: 'Commonly confused words such as principal and principle. Study the difference, then test yourself.',
    Component: PairsModule,
  },
  {
    slug: 'grouping-of-words',
    title: 'Grouping of Words',
    section: 'Grouping of Words · 10 marks',
    text: 'Pair twenty words by similar or opposite meaning, exactly as the paper asks.',
    Component: GroupingModule,
  },
  {
    slug: 'vocabulary',
    title: 'Vocabulary',
    section: 'Synonyms, antonyms & usage',
    text: 'A CSS word list with daily spaced-repetition review, so words come back just before you forget them.',
    Component: VocabularyModule,
  },
]

const PAPER_MAP = [
  { part: 'Precis writing', marks: 20, status: 'Coming soon' },
  { part: 'Reading comprehension', marks: 20, status: 'Coming soon' },
  { part: 'Grammar & vocabulary', marks: 20, to: 'grammar', label: 'Grammar, Punctuation, Vocabulary' },
  { part: 'Sentence correction', marks: 10, to: 'sentence-correction', label: 'Sentence Correction' },
  { part: 'Grouping of words', marks: 10, to: 'grouping-of-words', label: 'Grouping of Words' },
  { part: 'Pairs of words', marks: 10, to: 'pairs-of-words', label: 'Pairs of Words' },
  { part: 'Translation (Urdu to English)', marks: 10, status: 'Coming soon' },
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
    case 'grouping-of-words': {
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
                  <td>{row.marks}</td>
                  <td>
                    {row.to ? (
                      <Link to={`${ENGLISH_BASE}/${row.to}`}>{row.label}</Link>
                    ) : (
                      <span className="ge-muted">{row.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ge-muted">
          Based on the FPSC syllabus for English (Precis &amp; Composition), 100 marks. Practise with{' '}
          <Link to="/css-past-papers">real FPSC past papers</Link> too.
        </p>
      </section>
    </>
  )
}

export default function GuardianEnglishPage({ authUser }) {
  const { module: slug } = useParams()
  const store = useEnglishProgress(authUser)
  const current = slug ? ENGLISH_MODULES.find((m) => m.slug === slug) : null
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
              Free practice for the CSS English (Precis &amp; Composition) paper. Learn the rule, practise it and get
              instant feedback. No sign-up needed.
            </p>
            <EnglishHub store={store} />
          </>
        )}
      </section>
    </main>
  )
}
