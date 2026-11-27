import { Link } from 'react-router-dom'
import '../styles/pptopics.css'
import { FPSC_CSS_PAST_PAPERS_SOURCE, cssPastPapersByYear } from '../data/cssPastPapersData.js'
import { useState } from 'react'

export default function CssPastPapersPage() {
  const [query, setQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(() => cssPastPapersByYear[0]?.year || '')
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false)
  const normalizedQuery = query.trim().toLowerCase()
  const paperCount = cssPastPapersByYear.reduce((total, item) => total + item.papers.length, 0)
  const selectedYearData = cssPastPapersByYear.find((item) => item.year === selectedYear) || null
  const visiblePapers = selectedYearData
    ? normalizedQuery
      ? selectedYearData.papers.filter((paper) => paper.title.toLowerCase().includes(normalizedQuery))
      : selectedYearData.papers
    : []

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Past Papers</p>
          <h2>
            CSS {selectedYearData?.year || cssPastPapersByYear[0]?.year || ''} Descriptive Papers
          </h2>
        </div>

        <p className="rules-source">
          Official source:{' '}
          <a href={FPSC_CSS_PAST_PAPERS_SOURCE} target="_blank" rel="noreferrer">
            FPSC Previous Question Papers (CSS)
          </a>
        </p>

        <Link className="pp-topicwise-cta" to="/css-past-papers/topic-wise">
          <span>New</span>
          <strong>Topic-wise past papers</strong>
          <em>Every question sorted by syllabus topic, with the most repeated topics →</em>
        </Link>

        <div className="papers-toolbar">
          <div className={`year-select ${isYearMenuOpen ? 'open' : ''}`}>
            <button
              className="year-select-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isYearMenuOpen}
              onClick={() => setIsYearMenuOpen((current) => !current)}
            >
              <span>{selectedYear || 'Select year'}</span>
              <span className="year-select-icon">⌄</span>
            </button>
            {isYearMenuOpen ? (
              <div className="year-select-menu" role="listbox" aria-label="Select CSS past papers year">
                {cssPastPapersByYear.map((item) => (
                  <button
                    key={item.year}
                    type="button"
                    role="option"
                    aria-selected={selectedYear === item.year}
                    className={selectedYear === item.year ? 'selected' : ''}
                    onClick={() => {
                      setSelectedYear(item.year)
                      setQuery('')
                      setIsYearMenuOpen(false)
                    }}
                  >
                    {item.year}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <input
            type="search"
            placeholder="Search paper name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search CSS past papers"
            disabled={!selectedYearData}
          />
          <p>{selectedYearData ? `${visiblePapers.length} papers` : `${paperCount} papers total`}</p>
        </div>

        {!selectedYearData ? (
          <article className="papers-empty">
            <h3>Select a year to view papers</h3>
            <p>Choose a year from the dropdown above. Papers for that year will appear instantly.</p>
          </article>
        ) : (
          <>
            <p className="papers-year-source">
              Source:{' '}
              <a href={selectedYearData.sourceUrl} target="_blank" rel="noreferrer">
                FPSC Question Papers CSS-{selectedYearData.year}
              </a>
            </p>

            <div className="papers-grid">
              {visiblePapers.map((paper) => (
                <article className="paper-item" key={paper.url}>
                  <h3>{paper.title}</h3>
                  <a className="btn btn-primary" href={paper.url} target="_blank" rel="noreferrer">
                    Open PDF
                  </a>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
