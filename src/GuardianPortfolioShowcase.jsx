import {
  formatFileSize,
  formatGigPrice,
  getGigWhatsAppUrl,
  getInitials,
  getPortfolioWhatsAppUrl,
  isImageMime,
  parseSkills,
  visibleLinkEntries,
} from './utils/portfolioClient.js'

export default function GuardianPortfolioShowcase({
  portfolio,
  items,
  emptyLabel = 'Nothing added yet.',
  compact = false,
}) {
  const skills = parseSkills(portfolio?.skillsText)
  const name = String(portfolio?.display_name || '').trim()
  const whatsappHref = getPortfolioWhatsAppUrl(portfolio?.links, name)
  const links = visibleLinkEntries(portfolio?.links, name)
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
    links.length > 0 ||
    work.length > 0 ||
    gigs.length > 0

  if (!hasProfile) {
    return <p className="gp-empty">{emptyLabel}</p>
  }

  const showGigs = gigs.length > 0
  const showAbout = Boolean(portfolio.bio || portfolio.offer)
  const showSkills = skills.length > 0
  const showWork = work.length > 0
  const showContact = links.length > 0 || Boolean(portfolio.city || portfolio.rate_text)
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
          {links.filter((link) => link.label !== 'WhatsApp').length ? (
            <ul className="gp-socials">
              {links
                .filter((link) => link.label !== 'WhatsApp')
                .map((link) => (
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
        <section className="gp-site-section" id="gp-gigs">
          <p className="gp-kicker">Gigs</p>
          <h2>Services you can order</h2>
          <ul className="gp-gig-grid">
            {gigs.map((gig) => {
              const orderHref = getGigWhatsAppUrl(portfolio.links, name, gig)
              return (
                <li key={gig.id} className="gp-gig-card">
                  <div className="gp-gig-cover">
                    {gig.coverUrl ? (
                      <img src={gig.coverUrl} alt={gig.title} />
                    ) : (
                      <span>{gig.category || 'Gig'}</span>
                    )}
                    {gig.category ? <em>{gig.category}</em> : null}
                  </div>
                  <div className="gp-gig-body">
                    <h3>{gig.title}</h3>
                    {gig.description ? <p>{gig.description}</p> : null}
                    <div className="gp-gig-meta">
                      {gig.price ? <strong>{formatGigPrice(gig)}</strong> : null}
                      {gig.delivery ? <span>{gig.delivery} delivery</span> : null}
                    </div>
                    {orderHref ? (
                      <a className="btn btn-secondary gp-gig-order" href={orderHref} target="_blank" rel="noopener noreferrer">
                        Get in touch
                      </a>
                    ) : (
                      <a className="btn btn-secondary gp-gig-order" href="#gp-contact">
                        Get in touch
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
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
            {work.map((item) => {
              const isImage = item.fileUrl && isImageMime(item.fileMime, item.fileName)
              return (
                <li key={item.id} className="gp-project-card">
                  {isImage ? (
                    <a className="gp-project-media" href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                      <img src={item.fileUrl} alt={item.title || item.fileName} />
                    </a>
                  ) : (
                    <div className="gp-project-media is-file">
                      <strong>{item.fileName || 'Work sample'}</strong>
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
          {links.length ? (
            <ul className="gp-contact-list">
              {links.map((link) => (
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
