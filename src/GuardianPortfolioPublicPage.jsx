import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GuardianPortfolioShowcase from './GuardianPortfolioShowcase.jsx'
import { fetchPublicPortfolio } from './utils/portfolioClient.js'

export default function GuardianPortfolioPublicPage() {
  const { slug } = useParams()
  const [portfolio, setPortfolio] = useState(null)
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const result = await fetchPublicPortfolio(slug)
        if (cancelled) return
        setPortfolio(result.portfolio)
        setItems(result.items)
        if (result.portfolio?.display_name) {
          document.title = `${result.portfolio.display_name} | Guardian Portfolio`
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'Unable to load this portfolio.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <main className="page-main gp-page">
      <section className="container gp-public">
        <header className="gp-hero">
          <p className="kicker">Guardian Angel Resources</p>
          <h1>Guardian Portfolio</h1>
        </header>

        {isLoading ? <p className="gp-status">Loading portfolio…</p> : null}
        {error ? <p className="planner-error gp-error">{error}</p> : null}
        {!isLoading && !error && !portfolio ? (
          <p className="gp-empty">This portfolio is private or does not exist.</p>
        ) : null}
        {!isLoading && portfolio ? (
          <div className="planner-card gp-public-card">
            <GuardianPortfolioShowcase portfolio={portfolio} items={items} />
          </div>
        ) : null}

        <p className="gp-public-foot">
          <Link to="/guardian-portfolio">Create your own Guardian Portfolio</Link>
        </p>
      </section>
    </main>
  )
}
