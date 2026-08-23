import { formatFileSize, isImageMime, parseSkills, visibleLinkEntries } from './utils/portfolioClient.js'

function FieldBlock({ title, children }) {
  if (!children) return null
  return (
    <section className="gp-show-block">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

export default function GuardianPortfolioShowcase({ portfolio, items, emptyLabel = 'Nothing added yet.' }) {
  const skills = parseSkills(portfolio?.skillsText)
  const links = visibleLinkEntries(portfolio?.links)
  const work = Array.isArray(items) ? items : []
  const hasProfile =
    Boolean(portfolio?.display_name) ||
    Boolean(portfolio?.headline) ||
    Boolean(portfolio?.offer) ||
    Boolean(portfolio?.bio) ||
    Boolean(portfolio?.city) ||
    Boolean(portfolio?.rate_text) ||
    skills.length > 0 ||
    links.length > 0 ||
    work.length > 0

  if (!hasProfile) {
    return <p className="gp-empty">{emptyLabel}</p>
  }

  return (
    <article className="gp-show">
      <header className="gp-show-head">
        {portfolio.display_name ? <h2>{portfolio.display_name}</h2> : null}
        {portfolio.headline ? <p className="gp-show-headline">{portfolio.headline}</p> : null}
        <div className="gp-show-meta">
          {portfolio.city ? <span>{portfolio.city}</span> : null}
          {portfolio.rate_text ? <span>{portfolio.rate_text}</span> : null}
        </div>
      </header>

      <FieldBlock title="Offer">{portfolio.offer ? <p>{portfolio.offer}</p> : null}</FieldBlock>
      <FieldBlock title="About">{portfolio.bio ? <p className="gp-show-bio">{portfolio.bio}</p> : null}</FieldBlock>
      <FieldBlock title="Skills">
        {skills.length ? (
          <ul className="gp-skill-list">
            {skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        ) : null}
      </FieldBlock>
      <FieldBlock title="Contact">
        {links.length ? (
          <ul className="gp-link-list">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </FieldBlock>
      <FieldBlock title="Work & documents">
        {work.length ? (
          <ul className="gp-work-list">
            {work.map((item) => (
              <li key={item.id} className="gp-work-item">
                {item.fileUrl && isImageMime(item.fileMime, item.fileName) ? (
                  <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                    <img src={item.fileUrl} alt={item.title || item.fileName} />
                  </a>
                ) : null}
                <div>
                  <strong>{item.title}</strong>
                  {item.description ? <p>{item.description}</p> : null}
                  <div className="gp-work-actions">
                    {item.fileUrl ? (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                        {item.fileName || 'Open file'}
                        {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : ''}
                      </a>
                    ) : null}
                    {item.externalUrl ? (
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer">
                        Open link
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </FieldBlock>
    </article>
  )
}
