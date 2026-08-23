import { useEffect, useState } from 'react'
import PortfolioSampleCover from './PortfolioSampleCover.jsx'
import {
  formatFileSize,
  formatGigPrice,
  getGigWhatsAppUrl,
  getInitials,
  getPortfolioWhatsAppUrl,
  parseSkills,
  visibleLinkEntries,
} from './utils/portfolioClient.js'

const LONG_GIG_DESCRIPTION = 90

function isLongGigDescription(text) {
  return String(text || '').trim().length > LONG_GIG_DESCRIPTION
}

function GetInTouchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.5 5.25h15a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Zm.75 2.12v8.88h13.5V7.37l-6.38 4.15a.75.75 0 0 1-.8 0Zm12.5-.87H6.25l5.75 3.74Z"
      />
    </svg>
  )
}

function GigDetailsModal({ gig, orderHref, onClose }) {
  return (
    <div
      className="gp-gig-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={gig.title || 'Gig details'}
      onClick={onClose}
    >
      <article className="gp-gig-modal" onClick={(event) => event.stopPropagation()}>
        <header className="gp-gig-modal-head">
          <div>
            {gig.category ? <p className="gp-kicker">{gig.category}</p> : null}
            <h3>{gig.title}</h3>
          </div>
          <button className="gp-gig-modal-close" type="button" onClick={onClose}>
            Close
          </button>
        </header>
        {gig.coverUrl ? (
          <img className="gp-gig-modal-cover" src={gig.coverUrl} alt={gig.title || 'Gig cover'} />
        ) : null}
        {gig.description ? <p className="gp-gig-modal-copy">{gig.description}</p> : null}
        <div className="gp-gig-meta">
          {gig.price ? <strong>{formatGigPrice(gig)}</strong> : null}
          {gig.delivery ? <span>{gig.delivery} delivery</span> : null}
        </div>
        <a
          className="gp-gig-order"
          href={orderHref || '#gp-contact'}
          {...(orderHref ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          onClick={onClose}
        >
          <GetInTouchIcon />
          Get in touch
        </a>
      </article>
    </div>
  )
}

export default function GuardianPortfolioShowcase({
  portfolio,
  items,
  emptyLabel = 'Nothing added yet.',
  compact = false,
}) {
  const [openGig, setOpenGig] = useState(null)
  const skills = parseSkills(portfolio?.skillsText)
  const name = String(portfolio?.display_name || '').trim()
  const whatsappHref = getPortfolioWhatsAppUrl(portfolio?.links, name)
  const links = visibleLinkEntries(portfolio?.links, name)
  const publicLinks = links.filter((link) => link.label !== 'WhatsApp')
  const work = Array.isArray(items) ? items : []
  const gigs = Array.isArray(portfolio?.gigs) ? portfolio.gigs : []
  const hasProfile =
    Boolean(name) ||
    Boolean(portfolio?.headline) ||
    Boolean(portfolio?.offer) ||
    Boolean(portfolio?.bio) ||
    Boolean(portfolio?.city) ||
    Boolean(portfolio?.rate_text) ||
    Boolean(portfolio?.photoUrl) ||
    skills.length > 0 ||
    publicLinks.length > 0 ||
    work.length > 0 ||
    gigs.length > 0

  useEffect(() => {
    if (!openGig) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenGig(null)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openGig])

  if (!hasProfile) {
    return <p className="gp-empty">{emptyLabel}</p>
  }

  const showGigs = gigs.length > 0
  const showAbout = Boolean(portfolio.bio || portfolio.offer)
  const showSkills = skills.length > 0
  const showWork = work.length > 0
  const showContact = publicLinks.length > 0 || Boolean(portfolio.city || portfolio.rate_text)
  const navItems = [
    showGigs ? { id: 'gp-gigs', label: 'Gigs' } : null,
    showAbout ? { id: 'gp-about', label: 'About' } : null,
    showSkills ? { id: 'gp-skills', label: 'Skills' } : null,
    showWork ? { id: 'gp-work', label: 'Work' } : null,
    showContact ? { id: 'gp-contact', label: 'Contact' } : null,
  ].filter(Boolean)

  return (
    <article className={`gp-site ${compact ? 'is-compact' : ''}`}>
      {navItems.length ? (
        <nav className="gp-site-nav" aria-label="Portfolio sections">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      <section className="gp-site-hero">
        <div className="gp-site-copy">
          {name ? <p className="gp-hi">Hi, I&apos;m</p> : null}
          {name ? <h1>{name}</h1> : null}
          {portfolio.headline ? <p className="gp-role">{portfolio.headline}</p> : null}
          {portfolio.offer ? <p className="gp-lead">{portfolio.offer}</p> : null}
          {portfolio.city || portfolio.rate_text || showGigs ? (
            <p className="gp-meta-line">
              {[
                portfolio.city,
                portfolio.rate_text,
                showGigs ? `${gigs.length} gig${gigs.length === 1 ? '' : 's'} available` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {showGigs || showWork || whatsappHref || showContact ? (
            <div className="gp-hero-actions">
              {showGigs ? (
                <a className="btn btn-primary" href="#gp-gigs">
                  View gigs
                </a>
              ) : null}
              {showWork ? (
                <a className="btn btn-secondary" href="#gp-work">
                  View my work
                </a>
              ) : null}
              {showContact || whatsappHref ? (
                <a
                  className="btn btn-secondary"
                  href={whatsappHref || '#gp-contact'}
                  {...(whatsappHref ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  Get in touch
                </a>
              ) : null}
            </div>
          ) : null}
          {publicLinks.length ? (
            <ul className="gp-socials">
              {publicLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="gp-portrait-wrap">
          <div className="gp-portrait">
            {portfolio.photoUrl ? (
              <img src={portfolio.photoUrl} alt={name || 'Profile photo'} />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>
        </div>
      </section>

      {showGigs ? (
        <section className="gp-site-section gp-gigs-section" id="gp-gigs">
          <p className="gp-kicker">Gigs</p>
          <h2>Services you can order</h2>
          <div className="gp-gig-stage">
            <ul className="gp-gig-grid" data-count={gigs.length}>
              {gigs.map((gig, index) => {
                const openDetails = () => setOpenGig(gig)
                return (
                  <li key={gig.id} className="gp-gig-card" style={{ '--gp-gig-delay': `${index * 90}ms` }}>
                    <button className="gp-gig-open" type="button" onClick={openDetails}>
                      <div className="gp-gig-cover">
                        {gig.coverUrl ? (
                          <img src={gig.coverUrl} alt="" />
                        ) : (
                          <span>{gig.category || 'Gig'}</span>
                        )}
                        {gig.category ? <em>{gig.category}</em> : null}
                      </div>
                      <div className="gp-gig-body">
                        <h3>{gig.title}</h3>
                        {gig.description ? (
                          <p>
                            {isLongGigDescription(gig.description)
                              ? `${gig.description.trim().slice(0, LONG_GIG_DESCRIPTION).trim()}…`
                              : gig.description}
                          </p>
                        ) : null}
                        <div className="gp-gig-meta">
                          {gig.price ? <strong>{formatGigPrice(gig)}</strong> : null}
                          {gig.delivery ? <span>{gig.delivery} delivery</span> : null}
                        </div>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ) : null}

      {openGig ? (
        <GigDetailsModal
          gig={openGig}
          orderHref={getGigWhatsAppUrl(portfolio.links, name, openGig)}
          onClose={() => setOpenGig(null)}
        />
      ) : null}

      {showAbout ? (
        <section className="gp-site-section" id="gp-about">
          <p className="gp-kicker">About me</p>
          <h2>Get to know more about my journey</h2>
          {portfolio.offer ? <p className="gp-about-lead">{portfolio.offer}</p> : null}
          {portfolio.bio ? <p className="gp-show-bio">{portfolio.bio}</p> : null}
        </section>
      ) : null}

      {showSkills ? (
        <section className="gp-site-section" id="gp-skills">
          <p className="gp-kicker">Skills & expertise</p>
          <h2>What I can take on</h2>
          <ul className="gp-skill-list">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {showWork ? (
        <section className="gp-site-section" id="gp-work">
          <p className="gp-kicker">Featured work</p>
          <h2>A showcase of recent samples</h2>
          <ul className="gp-project-grid">
            {work.map((item, index) => {
              const openUrl = item.fileUrl || item.externalUrl
              return (
                <li
                  key={item.id}
                  className="gp-project-card"
                  style={{ '--gp-work-delay': `${index * 140}ms` }}
                >
                  {openUrl ? (
                    <a className="gp-project-media" href={openUrl} target="_blank" rel="noopener noreferrer">
                      <PortfolioSampleCover item={item} />
                    </a>
                  ) : (
                    <div className="gp-project-media is-file">
                      <PortfolioSampleCover item={item} />
                      {item.fileSize ? <span>{formatFileSize(item.fileSize)}</span> : null}
                    </div>
                  )}
                  <div className="gp-project-body">
                    {item.title ? <h3>{item.title}</h3> : null}
                    {item.description ? <p>{item.description}</p> : null}
                    <div className="gp-work-actions">
                      {item.fileUrl ? (
                        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                          Open file
                        </a>
                      ) : null}
                      {item.externalUrl ? (
                        <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                          Live demo
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {showContact ? (
        <section className="gp-site-section gp-contact" id="gp-contact">
          <p className="gp-kicker">Let&apos;s work together</p>
          <h2>Ready to start a project?</h2>
          {portfolio.offer ? <p>{portfolio.offer}</p> : <p>Reach out through any link below.</p>}
          {portfolio.city || portfolio.rate_text ? (
            <p className="gp-meta-line">
              {[portfolio.city, portfolio.rate_text].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {publicLinks.length ? (
            <ul className="gp-contact-list">
              {publicLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </article>
  )
}
