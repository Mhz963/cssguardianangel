import { useMemo, useState } from 'react'

const newestYear = (item) => Math.max(...item.years)

/**
 * Highlighted "Past Paper Questions" block shown at the top of every English Lab module.
 * items: [{ key, years: [YYYY], ... }]; renderQuestion / renderAnswer draw one item.
 */
export default function PastPaperPanel({ title, intro, items, renderQuestion, renderAnswer, action, initial = 5 }) {
  const [year, setYear] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [reveal, setReveal] = useState(false)
  const years = useMemo(() => [...new Set(items.flatMap((i) => i.years))].sort((a, b) => b - a), [items])
  if (!items.length) return null

  const filtered = (year ? items.filter((i) => i.years.includes(year)) : items).slice().sort((a, b) => newestYear(b) - newestYear(a))
  const visible = showAll ? filtered : filtered.slice(0, initial)
  const span = years.length > 1 ? `${years[years.length - 1]}–${years[0]}` : String(years[0])

  return (
    <section className="ge-ppq" aria-label={title}>
      <header className="ge-ppq-head">
        <div>
          <p className="ge-ppq-kicker">
            <span aria-hidden="true">★</span> Past Paper Questions · FPSC {span}
          </p>
          <h3 className="ge-ppq-title">{title}</h3>
          {intro ? <p className="ge-ppq-intro">{intro}</p> : null}
        </div>
        <span className="ge-ppq-count">
          <strong>{items.length}</strong> from {years.length} {years.length === 1 ? 'paper' : 'papers'}
        </span>
      </header>

      <div className="ge-ppq-tools">
        <label className="ge-ppq-select">
          <span>Year</span>
          <select
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value))
              setShowAll(false)
            }}
          >
            <option value={0}>All years ({items.length})</option>
            {years.map((y) => (
              <option key={y} value={y}>
                CSS {y} ({items.filter((i) => i.years.includes(y)).length})
              </option>
            ))}
          </select>
        </label>
        {renderAnswer ? (
          <button type="button" className="btn btn-secondary ge-ppq-btn" onClick={() => setReveal(!reveal)}>
            {reveal ? 'Hide answers' : 'Show answers'}
          </button>
        ) : null}
        {action}
      </div>

      <ol className="ge-ppq-list">
        {visible.map((item) => (
          <li key={item.key}>
            <span className="ge-ppq-year">CSS {item.years.join(' · ')}</span>
            <div className="ge-ppq-q">{renderQuestion(item)}</div>
            {reveal && renderAnswer ? <div className="ge-ppq-a">{renderAnswer(item)}</div> : null}
          </li>
        ))}
      </ol>

      {filtered.length > initial ? (
        <button type="button" className="ge-link-btn ge-ppq-more" onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show fewer' : `Show all ${filtered.length} questions${year ? ` from ${year}` : ''}`}
        </button>
      ) : null}
      {renderAnswer ? (
        <p className="ge-ppq-note">Answers are Guardian Angel&apos;s suggested answers; FPSC does not publish answer keys.</p>
      ) : null}
    </section>
  )
}
