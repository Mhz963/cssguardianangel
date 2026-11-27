import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import QuizRunner, { DiffLine, prepareQuestions } from './QuizRunner.jsx'
import { matchesAnswer, shuffle, useEnglishContent } from './englishContent.js'
import { MASTERED_BOX, NEW_WORDS_PER_DAY, todayKey } from './englishStore.js'
import PastPaperPanel from './PastPaperPanel.jsx'
import {
  pastCorrectionItems,
  pastPairItems,
  pastPrepositionItems,
  pastPunctuationItems,
  pastVocabularyItems,
} from './pastPaperData.js'

/** Past paper vocabulary question: WORD (similar/opposite) with its four options. */
function VocabQuestion({ item }) {
  return (
    <span>
      <strong>{item.word}</strong>{' '}
      <span className="ge-muted">({item.type === 'synonym' ? 'similar in meaning' : 'opposite in meaning'})</span>
      <span className="ge-ppq-options">
        {item.options.map((o, i) => (
          <span key={o}>
            ({'ABCD'[i]}) {o}
          </span>
        ))}
      </span>
    </span>
  )
}

function VocabAnswer({ item }) {
  return (
    <span>
      {'ABCD'[item.answer]}: {item.options[item.answer]}
      {item.note ? <span className="ge-muted"> · {item.note}</span> : null}
    </span>
  )
}

function usePastPapers() {
  return useEnglishContent('past-papers').data
}

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
const GRAMMAR_ROUND = 15

export function GrammarModule({ store }) {
  const state = useEnglishContent('grammar')
  const [params, setParams] = useSearchParams()
  const topicId = params.get('topic')
  const [round, setRound] = useState(null)
  const papers = usePastPapers()
  const prepPanel = (
    <PastPaperPanel
      title="Prepositions asked in the paper"
      intro="Q5(b) asks you to fill in the right preposition in five of eight sentences. These are the real sentences."
      items={pastPrepositionItems(papers)}
      renderQuestion={(item) => <span>{item.sentence}</span>}
      renderAnswer={(item) => <span>{item.answer}</span>}
    />
  )

  return (
    <ContentState state={state}>
      {(data) => {
        const topic = data.topics.find((t) => t.id === topicId)
        if (!topic) {
          return (
            <>
            {prepPanel}
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
            </>
          )
        }
        const start = () =>
          setRound({ key: Date.now(), questions: prepareQuestions(topic.questions, { limit: GRAMMAR_ROUND }) })
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
            {topic.id === 'prepositions' ? prepPanel : null}
            <RuleCards rules={topic.rules} />
            <div className="ge-actions">
              <button type="button" className="btn btn-primary" onClick={start}>
                Practise {Math.min(GRAMMAR_ROUND, topic.questions.length)} random questions
              </button>
              <ScorePill value={store.progress.grammar[topic.id]?.best} />
              <span className="ge-muted">{topic.questions.length} questions in this topic; each round picks a new mix.</span>
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
  const papers = usePastPapers()
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
            <PastPaperPanel
              title="Punctuation passages from the paper"
              intro="Q5(a) gives an unpunctuated passage or set of sentences. Write your version first, then compare it with the model answer."
              items={pastPunctuationItems(papers)}
              initial={3}
              renderQuestion={(item) => <p className="ge-ppq-passage">{item.text}</p>}
              renderAnswer={(item) => <p className="ge-ppq-passage">{item.answer}</p>}
            />
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
function yearsLabel(years) {
  return years?.length ? `CSS ${years.join(', ')}` : ''
}

function CorrectionTrainer({ items, store, label }) {
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
  const [overridden, setOverridden] = useState(false)
  const solvedCount = items.filter((i) => solved[i.id]).length

  if (!item) return null

  const check = () => {
    if (checked || !typed.trim()) return
    const ok = matchesAnswer(typed, item.answers)
    setLastCorrect(ok)
    setChecked(true)
    setOverridden(false)
    store.recordCorrection(item.id, ok)
  }
  const countAsCorrect = () => {
    setOverridden(true)
    store.recordCorrection(item.id, true)
  }
  const next = () => {
    const nextItem = queue[(position + 1) % queue.length]
    setPosition(position + 1)
    setTyped(nextItem.sentence)
    setChecked(false)
    setOverridden(false)
  }

  return (
    <div className="ge-quiz">
      <div className="ge-quiz-head">
        <p className="ge-quiz-count">
          {label}: solved {solvedCount} of {items.length} sentences
        </p>
        <div className="ge-progress" aria-hidden="true">
          <span style={{ width: `${(solvedCount / items.length) * 100}%` }} />
        </div>
      </div>
      <p className="ge-quiz-prompt">
        Correct the sentence. Change only what is wrong.
        {item.years?.length ? <span className="ge-year-badge">{yearsLabel(item.years)}</span> : null}
      </p>
      <div className="ge-rewrite">
        <p className="ge-rewrite-original">{item.sentence}</p>
        <label className="ge-label" htmlFor="ge-correction-input">
          Your corrected sentence
        </label>
        <textarea
          id="ge-correction-input"
          className="ge-textarea"
          rows={item.sentence.length > 140 ? 4 : 2}
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
        <div className={`ge-feedback ${lastCorrect || overridden ? 'is-correct' : 'is-wrong'}`} role="status">
          <p className="ge-feedback-title">
            {lastCorrect ? 'Correct' : overridden ? 'Counted as correct' : 'Not quite'} <span className="ge-tag">{item.focus}</span>
          </p>
          {!lastCorrect ? (
            <>
              <p className="ge-muted">
                {item.answers.length > 1 ? 'Model answer (other wordings are also accepted below):' : 'Model answer:'}
              </p>
              <DiffLine input={typed} expected={item.answers[0]} />
              {item.answers.length > 1 ? (
                <ul className="ge-alt-answers">
                  {item.answers.slice(1).map((answer) => (
                    <li key={answer}>{answer}</li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
          <p className="ge-explain">{item.explanation}</p>
          {!lastCorrect && !overridden ? (
            <button type="button" className="ge-link-btn" onClick={countAsCorrect}>
              My answer fixes the error in a different way: count it as correct
            </button>
          ) : null}
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
  const [params, setParams] = useSearchParams()
  const mode = params.get('past') ? 'past' : 'all'
  const year = Number(params.get('past')) || 0
  return (
    <ContentState state={state}>
      {(data) => {
        const past = data.items.filter((i) => i.years?.length)
        const pastYears = [...new Set(past.flatMap((i) => i.years))].sort((a, b) => b - a)
        let items = data.items
        let label = 'All sentences'
        if (mode === 'past') {
          items = year ? past.filter((i) => i.years.includes(year)) : past
          label = year ? `CSS ${year} paper` : 'Past paper sentences'
        }
        if (!items.length) items = data.items
        return (
          <div className="ge-topic">
            <PastPaperPanel
              title="Sentences FPSC asked you to correct"
              intro="Q4 gives eight sentences and you correct any five. Every sentence below appeared in a CSS English paper."
              items={pastCorrectionItems(data.items)}
              renderQuestion={(item) => <span>{item.sentence}</span>}
              renderAnswer={(item) => (
                <span>
                  {item.answers[0]} <span className="ge-muted">· {item.focus}</span>
                </span>
              )}
              action={
                <button type="button" className="btn btn-primary ge-ppq-btn" onClick={() => setParams({ past: 'all' })}>
                  Practise past paper sentences
                </button>
              }
            />
            <div className="ge-tabs" role="tablist" aria-label="Choose sentences">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'all'}
                className={mode === 'all' ? 'is-active' : ''}
                onClick={() => setParams({})}
              >
                All sentences ({data.items.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'past' && !year}
                className={mode === 'past' && !year ? 'is-active' : ''}
                onClick={() => setParams({ past: 'all' })}
              >
                Past papers only ({past.length})
              </button>
              {pastYears.map((y) => (
                <button
                  type="button"
                  role="tab"
                  key={y}
                  aria-selected={year === y}
                  className={year === y ? 'is-active' : ''}
                  onClick={() => setParams({ past: String(y) })}
                >
                  {y}
                </button>
              ))}
            </div>
            <CorrectionTrainer key={`${mode}-${year}`} items={items} store={store} label={label} />
            <p className="ge-muted">
              Past paper sentences are reproduced from FPSC question papers; the corrections are Guardian Angel&apos;s model
              answers, as FPSC does not publish answer keys. <Link to="/guardian-english/past-papers">See all past paper references</Link>.
            </p>
          </div>
        )
      }}
    </ContentState>
  )
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

function EndlessPairsQuiz({ pairs, store, onExit, startPastOnly = false }) {
  const [pastOnly, setPastOnly] = useState(startPastOnly)
  const pool = useMemo(() => (pastOnly ? pairs.filter((p) => p.years?.length) : pairs), [pairs, pastOnly])
  const [recent, setRecent] = useState([])
  const [question, setQuestion] = useState(() =>
    nextPairQuestion(startPastOnly ? pairs.filter((p) => p.years?.length) : pairs, []),
  )
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
  const [quizPast, setQuizPast] = useState(false)

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
            {mode === 'study' ? (
              <PastPaperPanel
                title="Pairs of words FPSC asked"
                intro="Q6 asks you to use five pairs in sentences that show the difference in meaning."
                items={pastPairItems(data.pairs)}
                initial={8}
                renderQuestion={(item) => <strong>{pairLabel(item)}</strong>}
                renderAnswer={(item) => <span>{item.words.map((w) => `${w.word} (${w.pos}): ${w.meaning}`).join(' · ')}</span>}
                action={
                  <button
                    type="button"
                    className="btn btn-primary ge-ppq-btn"
                    onClick={() => {
                      setQuizPast(true)
                      setMode('quiz')
                    }}
                  >
                    Quiz on past paper pairs
                  </button>
                }
              />
            ) : null}
            <div className="ge-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'study'} className={mode === 'study' ? 'is-active' : ''} onClick={() => setMode('study')}>
                Study list ({data.pairs.length})
              </button>
              <button type="button" role="tab" aria-selected={mode === 'quiz'} className={mode === 'quiz' ? 'is-active' : ''} onClick={() => {
                  setQuizPast(false)
                  setMode('quiz')
                }}>
                Unlimited quiz
              </button>
              <ScorePill value={store.progress.pairs.attempts ? store.progress.pairs.best : undefined} />
            </div>

            {mode === 'quiz' ? (
              <EndlessPairsQuiz key={quizPast ? 'past' : 'all'} pairs={sorted} store={store} startPastOnly={quizPast} onExit={() => setMode('study')} />
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

/* ---------------- Synonyms & antonyms (grouping of words) ---------------- */
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
          <ul className="ge-key-list">
            {set.pairs.map(([a, b], index) => (
              <li key={a}>
                <strong>
                  {a} – {b}
                </strong>
                {set.glosses?.[index] ? <span className="ge-muted"> · {set.glosses[index]}</span> : null}
              </li>
            ))}
          </ul>
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

function FpscVocabQuiz({ store }) {
  const state = useEnglishContent('past-papers')
  const [round, setRound] = useState(null)
  const [year, setYear] = useState(0)
  return (
    <ContentState state={state}>
      {(data) => {
        const years = data.years.filter((y) => y.vocabulary?.length)
        const bank = years
          .filter((y) => !year || y.year === year)
          .flatMap((y) =>
            y.vocabulary.map((v, index) => ({
              id: `fpsc-${y.year}-${index}`,
              type: 'mcq',
              prompt: `${v.word}: choose the word ${v.type === 'synonym' ? 'most similar' : 'most opposite'} in meaning. (CSS ${y.year})`,
              options: v.options,
              answer: v.answer,
              explanation: `${v.options[v.answer]} is the ${v.type === 'synonym' ? 'closest synonym' : 'clearest antonym'}.${v.note ? ` ${v.note}` : ''}`,
            })),
          )
        const start = () => setRound({ key: Date.now(), questions: prepareQuestions(bank, { limit: 20, shuffleOptions: false }) })
        if (round) {
          return (
            <QuizRunner
              key={round.key}
              title={year ? `FPSC ${year} synonyms and antonyms` : 'FPSC synonyms and antonyms'}
              questions={round.questions}
              onFinish={(result) => store.recordRound('fpscVocab', result)}
              onRestart={start}
              onExit={() => setRound(null)}
            />
          )
        }
        return (
          <div className="ge-topic">
            <p className="ge-muted">
              Since 2024, Q1 of the English paper has been 20 multiple-choice questions: ten synonyms and ten antonyms. Practise
              the real questions ({bank.length} in this selection). Answers are Guardian Angel&apos;s suggested key.
            </p>
            <div className="ge-tabs" role="tablist" aria-label="Choose a paper">
              <button type="button" role="tab" aria-selected={!year} className={!year ? 'is-active' : ''} onClick={() => setYear(0)}>
                All years
              </button>
              {years.map((y) => (
                <button
                  type="button"
                  role="tab"
                  key={y.year}
                  aria-selected={year === y.year}
                  className={year === y.year ? 'is-active' : ''}
                  onClick={() => setYear(y.year)}
                >
                  {y.year}
                </button>
              ))}
            </div>
            <div className="ge-actions">
              <button type="button" className="btn btn-primary" onClick={start} disabled={!bank.length}>
                Start {Math.min(20, bank.length)} questions
              </button>
              <ScorePill value={store.progress.fpscVocab?.attempts ? store.progress.fpscVocab.best : undefined} />
            </div>
          </div>
        )
      }}
    </ContentState>
  )
}

export function GroupingModule({ store }) {
  const state = useEnglishContent('grouping')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'synonyms'
  const [setId, setSetId] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const papers = usePastPapers()
  const tabs = [
    { id: 'synonyms', label: 'Synonyms' },
    { id: 'antonyms', label: 'Antonyms' },
    { id: 'fpsc', label: 'FPSC past paper MCQs' },
  ]
  return (
    <ContentState state={state}>
      {(data) => {
        const current = data.sets.find((s) => s.id === setId)
        if (current) {
          return <GroupingGame key={`${current.id}-${gameKey}`} set={current} store={store} onExit={() => setSetId(null)} />
        }
        const sets = data.sets.filter((s) => s.type === tab)
        const played = sets.filter((s) => store.progress.grouping[s.id]).length
        return (
          <div className="ge-topic">
            {tab !== 'fpsc' ? (
              <PastPaperPanel
                title="Synonyms and antonyms FPSC asked"
                intro="Q1 is 20 multiple-choice questions: ten words similar in meaning and ten opposite. These are the real questions."
                items={pastVocabularyItems(papers)}
                renderQuestion={(item) => <VocabQuestion item={item} />}
                renderAnswer={(item) => <VocabAnswer item={item} />}
                action={
                  <button type="button" className="btn btn-primary ge-ppq-btn" onClick={() => setParams({ tab: 'fpsc' })}>
                    Take the past paper quiz
                  </button>
                }
              />
            ) : null}
            <div className="ge-tabs" role="tablist" aria-label="Synonyms or antonyms">
              {tabs.map((t) => (
                <button
                  type="button"
                  role="tab"
                  key={t.id}
                  aria-selected={tab === t.id}
                  className={tab === t.id ? 'is-active' : ''}
                  onClick={() => setParams(t.id === 'synonyms' ? {} : { tab: t.id })}
                >
                  {t.label}
                  {t.id !== 'fpsc' ? ` (${data.sets.filter((s) => s.type === t.id).length} sets)` : ''}
                </button>
              ))}
            </div>
            {tab === 'fpsc' ? (
              <FpscVocabQuiz store={store} />
            ) : (
              <>
                <p className="ge-muted">
                  {tab === 'synonyms'
                    ? 'Each set has twenty words. Pair each word with the word closest in meaning.'
                    : 'Each set has twenty words. Pair each word with its opposite.'}{' '}
                  {played} of {sets.length} sets played · {sets.length * 10} pairs in total.
                </p>
                <div className="ge-grid ge-grid-compact">
                  {sets.map((s, index) => (
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
                      <p className="ge-muted">
                        20 words · 10 pairs{s.level ? ` · ${s.level === 'hard' ? 'Hard' : 'Medium'}` : ''}
                      </p>
                      <div className="ge-card-foot">
                        <ScorePill value={store.progress.grouping[s.id]?.best} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      }}
    </ContentState>
  )
}

/* ---------------- Vocabulary (spaced repetition) ---------------- */
const VOCAB_PAGE = 60

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
  const [letter, setLetter] = useState('')
  const [shown, setShown] = useState(VOCAB_PAGE)
  const papers = usePastPapers()
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
        const sorted = [...data.words].sort((a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }))
        const letters = new Set(sorted.map((w) => w.word.charAt(0).toUpperCase()))
        const filtered = sorted.filter(
          (w) =>
            (!letter || w.word.charAt(0).toUpperCase() === letter) &&
            (!q || w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q) || (w.urdu || '').includes(query.trim())),
        )
        return (
          <div className="ge-topic">
            <PastPaperPanel
              title="Words FPSC tested"
              intro="Every word below was asked in a CSS English paper. Learn its meaning, then search the word list for more."
              items={pastVocabularyItems(papers)}
              renderQuestion={(item) => <VocabQuestion item={item} />}
              renderAnswer={(item) => <VocabAnswer item={item} />}
            />
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
              onChange={(event) => {
                setQuery(event.target.value)
                setShown(VOCAB_PAGE)
              }}
              aria-label="Search vocabulary"
            />
            <nav className="ge-az" aria-label="Filter by letter">
              <button
                type="button"
                className={!letter ? 'is-active' : ''}
                onClick={() => {
                  setLetter('')
                  setShown(VOCAB_PAGE)
                }}
              >
                All
              </button>
              {LETTERS.map((l) =>
                letters.has(l) ? (
                  <button
                    type="button"
                    key={l}
                    className={letter === l ? 'is-active' : ''}
                    onClick={() => {
                      setLetter(l)
                      setShown(VOCAB_PAGE)
                    }}
                  >
                    {l}
                  </button>
                ) : (
                  <span key={l} aria-hidden="true">
                    {l}
                  </span>
                ),
              )}
            </nav>
            <p className="ge-muted">
              Showing {Math.min(shown, filtered.length)} of {filtered.length} words
              {letter || q ? ` (filtered from ${data.words.length})` : ''}, A to Z.
            </p>
            <div className="ge-wordlist">
              {filtered.slice(0, shown).map((w) => (
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
            {filtered.length > shown ? (
              <div className="ge-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShown(shown + VOCAB_PAGE)}>
                  Show {Math.min(VOCAB_PAGE, filtered.length - shown)} more words
                </button>
              </div>
            ) : null}
          </div>
        )
      }}
    </ContentState>
  )
}

/* ---------------- Past paper references ---------------- */
function useAllContent(names) {
  const a = useEnglishContent(names[0])
  const b = useEnglishContent(names[1])
  const c = useEnglishContent(names[2])
  const states = [a, b, c]
  return {
    loading: states.some((s) => s.loading),
    error: states.find((s) => s.error)?.error || null,
    data: states.every((s) => s.data) ? states.map((s) => s.data) : null,
  }
}

function RevealList({ title, items, render, answer }) {
  const [shown, setShown] = useState(false)
  if (!items.length) return null
  return (
    <section className="ge-pp-block">
      <div className="ge-pp-block-head">
        <h4>{title}</h4>
        <button type="button" className="ge-link-btn" onClick={() => setShown(!shown)}>
          {shown ? 'Hide answers' : 'Show suggested answers'}
        </button>
      </div>
      <ol className="ge-pp-list">
        {items.map((item, index) => (
          <li key={index}>
            {render(item)}
            {shown ? <p className="ge-pp-answer">{answer(item)}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function PastPapersModule() {
  const state = useAllContent(['past-papers', 'sentence-correction', 'pairs-of-words'])
  const [params, setParams] = useSearchParams()
  return (
    <ContentState state={state}>
      {([papers, correction, pairs]) => {
        const byYear = new Map()
        const ensure = (year) => {
          if (!byYear.has(year)) byYear.set(year, { year, corrections: [], pairs: [], paper: null })
          return byYear.get(year)
        }
        papers.years.forEach((p) => {
          ensure(p.year).paper = p
        })
        correction.items.forEach((item) => (item.years || []).forEach((y) => ensure(y).corrections.push(item)))
        pairs.pairs.forEach((pair) => (pair.years || []).forEach((y) => ensure(y).pairs.push(pair)))
        const years = [...byYear.keys()].sort((x, y) => y - x)
        const selected = Number(params.get('year')) || years[0]
        const entry = byYear.get(selected) || byYear.get(years[0])
        const paper = entry.paper
        const counts = (y) => {
          const e = byYear.get(y)
          return e.corrections.length + e.pairs.length + (e.paper?.vocabulary?.length || 0) + (e.paper?.prepositions?.length || 0)
        }

        return (
          <div className="ge-topic">
            <p className="ge-lead">
              What FPSC actually asked in the English (Précis &amp; Composition) paper, year by year. Questions are reproduced
              from the papers; answers are Guardian Angel&apos;s suggested answers, because FPSC does not publish answer keys.
            </p>
            <nav className="ge-year-picker" aria-label="Choose a year">
              {years.map((y) => (
                <button
                  type="button"
                  key={y}
                  className={y === entry.year ? 'is-active' : ''}
                  onClick={() => setParams({ year: String(y) })}
                  aria-current={y === entry.year ? 'true' : undefined}
                >
                  {y}
                  <span>{counts(y)}</span>
                </button>
              ))}
            </nav>

            <article className="ge-card ge-pp-year">
              <header className="ge-pp-head">
                <div>
                  <h3>CSS {entry.year}: English (Précis &amp; Composition)</h3>
                  <p className="ge-muted">
                    {paper?.official
                      ? 'Official FPSC paper.'
                      : paper?.sources?.length
                        ? 'Compiled from published copies of the paper.'
                        : 'Pairs of words and sentences recorded from this year’s paper.'}
                  </p>
                </div>
                {paper?.pdf ? (
                  <a className="btn btn-secondary" href={paper.pdf} target="_blank" rel="noopener noreferrer">
                    Open the FPSC paper (PDF)
                  </a>
                ) : null}
              </header>

              {paper?.outline?.length ? (
                <div className="ge-table-wrap">
                  <table className="ge-table">
                    <thead>
                      <tr>
                        <th scope="col">Question</th>
                        <th scope="col">What was asked</th>
                        <th scope="col">Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paper.outline.map((row) => (
                        <tr key={row.q}>
                          <td>{row.q}</td>
                          <td>{row.part}</td>
                          <td>{row.marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : paper?.outlineText ? (
                <p>{paper.outlineText}</p>
              ) : null}

              {entry.corrections.length ? (
                <section className="ge-pp-block">
                  <div className="ge-pp-block-head">
                    <h4>Correct the sentences ({entry.corrections.length})</h4>
                    <Link className="ge-link-btn" to={`/guardian-english/sentence-correction?past=${entry.year}`}>
                      Practise these →
                    </Link>
                  </div>
                  <ol className="ge-pp-list">
                    {entry.corrections.map((item) => (
                      <li key={item.id}>{item.sentence}</li>
                    ))}
                  </ol>
                </section>
              ) : null}

              <RevealList
                key={`vocab-${entry.year}`}
                title={`Synonyms and antonyms (${paper?.vocabulary?.length || 0})`}
                items={paper?.vocabulary || []}
                render={(v) => (
                  <span>
                    <strong>{v.word}</strong> <span className="ge-muted">({v.type === 'synonym' ? 'similar' : 'opposite'})</span>
                    {v.options?.length ? `: ${v.options.map((o, i) => `(${'ABCD'[i]}) ${o}`).join('  ')}` : ''}
                  </span>
                )}
                answer={(v) =>
                  Number.isInteger(v.answer) ? `${'ABCD'[v.answer]}: ${v.options[v.answer]}${v.note ? `. ${v.note}` : ''}` : v.answerText || ''
                }
              />
              {paper?.vocabulary?.some((v) => v.options?.length) ? (
                <p className="ge-muted">
                  <Link to="/guardian-english/synonyms-antonyms?tab=fpsc">Practise the FPSC synonym and antonym questions →</Link>
                </p>
              ) : null}

              <RevealList
                key={`prep-${entry.year}`}
                title={`Fill in the prepositions (${paper?.prepositions?.length || 0})`}
                items={paper?.prepositions || []}
                render={(p) => <span>{p.sentence}</span>}
                answer={(p) => p.answer}
              />

              {entry.pairs.length ? (
                <section className="ge-pp-block">
                  <div className="ge-pp-block-head">
                    <h4>Pairs of words ({entry.pairs.length})</h4>
                    <Link className="ge-link-btn" to="/guardian-english/pairs-of-words">
                      Study pairs →
                    </Link>
                  </div>
                  <ul className="ge-pp-pairs">
                    {entry.pairs.map((pair) => (
                      <li key={pair.id}>{pair.words.map((w) => w.word).join(' / ')}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {paper?.sources?.length ? (
                <p className="ge-muted ge-pp-sources">
                  Sources:{' '}
                  {paper.sources.map((url, index) => (
                    <span key={url}>
                      {index ? ', ' : ''}
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {hostOf(url)}
                      </a>
                    </span>
                  ))}
                </p>
              ) : null}
            </article>
          </div>
        )
      }}
    </ContentState>
  )
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
