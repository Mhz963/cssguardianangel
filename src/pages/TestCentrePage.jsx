import VideoGuide from '../components/VideoGuide.jsx'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/testcentre.css'
import ExamRunner from '../mcq/ExamRunner.jsx'
import { loadBanks, prepare, readProgress, sampleByAreas, saveResult, shuffle, useJson } from '../mcq/mcqData.js'

const SIZES = [10, 20, 50]

function MptCard({ mpt, onStart, busy }) {
  return (
    <article className="tc-hero-card">
      <p className="tc-kicker">CSS screening test</p>
      <h3>Full MPT mock</h3>
      <p className="tc-muted">
        {mpt.questions} questions in {mpt.minutes} minutes, weighted like the real test. Pass mark {mpt.passPercent}%
        {mpt.negativeMarking ? `; ${mpt.negativeMarking} mark deducted per wrong answer` : '; no negative marking'}.
      </p>
      <ul className="tc-areas">
        {mpt.areas.map((a) => (
          <li key={a.id} className={a.banks?.length ? '' : 'is-missing'}>
            <span>
              {a.label}
              {a.banks?.length ? null : <em> · not in this mock yet</em>}
            </span>
            <b>{a.percent}%</b>
          </li>
        ))}
      </ul>
      {mpt.areas.some((a) => !a.banks?.length) ? (
        <p className="tc-muted">
          Areas marked “not in this mock yet” have no question bank here, so the mock scales up the other areas to fill
          all {mpt.questions} questions.
        </p>
      ) : null}
      <div className="tc-actions">
        <button type="button" className="btn btn-primary" onClick={() => onStart(mpt.questions)} disabled={busy}>
          Start full mock
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => onStart(50)} disabled={busy}>
          Quick 50-question mock
        </button>
      </div>
      {mpt.source ? (
        <p className="tc-src">
          Pattern from{' '}
          <a href={Array.isArray(mpt.source) ? mpt.source[0] : mpt.source} target="_blank" rel="noopener noreferrer">
            FPSC
          </a>
          .
        </p>
      ) : null}
    </article>
  )
}

export default function TestCentrePage() {
  const { data: index, error } = useJson('/mcq/index.json')
  const [session, setSession] = useState(null)
  const [busy, setBusy] = useState(false)
  const [bankId, setBankId] = useState('')
  const [topic, setTopic] = useState('')
  const [size, setSize] = useState(20)
  const [realOnly, setRealOnly] = useState(false)
  const [progress, setProgress] = useState(() => readProgress())

  const bank = index?.banks.find((b) => b.id === bankId)
  const accuracy = (id) => {
    const b = progress.banks[id]
    return b?.answered ? Math.round((b.correct / b.answered) * 100) : null
  }
  const totalQuestions = index?.banks.reduce((n, b) => n + b.count, 0) || 0
  const realTotal = index?.banks.reduce((n, b) => n + (b.real || 0), 0) || 0

  const start = async (builder) => {
    setBusy(true)
    try {
      const s = await builder()
      if (s.questions.length) {
        setSession({ ...s, key: Date.now() })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } finally {
      setBusy(false)
    }
  }

  const startMock = (count) =>
    start(async () => {
      const mpt = index.mpt
      const pool = await loadBanks([...new Set(mpt.areas.flatMap((a) => a.banks))])
      const minutes = Math.round((mpt.minutes * count) / mpt.questions)
      return {
        kind: 'mock',
        title: count === mpt.questions ? 'MPT full mock' : `MPT quick mock (${count})`,
        mode: 'exam',
        minutes,
        negative: mpt.negativeMarking || 0,
        passPercent: mpt.passPercent,
        areas: mpt.areas,
        questions: prepare(sampleByAreas(pool, mpt.areas, count)),
        rebuild: () => startMock(count),
      }
    })

  const startPractice = () =>
    start(async () => {
      const pool = (await loadBanks([bankId])).filter(
        (q) => (!topic || q.topic === topic) && (!realOnly || (q.source && q.source !== 'practice')),
      )
      return {
        kind: 'practice',
        title: `${bank.label}${topic ? ` · ${topic}` : ''}`,
        mode: 'practice',
        questions: prepare(shuffle(pool).slice(0, size)),
        rebuild: startPractice,
      }
    })

  const startPaper = (paper) =>
    start(async () => {
      const pool = (await loadBanks([paper.bank])).filter((q) => q.source === paper.source)
      return {
        kind: 'paper',
        title: paper.source,
        mode: 'exam',
        minutes: Math.max(10, Math.round(pool.length * 0.75)),
        questions: prepare(pool),
        rebuild: () => startPaper(paper),
      }
    })

  const startMistakes = () =>
    start(async () => {
      const ids = new Set(progress.mistakes)
      const pool = (await loadBanks(index.banks.map((b) => b.id))).filter((q) => ids.has(q.id))
      return { kind: 'mistakes', title: 'Review my mistakes', mode: 'practice', questions: prepare(shuffle(pool).slice(0, 30)), rebuild: startMistakes }
    })

  const papersByBank = useMemo(() => {
    const groups = {}
    ;(index?.papers || []).forEach((p) => {
      ;(groups[p.bankLabel] = groups[p.bankLabel] || []).push(p)
    })
    return Object.entries(groups)
  }, [index])

  if (session) {
    return (
      <main className="page-main tc-page" id="main-content">
        <section className="container">
          <ExamRunner
            key={session.key}
            title={session.title}
            questions={session.questions}
            mode={session.mode}
            minutes={session.minutes}
            negative={session.negative}
            passPercent={session.passPercent}
            areas={session.areas}
            onExit={() => setSession(null)}
            onRetry={() => session.rebuild()}
            onFinish={(result) => setProgress(saveResult(result, session.kind === 'mock' ? 'mock' : 'practice'))}
          />
        </section>
      </main>
    )
  }

  return (
    <main className="page-main tc-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>Guardian Angel Resources</p>
          <h2>Guardian Test Centre</h2>
        </div>
        <p className="tc-lead">
          MCQ practice for the CSS screening test (MPT) and the objective part of every compulsory paper: timed mocks, practice
          by subject and topic with explanations, and real FPSC MCQs from past papers.
          {index ? ` ${totalQuestions.toLocaleString()} questions, ${realTotal} of them from FPSC papers.` : ''}
        </p>

        <VideoGuide
          id="tc-guide"
          src="/media/test-centre-tutorial.mp4"
          poster="/media/test-centre-tutorial-poster.webp"
          title="How to use the Test Centre"
          duration="2 min"
        >
          The MPT pattern, taking a timed mock, reading your results by area, and daily practice by subject.
        </VideoGuide>

        {error ? <p className="tc-error">The question bank could not be loaded. Please try again.</p> : null}
        {!index && !error ? <p className="tc-muted">Loading the question bank…</p> : null}

        {index ? (
          <>
            <div className="tc-top">
              {index.mpt ? <MptCard mpt={index.mpt} onStart={startMock} busy={busy} /> : null}
              <article className="tc-side-card">
                <h3>Your progress</h3>
                {progress.mocks.length ? (
                  <ul className="tc-history">
                    {progress.mocks.slice(0, 4).map((m) => (
                      <li key={m.date}>
                        <span>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <b>
                          {Math.round((m.score / m.total) * 100)}% ({m.score}/{m.total})
                        </b>
                        {m.passed === null ? null : <span className={m.passed ? 'ok' : 'low'}>{m.passed ? 'Pass' : 'Below pass'}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tc-muted">Take a mock or a practice set and your scores appear here. Saved on this device.</p>
                )}
                <button type="button" className="btn btn-secondary" onClick={startMistakes} disabled={busy || !progress.mistakes.length}>
                  Review my mistakes{progress.mistakes.length ? ` (${progress.mistakes.length})` : ''}
                </button>
              </article>
            </div>

            <section className="tc-section" aria-labelledby="tc-practice">
              <h3 id="tc-practice">Practise by subject</h3>
              <div className="tc-banks">
                {index.banks.map((b) => {
                  const acc = accuracy(b.id)
                  return (
                    <button
                      type="button"
                      key={b.id}
                      className={`tc-bank ${bankId === b.id ? 'is-active' : ''}`}
                      onClick={() => {
                        setBankId(bankId === b.id ? '' : b.id)
                        setTopic('')
                        setRealOnly(false)
                      }}
                      aria-pressed={bankId === b.id}
                    >
                      <strong>{b.label}</strong>
                      <span>
                        {b.count} questions{b.real ? ` · ${b.real} from FPSC` : ''}
                      </span>
                      {acc !== null ? <span className="tc-acc">Your accuracy {acc}%</span> : null}
                    </button>
                  )
                })}
              </div>
              {bank ? (
                <div className="tc-setup">
                  <label>
                    <span>Topic</span>
                    <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                      <option value="">All topics ({bank.count})</option>
                      {bank.topics.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.count})
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="tc-sizes" role="group" aria-label="Number of questions">
                    {SIZES.map((n) => (
                      <button type="button" key={n} className={size === n ? 'is-active' : ''} onClick={() => setSize(n)}>
                        {n}
                      </button>
                    ))}
                  </div>
                  {bank.real ? (
                    <label className="tc-check">
                      <input type="checkbox" checked={realOnly} onChange={(e) => setRealOnly(e.target.checked)} /> FPSC past-paper
                      questions only
                    </label>
                  ) : null}
                  <button type="button" className="btn btn-primary" onClick={startPractice} disabled={busy}>
                    Start practice
                  </button>
                </div>
              ) : null}
            </section>

            {papersByBank.length ? (
              <section className="tc-section" aria-labelledby="tc-papers">
                <h3 id="tc-papers">Real FPSC MCQs by paper</h3>
                <p className="tc-muted">The objective part of each paper as FPSC set it, timed like the exam. Answers are Guardian Angel&apos;s key; FPSC does not publish one.</p>
                <div className="tc-papers">
                  {papersByBank.map(([label, list]) => (
                    <div key={label} className="tc-paper-group">
                      <h4>{label}</h4>
                      <div className="tc-paper-buttons">
                        {list
                          .sort((a, b) => b.year - a.year)
                          .map((p) => (
                            <button type="button" key={p.source} onClick={() => startPaper(p)} disabled={busy} title={p.source}>
                              {p.year}
                              <span>{p.count} MCQs</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="tc-section tc-more">
              <Link to="/guardian-english">English Lab for vocabulary and grammar →</Link>
              <Link to="/css-past-papers/topic-wise">Topic-wise written past papers →</Link>
              <Link to="/guardian-news-desk">Current affairs on the News Desk →</Link>
            </section>
          </>
        ) : null}
      </section>
    </main>
  )
}
