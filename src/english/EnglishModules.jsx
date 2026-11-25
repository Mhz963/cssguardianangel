import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QuizRunner, { DiffLine, prepareQuestions } from './QuizRunner.jsx'
import { matchesAnswer, shuffle, useEnglishContent } from './englishContent.js'
import { MASTERED_BOX, NEW_WORDS_PER_DAY, todayKey } from './englishStore.js'

function ContentState({ state, children }) {
  if (state.loading) return <p className="ge-muted ge-loading">Loading practice…</p>
  if (state.error) return <p className="ge-error">Could not load this practice set. Check your connection and try again.</p>
  return children(state.data)
}

function ScorePill({ value }) {
  if (value === undefined || value === null) return <span className="ge-pill">Not started</span>
  const tone = value >= 80 ? 'good' : value >= 50 ? 'mid' : 'low'
  return <span className={`ge-pill ge-pill-${tone}`}>Best {value}%</span>
}

function RuleCards({ rules, labelKey = 'rule' }) {
  return (
    <div className="ge-rules">
      {rules.map((rule, index) => (
        <article className="ge-rule" key={`${rule[labelKey]}-${index}`}>
          {rule.mark ? <h4>{rule.mark}</h4> : null}
          <p>{rule.rule}</p>
          {rule.examples?.length ? (
            <ul>
              {rule.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  )
}

/* ---------------- Grammar ---------------- */
export function GrammarModule({ store }) {
  const state = useEnglishContent('grammar')
  const [params, setParams] = useSearchParams()
  const topicId = params.get('topic')
  const [round, setRound] = useState(null)

  return (
    <ContentState state={state}>
      {(data) => {
        const topic = data.topics.find((t) => t.id === topicId)
        if (!topic) {
          return (
            <div className="ge-grid">
              {data.topics.map((t) => (
                <button type="button" className="ge-card ge-card-button" key={t.id} onClick={() => setParams({ topic: t.id })}>
                  <h3>{t.title}</h3>
                  <p>{t.summary}</p>
                  <div className="ge-card-foot">
                    <span className="ge-muted">{t.questions.length} questions</span>
                    <ScorePill value={store.progress.grammar[t.id]?.best} />
                  </div>
                </button>
              ))}
            </div>
          )
        }
        const start = () => setRound({ key: Date.now(), questions: prepareQuestions(topic.questions) })
        if (round) {
          return (
            <QuizRunner
              key={round.key}
              title={topic.title}
              questions={round.questions}
              onFinish={(result) => store.recordGrammarTopic(topic.id, result)}
              onRestart={start}
              onExit={() => setRound(null)}
            />
          )
        }
        return (
          <div className="ge-topic">
            <div className="ge-topic-head">
              <button type="button" className="ge-back" onClick={() => setParams({})}>
                ← All grammar topics
              </button>
              <h3 className="ge-topic-title">{topic.title}</h3>
              <p className="ge-muted">{topic.summary}</p>
            </div>
            <RuleCards rules={topic.rules} />
            <div className="ge-actions">
              <button type="button" className="btn btn-primary" onClick={start}>
                Practise {topic.questions.length} questions
              </button>
              <ScorePill value={store.progress.grammar[topic.id]?.best} />
            </div>
          </div>
        )
      }}
    </ContentState>
  )
}

/* ---------------- Punctuation ---------------- */
export function PunctuationModule({ store }) {
  const state = useEnglishContent('punctuation')
  const [round, setRound] = useState(null)
  return (
    <ContentState state={state}>
      {(data) => {
        const start = () => setRound({ key: Date.now(), questions: prepareQuestions(data.questions, { limit: 10 }) })
        if (round) {
          return (
            <QuizRunner
              key={round.key}
              title="Punctuation round"
              questions={round.questions}
              onFinish={(result) => store.recordRound('punctuation', result)}
              onRestart={start}
              onExit={() => setRound(null)}
            />
          )
        }
        return (
          <div className="ge-topic">
            <RuleCards rules={data.rules} labelKey="mark" />
            <div className="ge-actions">
              <button type="button" className="btn btn-primary" onClick={start}>
                Start a 10-question round
              </button>
              <ScorePill value={store.progress.punctuation.attempts ? store.progress.punctuation.best : undefined} />
            </div>
          </div>
        )
      }}
    </ContentState>
  )
}

/* ---------------- Sentence correction ---------------- */
function CorrectionTrainer({ items, store }) {
  const solved = store.progress.correction.solved
  const [queue] = useState(() => {
    const unsolved = items.filter((i) => !solved[i.id])
    return shuffle(unsolved.length ? unsolved : items)
  })
  const [position, setPosition] = useState(0)
  const item = queue[position % queue.length]
  const [typed, setTyped] = useState(item?.sentence || '')
  const [checked, setChecked] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const solvedCount = items.filter((i) => solved[i.id]).length

  if (!item) return null

  const check = () => {
    if (checked || !typed.trim()) return
    const ok = matchesAnswer(typed, item.answers)
    setLastCorrect(ok)
    setChecked(true)
    store.recordCorrection(item.id, ok)
  }
  const next = () => {
    const nextItem = queue[(position + 1) % queue.length]
    setPosition(position + 1)
    setTyped(nextItem.sentence)
    setChecked(false)
  }

  return (
    <div className="ge-quiz">
      <div className="ge-quiz-head">
        <p className="ge-quiz-count">
          Solved {solvedCount} of {items.length} sentences
        </p>
        <div className="ge-progress" aria-hidden="true">
          <span style={{ width: `${(solvedCount / items.length) * 100}%` }} />
        </div>
      </div>
      <p className="ge-quiz-prompt">Correct the sentence. Change only what is wrong.</p>
      <div className="ge-rewrite">
        <p className="ge-rewrite-original">{item.sentence}</p>
        <label className="ge-label" htmlFor="ge-correction-input">
          Your corrected sentence
        </label>
        <textarea
          id="ge-correction-input"
          className="ge-textarea"
          rows={2}
          value={typed}
          disabled={checked}
          spellCheck={false}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              if (checked) next()
              else check()
            }
          }}
        />
      </div>
      {checked ? (
        <div className={`ge-feedback ${lastCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
          <p className="ge-feedback-title">
            {lastCorrect ? 'Correct' : 'Not quite'} <span className="ge-tag">{item.focus}</span>
          </p>
          {!lastCorrect ? (
            <>
              <p className="ge-muted">Changes needed (green = add, red = remove):</p>
              <DiffLine input={typed} expected={item.answers[0]} />
            </>
          ) : null}
          <p className="ge-explain">{item.explanation}</p>
        </div>
      ) : null}
      <div className="ge-actions">
        {!checked ? (
          <>
            <button type="button" className="btn btn-primary" onClick={check} disabled={!typed.trim()}>
              Check answer
            </button>
            <button type="button" className="btn btn-secondary" onClick={next}>
              Skip
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={next}>
            Next sentence
          </button>
        )}
      </div>
    </div>
  )
}

export function CorrectionModule({ store }) {
  const state = useEnglishContent('sentence-correction')
  return <ContentState state={state}>{(data) => <CorrectionTrainer items={data.items} store={store} />}</ContentState>
}

/* ---------------- Pairs of words ---------------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function pairLabel(pair) {
  return pair.words.map((w) => w.word).join(' / ')
}

function pairLetter(pair) {
  return (pair.words[0]?.word || '?').charAt(0).toUpperCase()
}

/** One random question from a random pair, avoiding pairs seen recently. */
function nextPairQuestion(pool, recent) {
  const fresh = pool.filter((p) => !recent.includes(p.id))
  const source = fresh.length ? fresh : pool
  const pair = source[Math.floor(Math.random() * source.length)]
  const quiz = pair.quiz[Math.floor(Math.random() * pair.quiz.length)]
  const options = shuffle(pair.words.map((w) => w.word))
  return { pair, sentence: quiz.sentence, answer: quiz.answer, options }
}

function EndlessPairsQuiz({ pairs, store, onExit }) {
  const [pastOnly, setPastOnly] = useState(false)
  const pool = useMemo(() => (pastOnly ? pairs.filter((p) => p.years?.length) : pairs), [pairs, pastOnly])
  const [recent, setRecent] = useState([])
  const [question, setQuestion] = useState(() => nextPairQuestion(pairs, []))
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, bestStreak: 0 })
  const [misses, setMisses] = useState([])
  const [finished, setFinished] = useState(false)
  const checked = selected !== null
  const isCorrect = checked && selected === question.answer

  const answer = (word) => {
    if (checked) return
    setSelected(word)
    const ok = word === question.answer
    setStats((s) => {
      const streak = ok ? s.streak + 1 : 0
      return { correct: s.correct + (ok ? 1 : 0), total: s.total + 1, streak, bestStreak: Math.max(s.bestStreak, streak) }
    })
    if (!ok) setMisses((m) => [{ ...question, given: word }, ...m].slice(0, 30))
  }

  const next = (sourcePool = pool) => {
    const nextRecent = [question.pair.id, ...recent].slice(0, Math.min(40, Math.floor(sourcePool.length / 2)))
    setRecent(nextRecent)
    setQuestion(nextPairQuestion(sourcePool, nextRecent))
    setSelected(null)
  }

  const finish = () => {
    if (stats.total > 0) store.recordRound('pairs', { correct: stats.correct, total: stats.total })
    setFinished(true)
  }

  if (finished) {
    const pct = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
    return (
      <div className="ge-summary">
        <div className="ge-summary-score">
          <span className="ge-summary-pct">{pct}%</span>
          <span>
            {stats.correct} of {stats.total} correct · best streak {stats.bestStreak}
          </span>
        </div>
        {misses.length ? (
          <div className="ge-review">
            <h3>Pairs to revise</h3>
            {misses.map((m, index) => (
              <article className="ge-review-item" key={`${m.pair.id}-${index}`}>
                <p className="ge-review-prompt">{m.sentence.replace('___', `[${m.answer}]`)}</p>
                <p className="ge-explain">
                  {m.pair.words.map((w) => `${w.word} (${w.pos}): ${w.meaning}.`).join(' ')}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="ge-summary-message">No mistakes. Excellent.</p>
        )}
        <div className="ge-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setStats({ correct: 0, total: 0, streak: 0, bestStreak: 0 })
              setMisses([])
              setFinished(false)
              next()
            }}
          >
            Keep practising
          </button>
          <button type="button" className="btn btn-secondary" onClick={onExit}>
            Back to the list
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ge-quiz">
      <div className="ge-quiz-head">
        <p className="ge-quiz-title">Unlimited practice · choose the right word</p>
        <p className="ge-quiz-count">
          {stats.correct} of {stats.total} correct · streak {stats.streak} · {pool.length} pairs in play
        </p>
        <label className="ge-toggle">
          <input
            type="checkbox"
            checked={pastOnly}
            onChange={(event) => {
              const value = event.target.checked
              setPastOnly(value)
              const nextPool = value ? pairs.filter((p) => p.years?.length) : pairs
              setRecent([])
              setQuestion(nextPairQuestion(nextPool, []))
              setSelected(null)
            }}
          />
          Only pairs asked in CSS past papers
        </label>
      </div>
      <p className="ge-quiz-prompt">{question.sentence}</p>
      <div className="ge-options" role="radiogroup" aria-label="Choose the word">
        {question.options.map((word, i) => {
          const state = !checked ? '' : word === question.answer ? 'correct' : selected === word ? 'wrong' : 'dim'
          return (
            <button
              type="button"
              role="radio"
              aria-checked={selected === word}
              key={word}
              className={`ge-option ${state ? `is-${state}` : ''}`}
              onClick={() => answer(word)}
              disabled={checked}
            >
              <span className="ge-option-key" aria-hidden="true">
                {String.fromCharCode(65 + i)}
              </span>
              {word}
            </button>
          )
        })}
      </div>
      {checked ? (
        <div className={`ge-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`} role="status">
          <p className="ge-feedback-title">
            {isCorrect ? 'Correct' : `Not quite: the answer is ${question.answer}`}
            {question.pair.years?.length ? <span className="ge-tag">CSS {question.pair.years.join(', ')}</span> : null}
          </p>
          {question.pair.words.map((w) => (
            <p className="ge-explain" key={w.word}>
              <strong>{w.word}</strong> ({w.pos}): {w.meaning}. <em>{w.example}</em>
            </p>
          ))}
        </div>
      ) : null}
      <div className="ge-actions">
        <button type="button" className="btn btn-primary" onClick={() => next()} disabled={!checked}>
          Next question
        </button>
        <button type="button" className="btn btn-secondary" onClick={finish}>
          End quiz
        </button>
      </div>
    </div>
  )
}

export function PairsModule({ store }) {
  const state = useEnglishContent('pairs-of-words')
  const [mode, setMode] = useState('study')
  const [query, setQuery] = useState('')
  const [pastOnly, setPastOnly] = useState(false)

  return (
    <ContentState state={state}>
      {(data) => {
        const sorted = [...data.pairs].sort((a, b) => pairLabel(a).localeCompare(pairLabel(b), 'en', { sensitivity: 'base' }))
        const q = query.trim().toLowerCase()
        const filtered = sorted.filter(
          (p) => (!pastOnly || p.years?.length) && (!q || p.words.some((w) => w.word.toLowerCase().includes(q))),
        )
        const byLetter = new Map()
        filtered.forEach((p) => {
          const letter = pairLetter(p)
          if (!byLetter.has(letter)) byLetter.set(letter, [])
          byLetter.get(letter).push(p)
        })
        const pastCount = data.pairs.filter((p) => p.years?.length).length

        return (
          <div className="ge-topic">
            <div className="ge-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'study'} className={mode === 'study' ? 'is-active' : ''} onClick={() => setMode('study')}>
                Study list ({data.pairs.length})
              </button>
              <button type="button" role="tab" aria-selected={mode === 'quiz'} className={mode === 'quiz' ? 'is-active' : ''} onClick={() => setMode('quiz')}>
                Unlimited quiz
              </button>
              <ScorePill value={store.progress.pairs.attempts ? store.progress.pairs.best : undefined} />
            </div>

            {mode === 'quiz' ? (
              <EndlessPairsQuiz pairs={sorted} store={store} onExit={() => setMode('study')} />
            ) : (
              <>
                <div className="ge-filter-row">
                  <input
                    className="ge-search"
                    type="search"
                    placeholder="Search a word, e.g. principal"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="Search pairs of words"
                  />
                  <label className="ge-toggle">
                    <input type="checkbox" checked={pastOnly} onChange={(event) => setPastOnly(event.target.checked)} />
                    Asked in CSS past papers ({pastCount})
                  </label>
                </div>
                <nav className="ge-az" aria-label="Jump to letter">
                  {LETTERS.map((letter) =>
                    byLetter.has(letter) ? (
                      <a key={letter} href={`#pairs-${letter}`}>
                        {letter}
                      </a>
                    ) : (
                      <span key={letter} aria-hidden="true">
                        {letter}
                      </span>
                    ),
                  )}
                </nav>
                <p className="ge-muted">
                  Showing {filtered.length} of {data.pairs.length} pairs, A to Z. Years show when a pair was asked in the CSS
                  English paper.
                </p>
                {[...byLetter.entries()].map(([letter, list]) => (
                  <section className="ge-letter-block" key={letter} id={`pairs-${letter}`}>
                    <h3 className="ge-letter">{letter}</h3>
                    <div className="ge-grid">
                      {list.map((pair) => (
                        <article className="ge-card ge-pair" key={pair.id}>
                          <p className="ge-pair-title">
                            {pairLabel(pair)}
                            {pair.years?.length ? <span className="ge-year-badge">CSS {pair.years.join(' · ')}</span> : null}
                          </p>
                          {pair.words.map((w) => (
                            <div className="ge-pair-word" key={w.word}>
                              <h3>
                                {w.word} <span className="ge-pos">{w.pos}</span>
                              </h3>
                              <p>{w.meaning}</p>
                              <p className="ge-example">{w.example}</p>
                            </div>
                          ))}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
                <div className="ge-actions">
                  <button type="button" className="btn btn-primary" onClick={() => setMode('quiz')}>
                    Start the unlimited quiz
                  </button>
                </div>
              </>
            )}
          </div>
        )
      }}
    </ContentState>
  )
}

/* ---------------- Grouping of words ---------------- */
function GroupingGame({ set, store, onExit }) {
  const words = useMemo(() => shuffle(set.pairs.flat()), [set])
  const [made, setMade] = useState([])
  const [pending, setPending] = useState(null)
  const [checked, setChecked] = useState(false)
  const used = new Set(made.flat())
  const answerKey = useMemo(() => {
    const map = new Map()
    set.pairs.forEach(([a, b]) => {
      map.set(a, b)
      map.set(b, a)
    })
    return map
  }, [set])

  const pick = (word) => {
    if (checked || used.has(word)) return
    if (!pending) {
      setPending(word)
      return
    }
    if (pending === word) {
      setPending(null)
      return
    }
    setMade((current) => [...current, [pending, word]])
    setPending(null)
  }

  const unpair = (index) => {
    if (checked) return
    setMade((current) => current.filter((_, i) => i !== index))
  }

  const check = () => {
    setChecked(true)
    const correct = made.filter(([a, b]) => answerKey.get(a) === b).length
    store.recordGrouping(set.id, { correct, total: set.pairs.length })
  }

  const correctCount = made.filter(([a, b]) => answerKey.get(a) === b).length

  return (
    <div className="ge-topic">
      <div className="ge-topic-head">
        <button type="button" className="ge-back" onClick={onExit}>
          ← All sets
        </button>
        <p className="ge-quiz-prompt">{set.instruction}</p>
        <p className="ge-muted">Tap two words to pair them. Tap a pair to undo it.</p>
      </div>
      <div className="ge-chips">
        {words.map((word) => (
          <button
            type="button"
            key={word}
            className={`ge-chip ${used.has(word) ? 'is-used' : ''} ${pending === word ? 'is-pending' : ''}`}
            onClick={() => pick(word)}
            disabled={checked || used.has(word)}
          >
            {word}
          </button>
        ))}
      </div>
      <div className="ge-pairs-made">
        {made.map(([a, b], index) => {
          const ok = answerKey.get(a) === b
          return (
            <button
              type="button"
              key={`${a}-${b}`}
              className={`ge-made ${checked ? (ok ? 'is-correct' : 'is-wrong') : ''}`}
              onClick={() => unpair(index)}
              disabled={checked}
            >
              {a} <span aria-hidden="true">↔</span> {b}
            </button>
          )
        })}
      </div>
      {checked ? (
        <div className={`ge-feedback ${correctCount === set.pairs.length ? 'is-correct' : 'is-wrong'}`} role="status">
          <p className="ge-feedback-title">
            {correctCount} of {set.pairs.length} pairs correct
          </p>
          <p className="ge-muted">Answer key:</p>
          <p className="ge-key">
            {set.pairs.map(([a, b]) => (
              <span className="ge-tag" key={a}>
                {a} – {b}
              </span>
            ))}
          </p>
        </div>
      ) : null}
      <div className="ge-actions">
        {!checked ? (
          <button type="button" className="btn btn-primary" onClick={check} disabled={made.length < set.pairs.length}>
            Check pairs ({made.length}/{set.pairs.length})
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onExit}>
            Choose another set
          </button>
        )}
      </div>
    </div>
  )
}

export function GroupingModule({ store }) {
  const state = useEnglishContent('grouping')
  const [setId, setSetId] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  return (
    <ContentState state={state}>
      {(data) => {
        const current = data.sets.find((s) => s.id === setId)
        if (current) {
          return <GroupingGame key={`${current.id}-${gameKey}`} set={current} store={store} onExit={() => setSetId(null)} />
        }
        const groups = [
          { type: 'synonyms', label: 'Similar meanings (synonyms)' },
          { type: 'antonyms', label: 'Opposite meanings (antonyms)' },
        ]
        return (
          <div className="ge-topic">
            {groups.map((group) => (
              <section key={group.type} className="ge-group-block">
                <h3 className="ge-topic-title">{group.label}</h3>
                <div className="ge-grid ge-grid-compact">
                  {data.sets
                    .filter((s) => s.type === group.type)
                    .map((s, index) => (
                      <button
                        type="button"
                        className="ge-card ge-card-button"
                        key={s.id}
                        onClick={() => {
                          setSetId(s.id)
                          setGameKey(Date.now())
                        }}
                      >
                        <h3>Set {index + 1}</h3>
                        <p className="ge-muted">20 words · 10 pairs</p>
                        <div className="ge-card-foot">
                          <ScorePill value={store.progress.grouping[s.id]?.best} />
                        </div>
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )
      }}
    </ContentState>
  )
}

/* ---------------- Vocabulary (spaced repetition) ---------------- */
function buildReviewQueue(words, progress) {
  const today = todayKey()
  const cards = progress.vocabulary.cards
  const due = words.filter((w) => cards[w.id] && cards[w.id].due <= today)
  const nt = progress.vocabulary.newToday
  const newLeft = Math.max(0, NEW_WORDS_PER_DAY - (nt.date === today ? nt.count : 0))
  const fresh = shuffle(words.filter((w) => !cards[w.id])).slice(0, newLeft)
  return shuffle([...due, ...fresh])
}

function VocabularyReview({ queue, store, onDone }) {
  const [position, setPosition] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const word = queue[position]
  if (!word) {
    return (
      <div className="ge-summary">
        <p className="ge-summary-pct">Done</p>
        <p className="ge-summary-message">Today&apos;s review is complete. Words come back just before you would forget them.</p>
        <div className="ge-actions">
          <button type="button" className="btn btn-primary" onClick={onDone}>
            Back to vocabulary
          </button>
        </div>
      </div>
    )
  }
  const answer = (knew) => {
    store.reviewWord(word.id, knew)
    setRevealed(false)
    setPosition(position + 1)
  }
  return (
    <div className="ge-quiz">
      <div className="ge-quiz-head">
        <p className="ge-quiz-count">
          Card {position + 1} of {queue.length}
        </p>
        <div className="ge-progress" aria-hidden="true">
          <span style={{ width: `${(position / queue.length) * 100}%` }} />
        </div>
      </div>
      <div className={`ge-flash ${revealed ? 'is-revealed' : ''}`}>
        <p className="ge-flash-word">{word.word}</p>
        <p className="ge-pos">{word.pos}</p>
        {revealed ? (
          <div className="ge-flash-back">
            <p className="ge-flash-meaning">{word.meaning}</p>
            {word.urdu ? (
              <p className="ge-urdu" lang="ur" dir="rtl">
                {word.urdu}
              </p>
            ) : null}
            {word.synonyms?.length ? (
              <p>
                <strong>Synonyms:</strong> {word.synonyms.join(', ')}
              </p>
            ) : null}
            {word.antonyms?.length ? (
              <p>
                <strong>Antonyms:</strong> {word.antonyms.join(', ')}
              </p>
            ) : null}
            <p className="ge-example">{word.example}</p>
          </div>
        ) : (
          <p className="ge-muted">Do you know what it means? Think, then reveal.</p>
        )}
      </div>
      <div className="ge-actions">
        {!revealed ? (
          <button type="button" className="btn btn-primary" onClick={() => setRevealed(true)}>
            Show meaning
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={() => answer(true)}>
              I knew it
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => answer(false)}>
              Still learning
            </button>
          </>
        )}
        <button type="button" className="btn btn-secondary" onClick={onDone}>
          Stop
        </button>
      </div>
    </div>
  )
}

export function VocabularyModule({ store }) {
  const state = useEnglishContent('vocabulary')
  const [session, setSession] = useState(null)
  const [query, setQuery] = useState('')
  return (
    <ContentState state={state}>
      {(data) => {
        const cards = store.progress.vocabulary.cards
        const mastered = data.words.filter((w) => (cards[w.id]?.box || 0) >= MASTERED_BOX).length
        const learning = data.words.filter((w) => cards[w.id] && cards[w.id].box < MASTERED_BOX).length
        const queuePreview = buildReviewQueue(data.words, store.progress)
        if (session) {
          return <VocabularyReview key={session.key} queue={session.queue} store={store} onDone={() => setSession(null)} />
        }
        const q = query.trim().toLowerCase()
        const filtered = q
          ? data.words.filter((w) => w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q))
          : data.words
        return (
          <div className="ge-topic">
            <div className="ge-stat-row">
              <div className="ge-stat">
                <strong>{queuePreview.length}</strong>
                <span>due today</span>
              </div>
              <div className="ge-stat">
                <strong>{learning}</strong>
                <span>learning</span>
              </div>
              <div className="ge-stat">
                <strong>{mastered}</strong>
                <span>mastered</span>
              </div>
              <div className="ge-stat">
                <strong>{data.words.length}</strong>
                <span>words in the list</span>
              </div>
            </div>
            <div className="ge-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={queuePreview.length === 0}
                onClick={() => setSession({ key: Date.now(), queue: queuePreview })}
              >
                {queuePreview.length ? `Start today’s review (${queuePreview.length})` : 'All caught up for today'}
              </button>
              <span className="ge-muted">Up to {NEW_WORDS_PER_DAY} new words a day, plus words due for review.</span>
            </div>
            <input
              className="ge-search"
              type="search"
              placeholder="Search the word list"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search vocabulary"
            />
            <div className="ge-wordlist">
              {filtered.map((w) => (
                <article className="ge-word" key={w.id}>
                  <h3>
                    {w.word} <span className="ge-pos">{w.pos}</span>
                    {(cards[w.id]?.box || 0) >= MASTERED_BOX ? <span className="ge-tag ge-tag-good">Mastered</span> : null}
                  </h3>
                  <p>{w.meaning}</p>
                  {w.urdu ? (
                    <p className="ge-urdu" lang="ur" dir="rtl">
                      {w.urdu}
                    </p>
                  ) : null}
                  <p className="ge-muted">
                    {w.synonyms?.length ? `Synonyms: ${w.synonyms.join(', ')}` : ''}
                    {w.antonyms?.length ? ` · Antonyms: ${w.antonyms.join(', ')}` : ''}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )
      }}
    </ContentState>
  )
}
