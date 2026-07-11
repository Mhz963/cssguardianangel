import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchSubscriptionStatus,
  FIRST_MONTH_PRICE_PKR,
  hasActiveSubscription,
  MONTHLY_PRICE_PKR,
  startSubscriptionCheckout,
  verifyCheckoutSession,
} from './utils/paymentClient.js'

const PREMIUM_FEATURES = [
  'Subject Locker — compulsory & optional subject selection',
  'Strategy Builder — personalized CSS study timetable',
  'Performance Analysis — Survivor / Contender / Topper tracking',
  'Timer & Analytics — study session tracking',
  'Social Balance — screen-time discipline tools',
  'Guardian Calendar — daily plan & revision tracking',
  'Guardian Angel Report — PDF progress export',
  'AI Examiner — exam readiness scoring',
]

function formatRenewalDate(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function PaymentPage({ authUser, subscriptionStatus, onSubscriptionRefresh }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null)

  const isSubscribed = hasActiveSubscription(subscriptionStatus)

  useEffect(() => {
    if (!authUser?.id) return undefined
    let cancelled = false

    const loadStatus = async () => {
      const result = await fetchSubscriptionStatus(authUser.id)
      if (!cancelled) {
        setCurrentPeriodEnd(result.currentPeriodEnd)
      }
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [authUser?.id, subscriptionStatus])

  useEffect(() => {
    if (isSubscribed) {
      navigate('/guardian-study-planner', { replace: true })
    }
  }, [isSubscribed, navigate])

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const isSuccess = searchParams.get('success') === '1'
    if (!authUser?.id || !isSuccess || !sessionId || isVerifying) return undefined

    let cancelled = false
    setIsVerifying(true)
    setError('')
    setMessage('Confirming your subscription...')

    verifyCheckoutSession(sessionId)
      .then(async (result) => {
        if (cancelled) return
        if (result.active) {
          await onSubscriptionRefresh?.()
          setMessage('Subscription active. Redirecting to Guardian Study Planner...')
          navigate('/guardian-study-planner', { replace: true })
          return
        }
        setMessage('Payment received. Your subscription will activate shortly.')
      })
      .catch((verifyError) => {
        if (!cancelled) {
          setError(verifyError?.message || 'Unable to verify subscription.')
          setMessage('')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsVerifying(false)
          setSearchParams({}, { replace: true })
        }
      })

    return () => {
      cancelled = true
    }
  }, [authUser?.id, searchParams, isVerifying, navigate, onSubscriptionRefresh, setSearchParams])

  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      setError('Checkout was canceled. You can try again when ready.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleSubscribe = async () => {
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      const result = await startSubscriptionCheckout()
      if (result.alreadySubscribed) {
        await onSubscriptionRefresh?.()
        navigate('/guardian-study-planner', { replace: true })
        return
      }
      window.location.assign(result.url)
    } catch (checkoutError) {
      setError(checkoutError?.message || 'Unable to start checkout.')
      setIsSubmitting(false)
    }
  }

  if (!authUser) {
    return <Navigate to="/signin" replace state={{ from: '/payment' }} />
  }

  return (
    <>
      <section className="intro auth-intro">
        <div className="intro-video auth-video" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="none">
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="intro-overlay auth-overlay" aria-hidden="true" />
        <section className="container auth-page auth-page-overlay payment-page">
          <div className="section-title">
            <h2 className="auth-title-pump">Unlock Guardian Study Planner</h2>
            <p className="payment-lead">
              Subscribe to access all premium planner tools on web and mobile app.
            </p>
          </div>

          <article className="planner-card auth-card payment-card">
            <div className="payment-pricing">
              <div className="payment-price-row payment-price-featured">
                <span className="payment-price-label">First month</span>
                <strong className="payment-price-value">PKR {FIRST_MONTH_PRICE_PKR.toLocaleString()}</strong>
              </div>
              <div className="payment-price-row">
                <span className="payment-price-label">From month 2 onward</span>
                <strong className="payment-price-value">PKR {MONTHLY_PRICE_PKR.toLocaleString()} / month</strong>
              </div>
              <p className="payment-note">
                First payment includes a one-time activation fee plus your first monthly subscription.
              </p>
            </div>

            <ul className="payment-features">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            {currentPeriodEnd ? (
              <p className="payment-renewal" role="status">
                Current period ends: {formatRenewalDate(currentPeriodEnd)}
              </p>
            ) : null}

            <div className="blog-create-actions payment-actions">
              <button
                className="btn btn-primary planner-submit"
                type="button"
                onClick={handleSubscribe}
                disabled={isSubmitting || isVerifying}
              >
                {isSubmitting ? 'Redirecting to Stripe...' : 'Subscribe with Stripe'}
              </button>
              <Link className="btn btn-secondary planner-submit" to="/">
                Back to Home
              </Link>
            </div>

            {message ? <p className="payment-status-msg" role="status">{message}</p> : null}
            {error ? <p className="planner-error">{error}</p> : null}

            <p className="payment-footnote">
              Secure payments powered by Stripe. Works on website and Android app.
            </p>
          </article>
        </section>
      </section>
    </>
  )
}

export default PaymentPage
