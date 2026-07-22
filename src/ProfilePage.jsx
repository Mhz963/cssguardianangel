import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { hasSupabaseConfig, supabase } from './utils/supabaseClient.js'
import {
  deleteAccount,
  fetchSubscriptionStatus,
  hasActiveSubscription,
  openBillingPortal,
  startSubscriptionCheckout,
} from './utils/paymentClient.js'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatSubscriptionStatus(status) {
  if (!status) return 'No subscription'
  const labels = {
    active: 'Active',
    trialing: 'Trial',
    voucher: 'Voucher access',
    pending: 'Pending payment',
    past_due: 'Past due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    unpaid: 'Unpaid',
  }
  return labels[status] || status
}

function ProfilePage({ authUser, subscriptionStatus, onSubscriptionRefresh, onLogout }) {
  const navigate = useNavigate()
  const [authDetails, setAuthDetails] = useState(null)
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const isSubscribed = hasActiveSubscription(subscriptionStatus)

  useEffect(() => {
    if (!supabase) return undefined
    let cancelled = false

    const loadAuthDetails = async () => {
      const { data, error: userError } = await supabase.auth.getUser()
      if (!cancelled && !userError) {
        setAuthDetails(data?.user || null)
      }
    }

    loadAuthDetails()
    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  useEffect(() => {
    if (!authUser?.id) return undefined
    let cancelled = false

    const loadSubscription = async () => {
      const result = await fetchSubscriptionStatus(authUser.id)
      if (!cancelled) {
        setCurrentPeriodEnd(result.currentPeriodEnd)
      }
    }

    loadSubscription()
    return () => {
      cancelled = true
    }
  }, [authUser?.id, subscriptionStatus])

  const handleChangePassword = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const { newPassword, confirmPassword } = passwordForm
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (!hasSupabaseConfig || !supabase) {
      setError('Supabase is not configured.')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setMessage('Password updated successfully.')
    } catch (passwordError) {
      setError(passwordError?.message || 'Unable to update password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleManageSubscription = async () => {
    setError('')
    setMessage('')
    setIsOpeningPortal(true)
    try {
      const result = await openBillingPortal()
      if (result.url) {
        window.location.assign(result.url)
        return
      }
      setError('Billing portal is not available for this account yet.')
    } catch (portalError) {
      setError(portalError?.message || 'Unable to open billing portal.')
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const handleSubscribe = async () => {
    setError('')
    setMessage('')
    setIsStartingCheckout(true)
    try {
      const result = await startSubscriptionCheckout()
      if (result.alreadySubscribed) {
        await onSubscriptionRefresh?.()
        setMessage('You already have premium access.')
        return
      }
      window.location.assign(result.url)
    } catch (checkoutError) {
      setError(checkoutError?.message || 'Unable to start checkout.')
      setIsStartingCheckout(false)
    }
  }

  const handleDeleteAccount = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const email = String(authUser?.email || '').trim()
    if (!email || deleteConfirm.trim().toLowerCase() !== email.toLowerCase()) {
      setError('Please type your email address exactly to confirm account deletion.')
      return
    }

    const confirmed = window.confirm(
      'This will permanently delete your account, planner data, and subscription. This cannot be undone. Continue?',
    )
    if (!confirmed) return

    setIsDeletingAccount(true)
    try {
      await deleteAccount()
      await onLogout?.()
      navigate('/', { replace: true })
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to delete account.')
      setIsDeletingAccount(false)
    }
  }

  if (!authUser) {
    return <Navigate to="/signin" replace state={{ from: '/profile' }} />
  }

  const memberSince = formatDate(authDetails?.created_at)
  const emailVerified = authDetails?.email_confirmed_at ? 'Verified' : 'Not verified'

  return (
    <>
      <section className="intro auth-intro profile-intro">
        <div className="intro-video auth-video" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="none">
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="intro-overlay auth-overlay" aria-hidden="true" />
        <section className="container auth-page auth-page-overlay profile-page">
          <div className="section-title">
            <h2 className="auth-title-pump">My Profile</h2>
            <p className="profile-lead">Manage your Guardian Angel account and subscription.</p>
          </div>

          <div className="profile-grid">
            <article className="planner-card auth-card profile-card">
              <h3>Account Overview</h3>
              <dl className="profile-details">
                <div className="profile-detail-row">
                  <dt>Full name</dt>
                  <dd>{authUser.fullName || '—'}</dd>
                </div>
                <div className="profile-detail-row">
                  <dt>Username</dt>
                  <dd>@{authUser.username || '—'}</dd>
                </div>
                <div className="profile-detail-row">
                  <dt>Email</dt>
                  <dd>{authUser.email || '—'}</dd>
                </div>
                <div className="profile-detail-row">
                  <dt>Email status</dt>
                  <dd>{emailVerified}</dd>
                </div>
                <div className="profile-detail-row">
                  <dt>Member since</dt>
                  <dd>{memberSince}</dd>
                </div>
                <div className="profile-detail-row">
                  <dt>Subscription</dt>
                  <dd>
                    <span className={`profile-status-badge ${isSubscribed ? 'is-active' : ''}`}>
                      {formatSubscriptionStatus(subscriptionStatus)}
                    </span>
                  </dd>
                </div>
                {currentPeriodEnd ? (
                  <div className="profile-detail-row">
                    <dt>Current period ends</dt>
                    <dd>{formatDate(currentPeriodEnd)}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="profile-quick-links">
                <Link className="btn btn-secondary" to="/dashboard">
                  Open Dashboard
                </Link>
              </div>
            </article>

            <article className="planner-card auth-card profile-card">
              <h3>Change Password</h3>
              <p className="profile-section-note">Choose a strong password with at least 6 characters.</p>
              <form className="profile-form" onSubmit={handleChangePassword}>
                <label>
                  New password
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                    }
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                    }
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                  />
                </label>
                <button className="btn btn-primary" type="submit" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </article>

            <article className="planner-card auth-card profile-card">
              <h3>Manage Subscription</h3>
              {isSubscribed ? (
                subscriptionStatus === 'voucher' ? (
                  <p className="profile-section-note">
                    Your premium access was granted via voucher. Contact support if you need billing changes.
                  </p>
                ) : (
                  <>
                    <p className="profile-section-note">
                      Update payment method, view invoices, or cancel your subscription through the secure Stripe
                      billing portal.
                    </p>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleManageSubscription}
                      disabled={isOpeningPortal}
                    >
                      {isOpeningPortal ? 'Opening portal...' : 'Manage Billing in Stripe'}
                    </button>
                  </>
                )
              ) : (
                <>
                  <p className="profile-section-note">
                    Subscribe to unlock the full Guardian Study Planner on web and mobile.
                  </p>
                  <div className="profile-action-row">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={handleSubscribe}
                      disabled={isStartingCheckout}
                    >
                      {isStartingCheckout ? 'Redirecting...' : 'Subscribe Now'}
                    </button>
                    <Link className="btn btn-secondary" to="/payment">
                      View Plans
                    </Link>
                  </div>
                </>
              )}
            </article>

            <article className="planner-card auth-card profile-card profile-card-danger">
              <h3>Delete Account</h3>
              <p className="profile-section-note">
                Permanently delete your account, planner data, blogs, and subscription. This action cannot be undone.
              </p>
              <form className="profile-form" onSubmit={handleDeleteAccount}>
                <label>
                  Type your email to confirm
                  <input
                    type="email"
                    value={deleteConfirm}
                    onChange={(event) => setDeleteConfirm(event.target.value)}
                    placeholder={authUser.email || 'your@email.com'}
                    autoComplete="off"
                    disabled={isDeletingAccount}
                  />
                </label>
                <button className="btn btn-danger" type="submit" disabled={isDeletingAccount}>
                  {isDeletingAccount ? 'Deleting account...' : 'Delete My Account'}
                </button>
              </form>
            </article>
          </div>

          {message ? <p className="profile-status-msg" role="status">{message}</p> : null}
          {error ? <p className="planner-error profile-error">{error}</p> : null}
        </section>
      </section>
    </>
  )
}

export default ProfilePage
