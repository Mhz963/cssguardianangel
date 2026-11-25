import { Suspense, lazy, useEffect, useState } from 'react'
import { formatNewsTimestamp } from '../utils/formatNewsTimestamp.js'
import { useLocation, useNavigate } from 'react-router-dom'

const GlobalConflictMapTab = lazy(() => import('../GlobalConflictMapTab.jsx'))

function NewsCardMedia({ image }) {
  const [hasLoadError, setHasLoadError] = useState(false)
  const hasImage = typeof image === 'string' && image.trim() && !hasLoadError

  return (
    <div className="current-affairs-card-media" aria-hidden="true">
      {hasImage ? (
        <img src={image} alt="" loading="lazy" onError={() => setHasLoadError(true)} />
      ) : (
        <div className="current-affairs-card-media-fallback">
          <span>Image not available</span>
        </div>
      )}
    </div>
  )
}

function WorldAffairsPage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('global')
  const [, setLastUpdatedAt] = useState(null)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [refreshSeed, setRefreshSeed] = useState(0)

  const pageSize = 24
  const maxResultsCap = 100000
  const effectiveTotal = Math.min(totalResults || 0, maxResultsCap)
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize) || 1)

  const fetchNews = async () => {
    setItems([])
    setTotalResults(0)
    setLastUpdatedAt(null)
    setError('Live Global Affairs news feed has been disabled.')
    setStatus('error')
  }

  useEffect(() => {
    fetchNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery, page, refreshSeed])

  const handleRefresh = () => {
    setRefreshSeed((current) => current + 1)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextAppliedQuery = query.trim() || 'global'
    setAppliedQuery(nextAppliedQuery)
    setPage(1)
  }

  return (
    <section className="current-affairs-shell">
      <div className="current-affairs-toolbar glass-panel">
        <div className="current-affairs-toolbar-head">
          <h3>Global headlines</h3>
          <p>Live news feed is currently disabled.</p>
        </div>

        <form className="current-affairs-search" onSubmit={handleSubmit}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search topics (e.g., elections, economy, climate, tech)"
            aria-label="Search global affairs"
          />
          <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
            Search
          </button>
          <button className="btn btn-secondary" type="button" onClick={handleRefresh} disabled={status === 'loading'}>
            Refresh
          </button>
        </form>
      </div>

      {status === 'loading' ? (
        <div className="current-affairs-loading">
          <p>Fetching the latest headlines…</p>
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="current-affairs-error glass-panel">
          <h3>Couldn’t load news</h3>
          <p>{error}</p>
          <button className="btn btn-primary" type="button" onClick={handleRefresh}>
            Try again
          </button>
        </div>
      ) : null}

      {status === 'success' ? (
        <>
          <div className="current-affairs-grid">
            {items.length === 0 ? (
              <div className="current-affairs-empty glass-panel">
                <h3>No results</h3>
                <p>Try searching a broader topic like “global”, “economy”, or “technology”.</p>
              </div>
            ) : (
              items.map((article) => (
                <a
                  key={article.id}
                  className="current-affairs-card"
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <NewsCardMedia image={article.image} />
                  <div className="current-affairs-card-body">
                    <p className="current-affairs-meta">
                      <span>{article.domain || article.source || 'Global'}</span>
                      {article.date ? <span>• {formatNewsTimestamp(article.date)}</span> : null}
                    </p>
                    <h3>{article.title}</h3>
                    {article.snippet ? <p className="current-affairs-snippet">{article.snippet}</p> : null}
                    <span className="current-affairs-readmore">Read full story →</span>
                  </div>
                </a>
              ))
            )}
          </div>

          {items.length > 0 ? (
            <div className="current-affairs-pagination" aria-label="News pagination controls">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={status === 'loading' || page <= 1}
              >
                ← Prev
              </button>
              <p className="current-affairs-pagination-meta">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>{' '}
                {effectiveTotal > 0 ? <span>• {effectiveTotal} results</span> : null}
              </p>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={status === 'loading' || page >= totalPages}
              >
                Next →
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function PakistanAffairsPage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle') // idle | loading | error | success
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('pakistan')
  const [, setLastUpdatedAt] = useState(null)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [feed, setFeed] = useState('top') // top | all | politics
  const [refreshSeed, setRefreshSeed] = useState(0)

  const pageSize = 24
  const maxResultsCap = 100000
  const effectiveTotal = Math.min(totalResults || 0, maxResultsCap)
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize) || 1)

  const fetchNews = async () => {
    setItems([])
    setTotalResults(0)
    setLastUpdatedAt(null)
    setError('Live Pakistan Affairs news feed has been disabled.')
    setStatus('error')
  }

  useEffect(() => {
    fetchNews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedQuery, page, feed, refreshSeed])

  const handleRefresh = () => {
    setRefreshSeed((current) => current + 1)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextAppliedQuery = query.trim() || 'pakistan'
    setAppliedQuery(nextAppliedQuery)
    setPage(1)
  }

  return (
    <main className="page-main container">
      <section className="section-title">
        <p>Live updates from Pakistan</p>
        <h2>Pakistan Affairs</h2>
      </section>

      <section className="current-affairs-shell">
        <div className="current-affairs-toolbar glass-panel">
          <div className="current-affairs-toolbar-head">
            <h3>Pakistan headlines</h3>
            <p>Live news feed is currently disabled.</p>
          </div>

          <div className="current-affairs-feed-tabs" role="tablist" aria-label="Pakistan affairs feed">
            <button
              type="button"
              className={`current-affairs-feed-tab ${feed === 'top' ? 'active' : ''}`}
              onClick={() => {
                setFeed('top')
                setPage(1)
              }}
            >
              Top News
            </button>
            <button
              type="button"
              className={`current-affairs-feed-tab ${feed === 'all' ? 'active' : ''}`}
              onClick={() => {
                setFeed('all')
                setPage(1)
              }}
            >
              Search News
            </button>
            <button
              type="button"
              className={`current-affairs-feed-tab ${feed === 'politics' ? 'active' : ''}`}
              onClick={() => {
                setFeed('politics')
                setPage(1)
              }}
            >
              Politics
            </button>
          </div>

          <form className="current-affairs-search" onSubmit={handleSubmit}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Pakistan topics (e.g., elections, economy, security)"
              aria-label="Search Pakistan affairs"
            />
            <button className="btn btn-primary" type="submit" disabled={status === 'loading'}>
              Search
            </button>
            <button className="btn btn-secondary" type="button" onClick={handleRefresh} disabled={status === 'loading'}>
              Refresh
            </button>
          </form>
        </div>

        {status === 'loading' ? (
          <div className="current-affairs-loading">
            <p>Fetching the latest headlines…</p>
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="current-affairs-error glass-panel">
            <h3>Couldn’t load news</h3>
            <p>{error}</p>
            <button className="btn btn-primary" type="button" onClick={handleRefresh}>
              Try again
            </button>
          </div>
        ) : null}

        {status === 'success' ? (
          <>
            <div className="current-affairs-grid">
              {items.length === 0 ? (
                <div className="current-affairs-empty glass-panel">
                  <h3>No results</h3>
                  <p>Try searching a broader topic like “global”, “economy”, or “technology”.</p>
                </div>
              ) : (
                items.map((article) => (
                  <a
                    key={article.id}
                    className="current-affairs-card"
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NewsCardMedia image={article.image} />
                    <div className="current-affairs-card-body">
                      <p className="current-affairs-meta">
                        <span>{article.domain || article.source || 'Global'}</span>
                        {article.date ? <span>• {formatNewsTimestamp(article.date)}</span> : null}
                      </p>
                      <h3>{article.title}</h3>
                      {article.snippet ? <p className="current-affairs-snippet">{article.snippet}</p> : null}
                      <span className="current-affairs-readmore">Read full story →</span>
                    </div>
                  </a>
                ))
              )}
            </div>

            {items.length > 0 ? (
              <div className="current-affairs-pagination" aria-label="News pagination controls">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={status === 'loading' || page <= 1 || feed === 'top'}
                >
                  ← Prev
                </button>
                <p className="current-affairs-pagination-meta">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>{' '}
                  {effectiveTotal > 0 ? <span>• {effectiveTotal} results</span> : null}
                </p>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={status === 'loading' || page >= totalPages || feed === 'top'}
                >
                  Next →
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  )
}

const INTERNATIONAL_NEWS_REFERENCE_CATEGORIES = [
  {
    category: 'Global Wire Services',
    sources: [
      { name: 'Reuters', url: 'https://www.reuters.com/world/' },
      { name: 'Associated Press (AP)', url: 'https://apnews.com/world-news' },
      { name: 'Agence France-Presse (AFP)', url: 'https://www.afp.com/en/news-hub' },
    ],
  },
  {
    category: 'Major International Broadcasters',
    sources: [
      { name: 'BBC News (World)', url: 'https://www.bbc.com/news/world' },
      { name: 'Al Jazeera', url: 'https://www.aljazeera.com/news/' },
      { name: 'CNN (World)', url: 'https://edition.cnn.com/world' },
    ],
  },
  {
    category: 'Business and Geopolitics',
    sources: [
      { name: 'Financial Times (World)', url: 'https://www.ft.com/world' },
      { name: 'The Economist (International)', url: 'https://www.economist.com/international' },
      { name: 'The Guardian (World News)', url: 'https://www.theguardian.com/world' },
      { name: 'The New York Times (World)', url: 'https://www.nytimes.com/section/world' },
    ],
  },
  {
    category: 'Wars and Armed Conflict',
    sources: [
      { name: 'Institute for the Study of War (ISW)', url: 'https://www.understandingwar.org/' },
      { name: 'International Crisis Group', url: 'https://www.crisisgroup.org/' },
      { name: 'SIPRI', url: 'https://www.sipri.org/' },
      { name: 'ACLED', url: 'https://acleddata.com/' },
    ],
  },
  {
    category: 'Technology and Cybersecurity',
    sources: [
      { name: 'Wired', url: 'https://www.wired.com/' },
      { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/' },
      { name: 'The Hacker News', url: 'https://thehackernews.com/' },
      { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/' },
    ],
  },
  {
    category: 'Artificial Intelligence',
    sources: [
      { name: 'OpenAI News', url: 'https://openai.com/news/' },
      { name: 'Google DeepMind Blog', url: 'https://deepmind.google/discover/blog/' },
      { name: 'OECD AI Policy Observatory', url: 'https://oecd.ai/' },
      { name: 'Partnership on AI', url: 'https://partnershiponai.org/' },
    ],
  },
  {
    category: 'Gender and Society',
    sources: [
      { name: 'UN Women News', url: 'https://www.unwomen.org/en/news-stories' },
      { name: 'UNFPA', url: 'https://www.unfpa.org/' },
      { name: 'UN Commission on the Status of Women', url: 'https://www.unwomen.org/en/csw' },
      { name: 'CEDAW (OHCHR)', url: 'https://www.ohchr.org/en/treaty-bodies/cedaw' },
    ],
  },
  {
    category: 'Climate, Energy, and Environment',
    sources: [
      { name: 'IPCC', url: 'https://www.ipcc.ch/' },
      { name: 'UNEP', url: 'https://www.unep.org/' },
      { name: 'IEA', url: 'https://www.iea.org/' },
      { name: 'Carbon Brief', url: 'https://www.carbonbrief.org/' },
    ],
  },
  {
    category: 'Nuclear, Strategic, and Security',
    sources: [
      { name: 'IAEA News', url: 'https://www.iaea.org/newscenter' },
      { name: 'Arms Control Association', url: 'https://www.armscontrol.org/' },
      { name: 'Nuclear Threat Initiative (NTI)', url: 'https://www.nti.org/' },
      { name: 'Bulletin of the Atomic Scientists', url: 'https://thebulletin.org/' },
    ],
  },
]

const PAKISTAN_NEWS_REFERENCE_CATEGORIES = [
  {
    category: 'National Newspapers',
    sources: [
      { name: 'Dawn', url: 'https://www.dawn.com/latest-news' },
      { name: 'The News International', url: 'https://www.thenews.com.pk/latest' },
      { name: 'The Express Tribune', url: 'https://tribune.com.pk/latest' },
      { name: 'Business Recorder', url: 'https://www.brecorder.com/latest' },
    ],
  },
  {
    category: 'Television and Digital News',
    sources: [
      { name: 'Geo News', url: 'https://www.geo.tv/latest' },
      { name: 'ARY News', url: 'https://arynews.tv/' },
      { name: 'Samaa TV', url: 'https://www.samaa.tv/' },
      { name: 'Dunya News', url: 'https://dunyanews.tv/' },
    ],
  },
  {
    category: 'Policy and Governance',
    sources: [
      { name: 'Radio Pakistan', url: 'https://www.radio.gov.pk/' },
      { name: 'Associated Press of Pakistan (APP)', url: 'https://www.app.com.pk/' },
      { name: 'Press Information Department (PID)', url: 'https://pid.gov.pk/' },
      { name: 'Cabinet Division Notifications', url: 'https://cabinet.gov.pk/' },
    ],
  },
  {
    category: 'Economy, Finance, and Data',
    sources: [
      { name: 'State Bank of Pakistan (SBP)', url: 'https://www.sbp.org.pk/' },
      { name: 'Pakistan Bureau of Statistics (PBS)', url: 'https://www.pbs.gov.pk/' },
      { name: 'Ministry of Finance', url: 'https://www.finance.gov.pk/' },
      { name: 'Pakistan Stock Exchange (PSX)', url: 'https://www.psx.com.pk/' },
    ],
  },
  {
    category: 'Security and Law & Order',
    sources: [
      { name: 'Ministry of Interior', url: 'https://www.interior.gov.pk/' },
      { name: 'National Counter Terrorism Authority (NACTA)', url: 'https://nacta.gov.pk/' },
      { name: 'FIA', url: 'https://fia.gov.pk/' },
      { name: 'ISPR', url: 'https://www.ispr.gov.pk/' },
    ],
  },
]

export default function GlobalAffairsPage({ defaultTab = 'global' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const allowedTabs = ['global', 'pakistan', 'map']
  const getResolvedTab = (value) => {
    if (!value) return defaultTab
    return allowedTabs.includes(value) ? value : defaultTab
  }

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search)
    return getResolvedTab(params.get('tab'))
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const urlTab = getResolvedTab(params.get('tab'))
    if (urlTab !== activeTab) setActiveTab(urlTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, defaultTab])

  const switchTab = (tabId) => {
    const nextTab = getResolvedTab(tabId)
    setActiveTab(nextTab)
    const params = new URLSearchParams(location.search)
    params.set('tab', nextTab)
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: true },
    )
  }
  const referencesUpdatedLabel = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <main className="page-main container">
      <section className="section-title">
        <p>International & Pakistan coverage</p>
        <h2>Global Affairs</h2>
      </section>
      <p className="rules-source global-affairs-mantra">
        <span className="guardian-highlight-word-green">
          Build your own notes from authentic and updated sources, and trust Allah Almighty to guide your
          journey toward success
        </span>
      </p>

      <div className="current-affairs-feed-tabs" role="tablist" aria-label="Global vs Pakistan affairs">
        <button
          type="button"
          className={`current-affairs-feed-tab ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => switchTab('global')}
        >
          Current Affairs (World)
        </button>
        <button
          type="button"
          className={`current-affairs-feed-tab ${activeTab === 'pakistan' ? 'active' : ''}`}
          onClick={() => switchTab('pakistan')}
        >
          Pakistan Affairs
        </button>
        <button
          type="button"
          className={`current-affairs-feed-tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => switchTab('map')}
        >
          Global Map
        </button>
      </div>

      {activeTab === 'global' ? (
        <section className="global-references-panel glass-panel" aria-label="International news references">
          <div className="global-references-head">
            <h3>International News References</h3>
            <p>Top authentic global sources (updated: {referencesUpdatedLabel})</p>
          </div>
          <div className="global-references-grid">
            {INTERNATIONAL_NEWS_REFERENCE_CATEGORIES.map((group) => (
              <article key={group.category} className="global-references-card">
                <h4>{group.category}</h4>
                <ul className="syllabus-list syllabus-list-links">
                  {group.sources.map((source) => (
                    <li key={source.name}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'pakistan' ? (
        <section className="global-references-panel glass-panel" aria-label="Pakistan news references">
          <div className="global-references-head">
            <h3>Pakistan News References</h3>
            <p>Pakistan-only authentic sources (updated: {referencesUpdatedLabel})</p>
          </div>
          <div className="global-references-grid">
            {PAKISTAN_NEWS_REFERENCE_CATEGORIES.map((group) => (
              <article key={group.category} className="global-references-card">
                <h4>{group.category}</h4>
                <ul className="syllabus-list syllabus-list-links">
                  {group.sources.map((source) => (
                    <li key={source.name}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'global' ? <WorldAffairsPage /> : null}
      {activeTab === 'pakistan' ? <PakistanAffairsPage /> : null}
      {activeTab === 'map' ? (
        <Suspense fallback={<p className="global-map-note">Loading map…</p>}>
          <GlobalConflictMapTab />
        </Suspense>
      ) : null}
    </main>
  )
}
