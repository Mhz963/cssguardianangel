import { Link } from 'react-router-dom'
import '../../styles/portfolio.css'
import GuardianPortfolioShowcase from '../../GuardianPortfolioShowcase.jsx'
import { EXAMPLE_ITEMS, EXAMPLE_PORTFOLIO } from '../../portfolio/portfolioContent.js'

export default function PortfolioExample() {
  return (
    <main className="gp-public-page pf-example" id="main-content">
      <div className="container">
        <div className="pf-example-banner" role="note">
          <p>
            <strong>Example profile.</strong> Ayesha is fictional. This is what your public page looks like once you add a
            headline, a few gigs and some work samples.
          </p>
          <div className="pf-actions">
            <Link className="btn btn-primary" to="/guardian-portfolio/edit">
              Create yours free
            </Link>
            <Link className="btn btn-secondary" to="/guardian-portfolio">
              How it works
            </Link>
          </div>
        </div>
      </div>
      <GuardianPortfolioShowcase portfolio={EXAMPLE_PORTFOLIO} items={EXAMPLE_ITEMS} />
    </main>
  )
}
