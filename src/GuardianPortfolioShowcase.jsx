import {
  formatFileSize,
  getInitials,
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
  const links = visibleLinkEntries(portfolio?.links)
  const work = Array.isArray(items) ? items : []
  const name = String(portfolio?.display_name || '').trim()
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
    work.length > 0

  if (!hasProfile) {
    return <p className="gp-empty">{emptyLabel}</p>
  }

  const contactHref = links[0]?.href || '#gp-contact'
  const showAbout = Boolean(portfolio.bio || portfolio.offer)
  const showSkills = skills.length > 0
  const showWork = work.length > 0
  const showContact = links.length > 0 || Boolean(portfolio.city || portfolio.rate_text)
  const navItems = [
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
          {portfolio.city || portfolio.rate_text ? (
            <p className="gp-meta-line">
              {[portfolio.city, portfolio.rate_text].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          {showWork || showContact ? (
            <div className="gp-hero-actions">
              {showWork ? (
                <a className="btn btn-primary" href="#gp-work">
                  View my work
                </a>
              ) : null}
              {showContact ? (
                <a className="btn btn-secondary" href={contactHref}>
                  Get in touch
                </a>
              ) : null}
            </div>
          ) : null}
          {links.length ? (
            <ul className="gp-socials">
              {links.map((link) => (
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
