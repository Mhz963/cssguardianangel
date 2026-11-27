import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import '../styles/newsdesk.css'
import { PAKISTAN_SOURCES, WORLD_SOURCES } from '../news/newsSources.js'

const REGIONS = [
  { id: 'pakistan', label: 'Pakistan' },
  { id: 'world', label: 'World' },
]
const TOPICS = [
  { id: 'governance', label: 'Politics & Governance' },
  { id: 'economy', label: 'Economy' },
  { id: 'security', label: 'Security' },
  { id: 'diplomacy', label: 'Diplomacy' },
  { id: 'climate', label: 'Climate & Environment' },
  { id: 'technology', label: 'Science & Tech' },
  { id: 'science', label: 'Health & Education' },
]
const TOPIC_LABEL = Object.fromEntries(TOPICS.map((t) => [t.id, t.label]))
const PAGE = 18

function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function Thumb({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
}

function Story({ item, lead = false }) {
  return (
    <a className={`nd-story ${lead ? 'is-lead' : ''} ${item.image ? 'has-image' : ''}`} href={item.url} target="_blank" rel="noopener noreferrer">
      {item.image ? (
        <div className="nd-story-media">
          <Thumb src={item.image} />
        </div>
      ) : null}
      <div className="nd-story-body">
        <p className="nd-story-meta">
          <span className="nd-source">{item.source}</span>
          {item.date ? <span>{timeAgo(item.date)}</span> : null}
        </p>
        <h3>{item.title}</h3>
        {item.summary ? <p className="nd-story-summary">{item.summary}</p> : null}
        {item.topics?.length ? (
          <p className="nd-story-topics">
            {item.topics.map((t) => (
              <span key={t}>{TOPIC_LABEL[t] || t}</span>
            ))}
          </p>
        ) : null}
      </div>
    </a>
  )
}

export default function NewsDeskPage() {
  const [params, setParams] = useSearchParams()
  const region = params.get('region') === 'world' ? 'world' : 'pakistan'
  const [topic, setTopic] = useState('')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/news')
      if (!res.ok) throw new Error('bad status')
      const json = await res.json()
      if (!json.pakistan?.length && !json.world?.length) throw new Error('empty')
      setData(json)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const all = data?.[region] || []
  const topicCounts = useMemo(() => {
    const counts = {}
    all.forEach((i) => i.topics.forEach((t) => (counts[t] = (counts[t] || 0) + 1)))
    return counts
  }, [all])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter(
      (i) => (!topic || i.topics.includes(topic)) && (!q || `${i.title} ${i.summary} ${i.source}`.toLowerCase().includes(q)),
    )
  }, [all, topic, query])
  const lead = filtered.find((i) => i.image) || filtered[0]
  const rest = filtered.filter((i) => i !== lead)
  const sourcesUsed = [...new Set(all.map((i) => i.source))]

  const switchRegion = (id) => {
    setParams(id === 'pakistan' ? {} : { region: id }, { replace: true })
    setTopic('')
    setShown(PAGE)
  }

  return (
    <main className="page-main nd-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>Guardian Angel Resources</p>
          <h2>Guardian News Desk</h2>
        </div>
        <p className="nd-lead">
          Today&apos;s Pakistan and world headlines from trusted outlets, sorted by the themes CSS papers ask about. Read
          the full story at the source, then turn it into your own notes for Current Affairs, Pakistan Affairs and the Essay.
        </p>

        <div className="nd-bar">
          <div className="nd-segment" role="tablist" aria-label="Region">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={region === r.id}
                className={region === r.id ? 'is-active' : ''}
                onClick={() => switchRegion(r.id)}
              >
                {r.label}
                {data ? <span className="nd-count">{data[r.id]?.length || 0}</span> : null}
              </button>
            ))}
          </div>
          <input
            className="nd-search"
            type="search"
            placeholder={region === 'pakistan' ? 'Search Pakistan headlines: IMF, budget, CPEC…' : 'Search world headlines: Gaza, climate, UN…'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShown(PAGE)
            }}
            aria-label="Search headlines"
          />
          <div className="nd-status">
            {data ? <span>Updated {timeAgo(data.updatedAt)}</span> : null}
            <button type="button" className="nd-refresh" onClick={load} disabled={status === 'loading'}>
              {status === 'loading' ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {data ? (
          <div className="nd-topics" role="group" aria-label="Filter by theme">
            <button type="button" className={!topic ? 'is-active' : ''} onClick={() => setTopic('')}>
              All themes
            </button>
            {TOPICS.filter((t) => topicCounts[t.id]).map((t) => (
              <button
                type="button"
                key={t.id}
                className={topic === t.id ? 'is-active' : ''}
                onClick={() => {
                  setTopic(topic === t.id ? '' : t.id)
                  setShown(PAGE)
                }}
              >
                {t.label} <span className="nd-count">{topicCounts[t.id]}</span>
              </button>
            ))}
          </div>
        ) : null}

        {status === 'loading' && !data ? (
          <div className="nd-skeleton" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} />
            ))}
          </div>
        ) : null}

        {status === 'error' && !data ? (
          <div className="nd-error" role="status">
            <h3>Headlines could not be loaded right now</h3>
            <p>Please try again in a moment, or open one of the trusted sources below.</p>
            <button type="button" className="btn btn-primary" onClick={load}>
              Try again
            </button>
          </div>
        ) : null}

        {data ? (
          filtered.length ? (
            <>
              <div className="nd-front">
                {lead ? <Story item={lead} lead /> : null}
                <ol className="nd-latest" aria-label="Latest">
                  {rest.slice(0, 5).map((i) => (
                    <li key={i.url}>
                      <a href={i.url} target="_blank" rel="noopener noreferrer">
                        <span className="nd-source">{i.source}</span>
                        <strong>{i.title}</strong>
                        <span className="nd-time">{timeAgo(i.date)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="nd-grid">
                {rest.slice(5, 5 + shown).map((i) => (
                  <Story key={i.url} item={i} />
                ))}
              </div>
              {rest.length > 5 + shown ? (
                <div className="nd-more">
                  <button type="button" className="btn btn-secondary" onClick={() => setShown(shown + PAGE)}>
                    Show more headlines ({rest.length - 5 - shown} more)
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="nd-empty">No headlines match. Try another theme or a broader search.</p>
          )
        ) : null}

        {data ? (
          <p className="nd-credit">
            Headlines from {sourcesUsed.join(', ')}, via their public news feeds. Each story opens on the publisher&apos;s own
            website. Refreshed every 15 minutes.
          </p>
        ) : null}

        <section className="nd-section" aria-labelledby="nd-deeper">
          <h3 id="nd-deeper">Go deeper</h3>
          <div className="nd-deeper">
            <Link className="nd-deeper-card" to="/guardian-conflict-atlas">
              <strong>Guardian Conflict Atlas</strong>
              <span>Every ongoing conflict on a map, with sides, casualties and sources.</span>
            </Link>
            <Link className="nd-deeper-card" to="/source-vault">
              <strong>Source Vault</strong>
              <span>The treaties, laws and policies behind the headlines, mapped to CSS subjects.</span>
            </Link>
            <Link className="nd-deeper-card" to="/blogs">
              <strong>Guardian Blogs</strong>
              <span>Explainers and notes on current affairs for CSS aspirants.</span>
            </Link>
          </div>
        </section>

        <section className="nd-section" aria-labelledby="nd-sources">
          <h3 id="nd-sources">Trusted sources</h3>
          <p className="nd-muted">Bookmark these for research beyond the headlines.</p>
          <div className="nd-sources">
            {[
              { title: 'Pakistan', groups: PAKISTAN_SOURCES },
              { title: 'World', groups: WORLD_SOURCES },
            ].map((side) => (
              <div key={side.title} className="nd-sources-side">
                <h4>{side.title}</h4>
                {side.groups.map((g) => (
                  <details key={g.category}>
                    <summary>
                      {g.category} <span className="nd-count">{g.sources.length}</span>
                    </summary>
                    <ul>
                      {g.sources.map((s) => (
                        <li key={s.url}>
                          <a href={s.url} target="_blank" rel="noopener noreferrer">
                            {s.name} <span aria-hidden="true">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
