import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../../styles/portfolio.css'
import { GIG_IDEAS, HOW_IT_WORKS, PORTFOLIO_FAQ, SAFETY_TIPS } from '../../portfolio/portfolioContent.js'

const BENEFITS = [
  {
    title: 'Free, with no commission',
    text: 'No sign-up fee, no monthly charge, no cut of your earnings. What clients pay is yours.',
  },
  {
    title: 'Fiverr-style gigs',
    text: 'Turn each skill into a clear service with a price and delivery time that clients understand at a glance.',
  },
  {
    title: 'One link for everything',
    text: 'Your gigs, work samples and contact details on one page you can share on WhatsApp, Facebook or LinkedIn.',
  },
]

export default function PortfolioLanding({ authUser }) {
  const primaryCta = authUser ? 'Open my portfolio editor' : 'Create your free profile'
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return undefined
    // Wait for the site's scroll-to-top on navigation, then jump to the section.
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [hash])
  return (
    <main className="page-main pf-page" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>Guardian Angel Resources</p>
          <h2>Guardian Portfolio</h2>
        </div>
        <div className="pf-hero">
          <div className="pf-hero-copy">
            <p className="pf-hero-title">Earn while you prepare for CSS.</p>
            <p className="pf-lead">
              Create a free professional profile, publish your skills as gigs and share one link to get orders from
              clients. Teaching, writing, translation, research or design: your preparation already gives you skills
              people pay for.
            </p>
            <div className="pf-actions">
              <Link className="btn btn-primary" to="/guardian-portfolio/edit">
                {primaryCta}
              </Link>
              <Link className="btn btn-secondary" to="/guardian-portfolio/browse">
                Browse CSS Jawans
              </Link>
              <Link className="pf-text-link" to="/guardian-portfolio/example">
                See an example profile →
              </Link>
            </div>
          </div>
          <div className="pf-benefits">
            {BENEFITS.map((item) => (
              <article className="pf-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="pf-section" id="how-it-works">
          <div className="section-title">
            <h2>How it works</h2>
          </div>
          <ol className="pf-steps">
            {HOW_IT_WORKS.map((step, index) => (
              <li className="pf-card pf-step" key={step.title}>
                <span className="pf-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="pf-section" id="tutorial">
          <div className="section-title">
            <h2>Watch the quick guide</h2>
          </div>
          <div className="pf-video-wrap">
            <video
              className="pf-video"
              controls
              preload="none"
              playsInline
              poster="/media/portfolio-tutorial-poster.webp"
            >
              <source src="/media/portfolio-tutorial.mp4" type="video/mp4" />
              Your browser cannot play this video.
            </video>
            <p className="pf-muted">
              A short walkthrough: set up your profile, add a gig and work samples, then publish and share your link.
            </p>
          </div>
        </section>

        <section className="pf-section" id="gig-ideas">
          <div className="section-title">
            <h2>Gig ideas for CSS Jawans</h2>
          </div>
          <p className="pf-lead">Start with what you already do well. Each idea can be added to your profile in one click.</p>
          <div className="pf-grid">
            {GIG_IDEAS.map((idea) => (
              <article className="pf-card pf-idea" key={idea.title}>
                <span className="pf-chip">{idea.category}</span>
                <h3>{idea.title}</h3>
                <p>{idea.description}</p>
                <p className="pf-idea-meta">
                  From Rs {Number(idea.price).toLocaleString()} · {idea.delivery}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pf-section pf-two-col">
          <div>
            <div className="section-title">
              <h2>Work safely</h2>
            </div>
            <ul className="pf-tips">
              {SAFETY_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="section-title">
              <h2>Questions</h2>
            </div>
            <div className="pf-faq">
              {PORTFOLIO_FAQ.map((item) => (
                <details className="pf-card pf-faq-item" key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="pf-section">
          <div className="pf-cta-band">
            <div>
              <p className="pf-hero-title">Your skills deserve a stage.</p>
              <p className="pf-muted">It takes about ten minutes to set up. You can edit everything later.</p>
            </div>
            <Link className="btn btn-primary" to="/guardian-portfolio/edit">
              {primaryCta}
            </Link>
          </div>
          <p className="pf-disclaimer">
            Guardian Angel provides profiles free of charge and does not take part in, guarantee or handle payment for any
            work agreed between members and clients.
          </p>
        </section>
      </section>
    </main>
  )
}
