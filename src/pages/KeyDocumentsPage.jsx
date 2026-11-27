import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import '../styles/keydocs.css'
import { handlePdfAction } from '../pdfNativeBridge.js'
import catalogue from '../data/keyDocuments.json'
import { CATEGORIES, SCOPES, SUBJECT_GROUPS, SUBJECT_LABEL } from '../keydocs/cssSubjects.js'
import { INTERNATIONAL_PORTALS, PAKISTAN_PORTALS } from '../keydocs/portals.js'

// Documents hosted on Guardian Angel (full text, view or download).
const HOSTED_PDFS = {
  'constitution-of-pakistan': {
    url: new URL('../../data/Constitution of Pakistan.pdf', import.meta.url).href,
    fileName: 'Constitution of Pakistan.pdf',
  },
  udhr: { url: new URL('../../data/UDHR.pdf', import.meta.url).href, fileName: 'UDHR.pdf' },
  'un-charter': { url: new URL('../../data/UN Charter.pdf', import.meta.url).href, fileName: 'UN Charter.pdf' },
}

const DOCUMENTS = catalogue.documents.map((d) => ({ ...d, hosted: HOSTED_PDFS[d.id] || null }))
const SUBJECT_COUNTS = DOCUMENTS.reduce((acc, d) => {
  d.subjects.forEach((s) => {
    acc[s] = (acc[s] || 0) + 1
  })
  return acc
}, {})
const COVERED_SUBJECTS = Object.keys(SUBJECT_COUNTS).length

const CATEGORY_ICON = {
  'Constitution & Constitutional History': '§',
  'Laws & Codes': '⚖',
  'Policies & Strategies': '◈',
  'Economy & Official Reports': '▤',
  'Historical Documents': '✒',
  'Islamic Sources': '۞',
  'Treaties & Conventions': '✦',
  'UN & Global Frameworks': '◎',
  'Regional & Bilateral Agreements': '⇄',
}

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

function openPdf(event, doc, action) {
  event.preventDefault()
  event.stopPropagation()
  handlePdfAction({ pdfUrl: doc.hosted.url, fileName: doc.hosted.fileName, action })
}

function DocActions({ doc }) {
  return (
    <div className="kd-actions">
      {doc.hosted ? (
        <>
          <a
            className="kd-btn kd-btn-primary"
            href={doc.hosted.url}
            target="_blank"
            rel="noreferrer"
            data-ga-pdf-url={doc.hosted.url}
            data-ga-pdf-name={doc.hosted.fileName}
            onClick={(e) => openPdf(e, doc, 'view')}
          >
            View PDF
          </a>
          <a
            className="kd-btn"
            href={doc.hosted.url}
            download={doc.hosted.fileName}
            data-ga-pdf-url={doc.hosted.url}
            data-ga-pdf-name={doc.hosted.fileName}
            onClick={(e) => openPdf(e, doc, 'download')}
          >
            Download
          </a>
        </>
      ) : null}
      {doc.url ? (
        <a className={`kd-btn ${doc.hosted ? '' : 'kd-btn-primary'}`} href={doc.url} target="_blank" rel="noopener noreferrer">
          Official text <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </div>
  )
}

function SubjectTags({ subjects, active, onPick, max = 4 }) {
  return (
    <ul className="kd-tags" aria-label="CSS subjects">
      {subjects.slice(0, max).map((s) => (
        <li key={s}>
          <button type="button" className={s === active ? 'is-active' : ''} onClick={() => onPick(s)}>
            {SUBJECT_LABEL[s] || s}
          </button>
        </li>
      ))}
      {subjects.length > max ? <li className="kd-tags-more">+{subjects.length - max}</li> : null}
    </ul>
  )
}

function DocRow({ doc, subject, onPick }) {
  return (
    <article className="kd-row">
      <div className="kd-row-year" aria-label={`Year ${doc.year}`}>
        {doc.year}
      </div>
      <div className="kd-row-body">
        <h4>
          {doc.short || doc.title}
          {doc.hosted ? <span className="kd-badge">Full text on Guardian Angel</span> : null}
        </h4>
        {doc.short && doc.short !== doc.title ? <p className="kd-row-full">{doc.title}</p> : null}
        <p className="kd-row-meta">
          {doc.issuer}
          {doc.source ? <span> · Source: {doc.source}</span> : null}
        </p>
        <p className="kd-row-summary">{doc.summary}</p>
        <SubjectTags subjects={doc.subjects} active={subject} onPick={onPick} />
      </div>
      <DocActions doc={doc} />
    </article>
  )
}

export default function KeyDocumentsPage() {
  const [params, setParams] = useSearchParams()
  const subject = params.get('subject') || ''
  const scope = params.get('scope') || 'all'
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  const update = (next) => {
    const merged = { subject, scope, ...next }
    const clean = {}
    if (merged.subject) clean.subject = merged.subject
    if (merged.scope && merged.scope !== 'all') clean.scope = merged.scope
    setParams(clean, { replace: true })
  }
  const pickSubject = (s) => {
    update({ subject: s === subject ? '' : s })
    document.getElementById('kd-browse')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const filtered = useMemo(() => {
    const q = norm(query.trim())
    return DOCUMENTS.filter(
      (d) =>
        (!subject || d.subjects.includes(subject)) &&
        (scope === 'all' || d.jurisdiction === scope) &&
        (!category || d.category === category) &&
        (!q || norm(`${d.title} ${d.short} ${d.issuer} ${d.summary} ${d.year}`).includes(q)),
    ).sort((a, b) => {
      const ai = a.subjects.indexOf(subject)
      const bi = b.subjects.indexOf(subject)
      if (subject && ai !== bi) return ai - bi
      return String(a.year).localeCompare(String(b.year))
    })
  }, [query, subject, scope, category])

  const grouped = CATEGORIES.map((c) => ({ category: c, docs: filtered.filter((d) => d.category === c) })).filter(
    (g) => g.docs.length,
  )
  const essentials = DOCUMENTS.filter((d) => d.essential).slice(0, 12)
  const categoryCounts = CATEGORIES.map((c) => ({
    c,
    n: DOCUMENTS.filter(
      (d) =>
        d.category === c && (!subject || d.subjects.includes(subject)) && (scope === 'all' || d.jurisdiction === scope),
    ).length,
  })).filter((x) => x.n)

  return (
    <main className="page-main kd-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>CSS Resource Library</p>
          <h2>Source Vault</h2>
        </div>

        <div className="kd-hero">
          <p className="kd-lead">
            The constitutions, laws, treaties, policies and historic texts that CSS examiners expect you to cite, each
            linked to its official source and mapped to the subjects it serves. Quote the primary text, not a summary of it.
          </p>
          <dl className="kd-stats">
            <div>
              <dt>Documents</dt>
              <dd>{DOCUMENTS.length}</dd>
            </div>
            <div>
              <dt>CSS subjects covered</dt>
              <dd>{COVERED_SUBJECTS}</dd>
            </div>
            <div>
              <dt>Sources</dt>
              <dd>Official</dd>
            </div>
          </dl>
        </div>

        {essentials.length ? (
          <section className="kd-section" aria-labelledby="kd-essentials">
            <div className="kd-section-head">
              <h3 id="kd-essentials">Start with the essentials</h3>
              <p>The documents that come up across almost every paper.</p>
            </div>
            <div className="kd-essentials">
              {essentials.map((d) => (
                <article className="kd-card" key={d.id}>
                  <p className="kd-card-kicker">
                    <span aria-hidden="true">{CATEGORY_ICON[d.category]}</span> {d.jurisdiction} · {d.year}
                  </p>
                  <h4>{d.short || d.title}</h4>
                  <p className="kd-card-summary">{d.summary}</p>
                  <SubjectTags subjects={d.subjects} active={subject} onPick={pickSubject} max={3} />
                  <DocActions doc={d} />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="kd-section" aria-labelledby="kd-subjects-title">
          <div className="kd-section-head">
            <h3 id="kd-subjects-title">Browse by CSS subject</h3>
            <p>Pick your subject to see the documents worth citing in it.</p>
          </div>
          <div className="kd-subject-groups">
            {SUBJECT_GROUPS.map((g) => {
              const items = g.subjects.filter(([slug]) => SUBJECT_COUNTS[slug])
              if (!items.length) return null
              return (
                <div className="kd-subject-group" key={g.id}>
                  <h4>{g.label}</h4>
                  <ul>
                    {items.map(([slug, label]) => (
                      <li key={slug}>
                        <button
                          type="button"
                          className={subject === slug ? 'is-active' : ''}
                          onClick={() => pickSubject(slug)}
                          aria-pressed={subject === slug}
                        >
                          <span>{label}</span>
                          <span className="kd-count">{SUBJECT_COUNTS[slug]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        <section className="kd-section" id="kd-browse" aria-labelledby="kd-browse-title">
          <div className="kd-section-head">
            <h3 id="kd-browse-title">
              {subject ? `Documents for ${SUBJECT_LABEL[subject] || subject}` : 'The full library'}
            </h3>
            <p>
              {filtered.length} of {DOCUMENTS.length} documents
              {subject ? (
                <>
                  {' '}
                  ·{' '}
                  <button type="button" className="kd-link" onClick={() => update({ subject: '' })}>
                    Show all subjects
                  </button>
                </>
              ) : null}
            </p>
          </div>

          <div className="kd-toolbar">
            <input
              className="kd-search"
              type="search"
              placeholder="Search: e.g. UNCLOS, 18th Amendment, refugees, 1973"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search documents"
            />
            <label className="kd-select">
              <span>Subject</span>
              <select value={subject} onChange={(e) => update({ subject: e.target.value })}>
                <option value="">All subjects</option>
                {SUBJECT_GROUPS.map((g) => (
                  <optgroup key={g.id} label={g.label}>
                    {g.subjects
                      .filter(([slug]) => SUBJECT_COUNTS[slug])
                      .map(([slug, label]) => (
                        <option key={slug} value={slug}>
                          {label} ({SUBJECT_COUNTS[slug]})
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="kd-segment" role="group" aria-label="Scope">
              {SCOPES.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  className={scope === s.id ? 'is-active' : ''}
                  aria-pressed={scope === s.id}
                  onClick={() => update({ scope: s.id })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="kd-chips" role="group" aria-label="Category">
            <button type="button" className={!category ? 'is-active' : ''} onClick={() => setCategory('')}>
              All types
            </button>
            {categoryCounts.map(({ c, n }) => (
              <button type="button" key={c} className={category === c ? 'is-active' : ''} onClick={() => setCategory(category === c ? '' : c)}>
                <span aria-hidden="true">{CATEGORY_ICON[c]}</span> {c} <span className="kd-count">{n}</span>
              </button>
            ))}
          </div>

          {grouped.length ? (
            grouped.map((g) => (
              <div className="kd-group" key={g.category}>
                <h4 className="kd-group-title">
                  <span aria-hidden="true">{CATEGORY_ICON[g.category]}</span> {g.category}
                  <span className="kd-count">{g.docs.length}</span>
                </h4>
                <div className="kd-rows">
                  {g.docs.map((d) => (
                    <DocRow key={d.id} doc={d} subject={subject} onPick={pickSubject} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="kd-empty">No documents match. Try another subject, clear the search or choose “All”.</p>
          )}
        </section>

        <section className="kd-section" aria-labelledby="kd-portals">
          <div className="kd-section-head">
            <h3 id="kd-portals">Official portals</h3>
            <p>Where new laws, policies, reports and resolutions are published first.</p>
          </div>
          <div className="kd-portals">
            {[
              { title: 'Pakistan', groups: PAKISTAN_PORTALS },
              { title: 'International', groups: INTERNATIONAL_PORTALS },
            ].map((side) => (
              <div className="kd-portal-side" key={side.title}>
                <h4>{side.title}</h4>
                {side.groups.map((g) => (
                  <details key={g.category}>
                    <summary>
                      {g.category} <span className="kd-count">{g.links.length}</span>
                    </summary>
                    <ul>
                      {g.links.map((l) => (
                        <li key={l.url}>
                          <a href={l.url} target="_blank" rel="noopener noreferrer">
                            {l.label} <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            ))}
          </div>
          <p className="kd-note">
            Links open the issuing body&apos;s own website. Texts change through amendments; always check the latest
            version before quoting it in the exam.
          </p>
        </section>
      </section>
    </main>
  )
}
