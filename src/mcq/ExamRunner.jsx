import { useEffect, useMemo, useState } from 'react'

const KEYS = ['A', 'B', 'C', 'D']

function fmt(seconds) {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function score(questions, answers, negative) {
  let correct = 0
  let wrong = 0
  questions.forEach((q, i) => {
    if (answers[i] === undefined) return
    if (answers[i] === q.answer) correct += 1
    else wrong += 1
  })
  const raw = correct - wrong * (negative || 0)
  return { correct, wrong, skipped: questions.length - correct - wrong, score: Math.max(0, Math.round(raw * 100) / 100) }
}

function Results({ title, questions, answers, negative, passPercent, areas, onRetry, onExit, onFinish }) {
  const s = useMemo(() => score(questions, answers, negative), [questions, answers, negative])
  const pct = Math.round((s.score / questions.length) * 100)
  const passed = passPercent ? pct >= passPercent : null
  const [onlyWrong, setOnlyWrong] = useState(true)
  useEffect(() => {
    onFinish?.({
      score: s.score,
      total: questions.length,
      passed,
      items: questions.map((q, i) => ({ q, choice: answers[i] })),
    })
    // run once when results first show
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const byArea = areas?.length
    ? areas
        .map((a) => {
          const idx = questions.map((q, i) => [q, i]).filter(([q]) => q.area === a.id)
          const c = idx.filter(([q, i]) => answers[i] === q.answer).length
          return { ...a, total: idx.length, correct: c }
        })
        .filter((a) => a.total)
    : []
  const review = questions.map((q, i) => ({ q, i, choice: answers[i] })).filter((r) => !onlyWrong || r.choice !== r.q.answer)

  return (
    <div className="tc-results">
      <div className={`tc-score ${passed === null ? '' : passed ? 'is-pass' : 'is-fail'}`}>
        <span className="tc-score-pct">{pct}%</span>
        <div>
          <strong>{title}</strong>
          <p>
            {s.correct} correct · {s.wrong} wrong · {s.skipped} skipped
            {negative ? ` · score ${s.score}/${questions.length} after negative marking` : ''}
          </p>
          {passed !== null ? (
            <p className="tc-verdict">{passed ? `Pass: above the ${passPercent}% mark` : `Below the ${passPercent}% pass mark`}</p>
          ) : null}
        </div>
      </div>

      {byArea.length ? (
        <div className="tc-area-table" role="table" aria-label="Score by area">
          {byArea.map((a) => {
            const p = Math.round((a.correct / a.total) * 100)
            return (
              <div className="tc-area-row" role="row" key={a.id}>
                <span role="cell">{a.label}</span>
                <span role="cell" className="tc-bar" aria-hidden="true">
                  <span style={{ width: `${p}%` }} className={p >= (passPercent || 50) ? 'ok' : 'low'} />
                </span>
                <span role="cell">
                  {a.correct}/{a.total} ({p}%)
                </span>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="tc-actions">
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Try a new set
        </button>
        <button type="button" className="btn btn-secondary" onClick={onExit}>
          Back to the Test Centre
        </button>
      </div>

      <div className="tc-review">
        <div className="tc-review-head">
          <h3>Review</h3>
          <label>
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} /> Only wrong and skipped
          </label>
        </div>
        {review.length ? (
          review.map(({ q, i, choice }) => (
            <article key={q.id} className="tc-review-item">
              <p className="tc-review-q">
                <span>{i + 1}.</span> {q.prompt}
              </p>
              <p className="tc-review-a">
                {choice === undefined ? <span className="tc-skip">Skipped. </span> : choice === q.answer ? null : (
                  <span className="tc-wrong">You chose {KEYS[choice]}: {q.options[choice]}. </span>
                )}
                <span className="tc-right">
                  Answer {KEYS[q.answer]}: {q.options[q.answer]}
                </span>
              </p>
              {q.explanation ? <p className="tc-explain">{q.explanation}</p> : null}
              {q.source && q.source !== 'practice' ? <p className="tc-src">{q.source}</p> : null}
            </article>
          ))
        ) : (
          <p className="tc-muted">Nothing to review: every answer was correct.</p>
        )}
      </div>
    </div>
  )
}

/**
 * mode "practice": instant feedback after each answer.
 * mode "exam": timed, no feedback until submitted; navigator, flags, optional negative marking.
 */
export default function ExamRunner({ title, questions, mode = 'practice', minutes = null, negative = 0, passPercent = null, areas = null, onExit, onRetry, onFinish }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState({})
  const [done, setDone] = useState(false)
  const [left, setLeft] = useState(minutes ? minutes * 60 : null)
  const [confirm, setConfirm] = useState(false)
  const exam = mode === 'exam'
  const q = questions[index]
  const chosen = answers[index]
  const revealed = !exam && chosen !== undefined

  useEffect(() => {
    if (!exam || left === null || done) return undefined
    if (left <= 0) {
      setDone(true)
      return undefined
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [exam, left, done])

  useEffect(() => {
    if (!exam || done) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [exam, done])

  if (done) {
    return (
      <Results
        title={title}
        questions={questions}
        answers={answers}
        negative={negative}
        passPercent={passPercent}
        areas={areas}
        onRetry={onRetry}
        onExit={onExit}
        onFinish={onFinish}
      />
    )
  }

  const answeredCount = Object.keys(answers).length
  const choose = (i) => {
    if (revealed) return
    setAnswers((a) => ({ ...a, [index]: i }))
  }
  const next = () => (index < questions.length - 1 ? setIndex(index + 1) : exam ? setConfirm(true) : setDone(true))

  return (
    <div className={`tc-runner ${exam ? 'is-exam' : ''}`}>
      <div className="tc-runner-head">
        <div>
          <p className="tc-runner-title">{title}</p>
          <p className="tc-muted">
            Question {index + 1} of {questions.length} · {answeredCount} answered
            {q.topic ? ` · ${q.topic}` : ''}
          </p>
        </div>
        {exam && left !== null ? (
          <div className={`tc-clock ${left < 300 ? 'is-low' : ''}`} aria-live="off">
            {fmt(left)}
          </div>
        ) : null}
      </div>
      <div className="tc-progress" aria-hidden="true">
        <span style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="tc-question">
        {q.source && q.source !== 'practice' ? <span className="tc-badge">{q.source}</span> : null}
        <p className="tc-prompt">{q.prompt}</p>
        <div className="tc-options" role="radiogroup" aria-label="Options">
          {q.options.map((opt, i) => {
            let state = ''
            if (revealed) state = i === q.answer ? 'is-correct' : i === chosen ? 'is-wrong' : 'is-dim'
            else if (chosen === i) state = 'is-selected'
            return (
              <button
                type="button"
                role="radio"
                aria-checked={chosen === i}
                key={opt}
                className={`tc-option ${state}`}
                onClick={() => choose(i)}
                disabled={revealed}
              >
                <span className="tc-key">{KEYS[i]}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>
        {revealed ? (
          <div className={`tc-feedback ${chosen === q.answer ? 'is-correct' : 'is-wrong'}`} role="status">
            <strong>{chosen === q.answer ? 'Correct' : `Not quite: the answer is ${KEYS[q.answer]}`}</strong>
            {q.explanation ? <p>{q.explanation}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="tc-nav">
        {exam ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIndex(Math.max(0, index - 1))} disabled={index === 0}>
              ← Previous
            </button>
            <button type="button" className={`btn btn-secondary ${flags[index] ? 'is-flagged' : ''}`} onClick={() => setFlags((f) => ({ ...f, [index]: !f[index] }))}>
              {flags[index] ? '★ Flagged' : '☆ Flag for review'}
            </button>
            {chosen !== undefined ? (
              <button type="button" className="btn btn-secondary" onClick={() => setAnswers((a) => { const n = { ...a }; delete n[index]; return n })}>
                Clear answer
              </button>
            ) : null}
            <button type="button" className="btn btn-primary" onClick={next}>
              {index < questions.length - 1 ? 'Next →' : 'Finish'}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={next} disabled={!revealed}>
              {index < questions.length - 1 ? 'Next question' : 'See results'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setDone(true)}>
              End now
            </button>
          </>
        )}
      </div>

      {exam ? (
        <details className="tc-grid-wrap" open={questions.length <= 40}>
          <summary>
            Question map · {answeredCount} answered · {Object.values(flags).filter(Boolean).length} flagged
          </summary>
          <div className="tc-grid">
            {questions.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`${i === index ? 'is-current' : ''} ${answers[i] !== undefined ? 'is-answered' : ''} ${flags[i] ? 'is-flagged' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary tc-submit" onClick={() => setConfirm(true)}>
            Submit test
          </button>
        </details>
      ) : null}

      {confirm ? (
        <div className="tc-confirm" role="alertdialog" aria-label="Submit test">
          <p>
            Submit now? {questions.length - answeredCount} unanswered
            {Object.values(flags).filter(Boolean).length ? `, ${Object.values(flags).filter(Boolean).length} flagged` : ''}.
          </p>
          <div className="tc-actions">
            <button type="button" className="btn btn-primary" onClick={() => setDone(true)}>
              Submit
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>
              Keep going
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
