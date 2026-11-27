import VideoGuide from '../components/VideoGuide.jsx'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../styles/pptopics.css'

const cache = new Map()
/** index.json is always revalidated; data files are cached by the version the index names. */
function loadJson(path, version) {
  const key = `${path}?v=${version || ''}`
  if (!cache.has(key)) {
    const p = fetch(version ? `${path}?v=${version}` : path, { cache: version ? 'force-cache' : 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json()
    })
    p.catch(() => cache.delete(key))
    cache.set(key, p)
  }
  return cache.get(key)
}

function useJson(path, version) {
  const [state, setState] = useState({ data: null, error: false })
  useEffect(() => {
    if (!path) return undefined
    let live = true
    loadJson(path, version)
      .then((data) => live && setState({ data, error: false }))
      .catch(() => live && setState({ data: null, error: true }))
    return () => {
      live = false
    }
  }, [path, version])
  return path ? state : { data: null, error: false }
}

function heat(n, max) {
  if (!n) return 0
  return Math.min(4, Math.ceil((n / Math.max(1, max)) * 4))
}

function Practice({ question, essay, onClose, onNext }) {
  const minutes = essay ? 30 : question.marks && question.marks >= 20 ? 30 : 15
  const [left, setLeft] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running || left <= 0) return undefined
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [running, left])
  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0')
  const ss = String(Math.max(0, left % 60)).padStart(2, '0')
  return (
    <div className="ppt-practice" role="dialog" aria-label="Practice question">
      <div className="ppt-practice-head">
        <span className="ppt-year">
          CSS {question.year}
          {question.paper ? ` · ${question.paper}` : ''} · {question.number}
        </span>
        <button type="button" className="ppt-close" onClick={onClose} aria-label="Close practice">
          ×
        </button>
      </div>
      <p className="ppt-practice-q">{question.text}</p>
      <div className={`ppt-timer ${left <= 0 ? 'is-done' : ''}`}>
        <strong>
          {mm}:{ss}
        </strong>
        <span>
          {left <= 0
            ? 'Time is up. Review your outline against the syllabus topic.'
            : essay
              ? 'Plan your outline in 30 minutes (the full essay paper allows 3 hours)'
              : question.marks
                ? `Suggested time for a ${question.marks}-mark answer`
                : 'Suggested time for one answer'}
        </span>
      </div>
      <div className="ppt-practice-actions">
        <button type="button" className="btn btn-primary" onClick={() => setRunning(!running)} disabled={left <= 0}>
          {running ? 'Pause' : left === minutes * 60 ? 'Start timer' : 'Resume'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onNext}>
          Another question
        </button>
      </div>
      <p className="ppt-muted">
        {essay
          ? 'Write a thesis statement, then an outline of 12–15 points: background, arguments with evidence, counter-arguments, way forward and conclusion.'
          : 'Write an outline: introduction with a clear thesis, 5–7 headings, evidence (dates, data, documents) and a conclusion.'}
      </p>
    </div>
  )
}

function SubjectView({ meta, version }) {
  const { data, error } = useJson(`/past-papers/${meta.subject}.json`, version)
  const [topic, setTopic] = useState('')
  const [year, setYear] = useState(0)
  const [query, setQuery] = useState('')
  const [practice, setPractice] = useState(null)

  const stats = useMemo(() => {
    if (!data) return null
    const years = [...new Set(data.questions.map((q) => q.year))].sort((a, b) => a - b)
    const byTopic = data.topics.map((t) => {
      const qs = data.questions.filter((q) => q.topics.includes(t.id))
      const perYear = Object.fromEntries(years.map((y) => [y, qs.filter((q) => q.year === y).length]))
      const yearsAsked = years.filter((y) => perYear[y])
      return { ...t, total: qs.length, perYear, yearsAsked: yearsAsked.length, last: yearsAsked[yearsAsked.length - 1] || null }
    })
    byTopic.sort((a, b) => b.yearsAsked - a.yearsAsked || b.total - a.total)
    const maxCell = Math.max(1, ...byTopic.flatMap((t) => Object.values(t.perYear)))
    return { years, byTopic, maxCell }
  }, [data])

  if (error) return <p className="ppt-error">This subject could not be loaded. Please try again.</p>
  if (!data || !stats) return <p className="ppt-muted">Loading questions…</p>

  const topicTitle = Object.fromEntries(data.topics.map((t) => [t.id, t.title]))
  const q = query.trim().toLowerCase()
  const list = data.questions
    .filter((x) => (!topic || x.topics.includes(topic)) && (!year || x.year === year) && (!q || x.text.toLowerCase().includes(q)))
    .sort((a, b) => b.year - a.year || String(a.paper).localeCompare(String(b.paper)) || a.id.localeCompare(b.id, undefined, { numeric: true }))
  const pickRandom = () => {
    const pool = list.length ? list : data.questions
    setPractice(pool[Math.floor(Math.random() * pool.length)])
  }
  const sources = data.papers.filter((p) => p.source)
  const officialYears = data.papers.filter((p) => p.official).map((p) => p.year)

  return (
    <div className="ppt-subject">
      <div className="ppt-subject-head">
        <div>
          <Link className="ppt-back" to="/css-past-papers/topic-wise">
            ← All subjects
          </Link>
          <h3>{data.title}</h3>
          <p className="ppt-muted">
            {data.questions.length} questions from {stats.years.length} papers, {stats.years[0]}–{stats.years[stats.years.length - 1]},
            mapped to {data.topics.length} syllabus topics.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={pickRandom}>
          Practise a random question
        </button>
      </div>

      <section className="ppt-block" aria-labelledby="ppt-top">
        <h4 id="ppt-top">Most-asked topics</h4>
        <ol className="ppt-rank">
          {stats.byTopic.slice(0, 6).map((t) => (
            <li key={t.id}>
              <button type="button" className={topic === t.id ? 'is-active' : ''} onClick={() => setTopic(topic === t.id ? '' : t.id)}>
                <strong>{t.title}</strong>
                <span className="ppt-bar" aria-hidden="true">
                  <span style={{ width: `${(t.yearsAsked / stats.years.length) * 100}%` }} />
                </span>
                <span className="ppt-muted">
                  Asked in {t.yearsAsked} of {stats.years.length} years · {t.total} questions{t.last ? ` · last in ${t.last}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="ppt-block" aria-labelledby="ppt-heat">
        <h4 id="ppt-heat">Topic × year heatmap</h4>
        <p className="ppt-muted">Each cell counts the questions on that topic in that year. Tap a topic to see its questions.</p>
        <div className="ppt-heat-wrap">
          <table className="ppt-heat">
            <thead>
              <tr>
                <th scope="col">Topic</th>
                {stats.years.map((y) => (
                  <th scope="col" key={y}>
                    {String(y).slice(2)}
                  </th>
                ))}
                <th scope="col">Σ</th>
              </tr>
            </thead>
            <tbody>
              {stats.byTopic.map((t) => (
                <tr key={t.id} className={topic === t.id ? 'is-active' : ''}>
                  <th scope="row">
                    <button type="button" onClick={() => setTopic(topic === t.id ? '' : t.id)} title={t.syllabus || t.title}>
                      {t.title}
                    </button>
                  </th>
                  {stats.years.map((y) => (
                    <td key={y} className={`h${heat(t.perYear[y], stats.maxCell)}`} title={`${t.title}, ${y}: ${t.perYear[y]}`}>
                      {t.perYear[y] || ''}
                    </td>
                  ))}
                  <td className="ppt-total">{t.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ppt-block" aria-labelledby="ppt-qs">
        <div className="ppt-qs-head">
          <h4 id="ppt-qs">{topic ? topicTitle[topic] : 'All questions'}</h4>
          <span className="ppt-muted">{list.length} questions</span>
        </div>
        <div className="ppt-filters">
          <input
            type="search"
            className="ppt-search"
            placeholder="Search question text, e.g. Kashmir, CPEC, Seerah"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search questions"
          />
          <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
            <option value="">All topics</option>
            {stats.byTopic.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.total})
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
            <option value={0}>All years</option>
            {[...stats.years].reverse().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <ol className="ppt-list">
          {list.map((x) => (
            <li key={x.id}>
              <div className="ppt-q-meta">
                <span className="ppt-year">CSS {x.year}</span>
                {x.paper ? <span>{x.paper}</span> : null}
                <span>{x.number}</span>
                {x.marks ? <span>{x.marks} marks</span> : null}
              </div>
              <p>{x.text}</p>
              <div className="ppt-q-foot">
                <span className="ppt-tags">
                  {x.topics.map((t) => (
                    <button type="button" key={t} onClick={() => setTopic(t)}>
                      {topicTitle[t] || t}
                    </button>
                  ))}
                </span>
                <button type="button" className="ppt-link" onClick={() => setPractice(x)}>
                  Practise this →
                </button>
              </div>
            </li>
          ))}
        </ol>
        {!list.length ? <p className="ppt-muted">No questions match.</p> : null}
      </section>

      <p className="ppt-sources">
        Questions are reproduced from FPSC CSS papers{officialYears.length ? ` (official FPSC copies for ${officialYears.join(', ')})` : ''}
        {sources.length > officialYears.length ? '; earlier years from published transcriptions of the papers' : ''}. Topic tags
        follow the FPSC syllabus and are Guardian Angel&apos;s classification.
      </p>

      {practice ? (
        <div className="ppt-overlay" onClick={() => setPractice(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <Practice key={practice.id} question={practice} essay={meta.subject === 'essay'} onClose={() => setPractice(null)} onNext={pickRandom} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function PastPaperTopicsPage() {
  const [params] = useSearchParams()
  const subjectId = params.get('subject') || ''
  const { data: index, error } = useJson('/past-papers/index.json')
  const meta = index?.subjects.find((s) => s.subject === subjectId)

  return (
    <main className="page-main ppt-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>CSS Resource Library</p>
          <h2>Topic-wise Past Papers</h2>
        </div>
        <nav className="ppt-crumbs" aria-label="Past papers">
          <Link to="/css-past-papers">Past papers by year (PDF)</Link>
          <span aria-hidden="true">·</span>
          <span className="is-current">By topic</span>
        </nav>

        {error ? <p className="ppt-error">Past papers could not be loaded. Please try again.</p> : null}
        {!index && !error ? <p className="ppt-muted">Loading…</p> : null}

        {index && meta ? <SubjectView key={meta.subject} meta={meta} version={index.version} /> : null}

        {index && !meta ? (
          <>
            <p className="ppt-lead">
              Every question FPSC has set, sorted by syllabus topic. See which topics come back year after year, read all the
              questions on a topic in one place, and practise against the clock.
            </p>
            <VideoGuide
              id="ppt-guide"
              src="/media/topic-wise-past-papers-tutorial.mp4"
              poster="/media/topic-wise-past-papers-tutorial-poster.webp"
              title="Stop guessing: see the topics FPSC repeats every year"
              duration="2 min"
            >
              Find the most-asked topics, read every question on a topic in one place, and practise your answers against the clock.
            </VideoGuide>
            <div className="ppt-subjects">
              {index.subjects.map((s) => (
                <Link className="ppt-subject-card" key={s.subject} to={`/css-past-papers/topic-wise?subject=${s.subject}`}>
                  <span className="ppt-card-kicker">{s.group}</span>
                  <strong>{s.title}</strong>
                  <span className="ppt-card-stats">
                    <span>
                      <b>{s.questions}</b> questions
                    </span>
                    <span>
                      <b>{s.years}</b> papers
                    </span>
                    <span>
                      {s.from}–{s.to}
                    </span>
                  </span>
                  {s.topTopics?.length ? (
                    <span className="ppt-card-top">Most asked: {s.topTopics.join(' · ')}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
