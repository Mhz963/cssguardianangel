import { useMemo, useRef, useState } from 'react'
import { diffWords, matchesAnswer, shuffle } from './englishContent.js'

/** Shuffle MCQ options and remap the answer index so the correct answer isn't always in one place. */
export function prepareQuestions(questions, { limit, shuffleOptions = true } = {}) {
  const picked = shuffle(questions).slice(0, limit || questions.length)
  return picked.map((q) => {
    if (q.type !== 'mcq' || !shuffleOptions) return q
    const order = shuffle(q.options.map((_, i) => i))
    return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
  })
}

export function DiffLine({ input, expected }) {
  const parts = diffWords(input, expected)
  return (
    <p className="ge-diff" aria-label="Changes needed">
      {parts.map((part, index) => (
        <span key={`${part.kind}-${index}`} className={`ge-diff-${part.kind}`}>
          {part.text}{' '}
        </span>
      ))}
    </p>
  )
}

/**
 * Runs a round of questions.
 * question: { id, type: 'mcq' | 'rewrite', prompt, options?, answer?, sentence?, answers?, explanation }
 */
export default function QuizRunner({ title, questions, onFinish, onExit, onRestart }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [typed, setTyped] = useState(() => questions[0]?.sentence || '')
  const [checked, setChecked] = useState(false)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)

  const question = questions[index]
  const total = questions.length
  const correctCount = results.filter((r) => r.correct).length

  const isCorrect = useMemo(() => {
    if (!checked || !question) return false
    if (question.type === 'mcq') return selected === question.answer
    return matchesAnswer(typed, question.answers)
  }, [checked, question, selected, typed])

  if (!question && !finished) return <p className="ge-muted">No questions available.</p>

  const check = () => {
    if (checked) return
    if (question.type === 'mcq' && selected === null) return
    if (question.type === 'rewrite' && !typed.trim()) return
    const correct = question.type === 'mcq' ? selected === question.answer : matchesAnswer(typed, question.answers)
    setChecked(true)
    setResults((current) => [...current, { question, correct, given: question.type === 'mcq' ? selected : typed }])
  }

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true)
      const finalCorrect = results.filter((r) => r.correct).length
      onFinish?.({ correct: finalCorrect, total })
      return
    }
    const nextQuestion = questions[index + 1]
    setIndex(index + 1)
    setSelected(null)
    setTyped(nextQuestion?.sentence || '')
    setChecked(false)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  if (finished) {
    const pct = total ? Math.round((correctCount / total) * 100) : 0
    const missed = results.filter((r) => !r.correct)
    const message =
      pct >= 90 ? 'Excellent. Exam-ready on this set.' : pct >= 70 ? 'Good work. Review the misses below.' : 'Keep going. Read the rules again, then retry.'
    return (
      <div className="ge-summary">
        <div className="ge-summary-score">
          <span className="ge-summary-pct">{pct}%</span>
          <span>
            {correctCount} of {total} correct
          </span>
        </div>
        <p className="ge-summary-message">{message}</p>
        {missed.length > 0 ? (
          <div className="ge-review">
            <h3>Review your mistakes</h3>
            {missed.map(({ question: q, given }) => (
              <article className="ge-review-item" key={q.id}>
                <p className="ge-review-prompt">{q.type === 'rewrite' ? q.sentence : q.prompt}</p>
                {q.type === 'mcq' ? (
                  <p>
                    <span className="ge-tag ge-tag-bad">Your answer: {given === null ? '—' : q.options[given]}</span>{' '}
                    <span className="ge-tag ge-tag-good">Correct: {q.options[q.answer]}</span>
                  </p>
                ) : (
                  <DiffLine input={given} expected={q.answers[0]} />
                )}
                <p className="ge-explain">{q.explanation}</p>
              </article>
            ))}
          </div>
        ) : null}
        <div className="ge-actions">
          {onRestart ? (
            <button type="button" className="btn btn-primary" onClick={onRestart}>
              Try a new round
            </button>
          ) : null}
          {onExit ? (
            <button type="button" className="btn btn-secondary" onClick={onExit}>
              Back
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="ge-quiz">
      <div className="ge-quiz-head">
        {title ? <p className="ge-quiz-title">{title}</p> : null}
        <p className="ge-quiz-count">
          Question {index + 1} of {total} · {correctCount} correct
        </p>
        <div className="ge-progress" aria-hidden="true">
          <span style={{ width: `${(index / total) * 100}%` }} />
        </div>
      </div>

      <p className="ge-quiz-prompt">{question.prompt}</p>

      {question.type === 'mcq' ? (
        <div className="ge-options" role="radiogroup" aria-label="Answer options">
          {question.options.map((option, i) => {
            const state = !checked ? (selected === i ? 'selected' : '') : i === question.answer ? 'correct' : selected === i ? 'wrong' : 'dim'
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected === i}
                key={`${question.id}-${i}`}
                className={`ge-option ${state ? `is-${state}` : ''}`}
                onClick={() => !checked && setSelected(i)}
                disabled={checked}
              >
                <span className="ge-option-key" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="ge-rewrite">
          <p className="ge-rewrite-original">{question.sentence}</p>
          <label className="ge-label" htmlFor={`ge-input-${question.id}`}>
            Your corrected sentence
          </label>
          <textarea
            id={`ge-input-${question.id}`}
            ref={inputRef}
            className="ge-textarea"
            rows={2}
            value={typed}
            disabled={checked}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (checked) next()
                else check()
              }
            }}
            spellCheck={false}
          />
        </div>
      )}

      {checked ? (
        <div className={`ge-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
          <p className="ge-feedback-title">{isCorrect ? 'Correct' : 'Not quite'}</p>
          {question.type === 'rewrite' && !isCorrect ? (
            <>
              <p className="ge-muted">Changes needed (green = add, red = remove):</p>
              <DiffLine input={typed} expected={question.answers[0]} />
            </>
          ) : null}
          {question.type === 'mcq' && !isCorrect ? (
            <p>
              Correct answer: <strong>{question.options[question.answer]}</strong>
            </p>
          ) : null}
          <p className="ge-explain">{question.explanation}</p>
        </div>
      ) : null}

      <div className="ge-actions">
        {!checked ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={check}
            disabled={question.type === 'mcq' ? selected === null : !typed.trim()}
          >
            Check answer
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={next}>
            {index + 1 >= total ? 'See results' : 'Next question'}
          </button>
        )}
        {onExit ? (
          <button type="button" className="btn btn-secondary" onClick={onExit}>
            Exit
          </button>
        ) : null}
      </div>
    </div>
  )
}
