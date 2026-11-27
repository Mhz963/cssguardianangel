import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../../styles/portfolio.css'
import { GIG_CATEGORIES, fetchPublicDirectory, formatGigPrice, getInitials, parseSkills } from '../../utils/portfolioClient.js'

export default function PortfolioBrowse() {
  const [profiles, setProfiles] = useState([])
  const [status, setStatus] = useState('loading')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchPublicDirectory()
      .then((list) => {
        if (cancelled) return
        // Only list profiles with something to show: a headline or at least one gig.
        setProfiles(list.filter((p) => p.headline || (p.gigs || []).length))
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return profiles.filter((p) => {
      const gigs = p.gigs || []
      if (category && !gigs.some((g) => g.category === category)) return false
      if (!q) return true
      const haystack = [p.display_name, p.headline, p.city, p.skillsText, ...gigs.map((g) => `${g.title} ${g.category}`)]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [profiles, query, category])

  const usedCategories = GIG_CATEGORIES.filter((c) => profiles.some((p) => (p.gigs || []).some((g) => g.category === c)))

  return (
    <main className="page-main pf-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>Guardian Portfolio</p>
          <h2>Browse CSS Jawans</h2>
        </div>
        <p className="pf-lead">
          Find tutors, writers, translators and researchers who are preparing for CSS. Open a profile to see their gigs
          and contact them directly.
        </p>

        <div className="pf-filter">
          <input
            className="pf-search"
            type="search"
            placeholder="Search by skill, service or city"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search profiles"
          />
          {usedCategories.length ? (
            <div className="pf-chips" role="group" aria-label="Filter by category">
              <button type="button" className={`pf-chip-btn ${category === '' ? 'is-active' : ''}`} onClick={() => setCategory('')}>
                All
              </button>
              {usedCategories.map((c) => (
                <button type="button" key={c} className={`pf-chip-btn ${category === c ? 'is-active' : ''}`} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {status === 'loading' ? <p className="pf-muted">Loading profiles…</p> : null}
        {status === 'error' ? (
          <p className="pf-notice">Profiles could not be loaded right now. Please check your connection and try again.</p>
        ) : null}
        {status === 'ready' && profiles.length === 0 ? (
          <div className="pf-cta-band">
            <div>
              <p className="pf-hero-title">No public profiles yet.</p>
              <p className="pf-muted">Be the first CSS Jawan listed here.</p>
            </div>
            <Link className="btn btn-primary" to="/guardian-portfolio/edit">
              Create your free profile
            </Link>
          </div>
        ) : null}
        {status === 'ready' && profiles.length > 0 ? (
          <>
            <p className="pf-muted">
              {filtered.length} of {profiles.length} profiles
            </p>
            <div className="pf-grid pf-people">
              {filtered.map((p) => {
                const topGig = (p.gigs || [])[0]
                const skills = parseSkills(p.skillsText).slice(0, 3)
                return (
                  <Link className="pf-card pf-person" key={p.slug} to={`/p/${p.slug}`}>
                    <div className="pf-person-head">
                      <span className="pf-avatar">
                        {p.photoUrl ? <img src={p.photoUrl} alt="" loading="lazy" /> : getInitials(p.display_name)}
                      </span>
                      <div>
                        <h3>{p.display_name}</h3>
                        {p.headline ? <p className="pf-person-headline">{p.headline}</p> : null}
                        {p.city ? <p className="pf-muted">{p.city}</p> : null}
                      </div>
                    </div>
                    {topGig ? (
                      <div className="pf-person-gig">
                        <span className="pf-chip">{topGig.category || 'Gig'}</span>
                        <p>{topGig.title}</p>
                        {topGig.price ? <strong>{formatGigPrice(topGig)}</strong> : null}
                      </div>
                    ) : null}
                    {skills.length ? (
                      <ul className="pf-skill-list">
                        {skills.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    ) : null}
                    <span className="pf-person-more">
                      {(p.gigs || []).length ? `${p.gigs.length} gig${p.gigs.length === 1 ? '' : 's'} · ` : ''}View profile →
                    </span>
                  </Link>
                )
              })}
            </div>
          </>
        ) : null}

        <p className="pf-disclaimer">
          Profiles are created by members. Agree work and payment directly with the person you hire; Guardian Angel does not
          handle payments.
        </p>
      </section>
    </main>
  )
}
