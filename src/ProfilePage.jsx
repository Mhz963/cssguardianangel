import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { hasSupabaseConfig, supabase } from './utils/supabaseClient.js'
import { isSuperAdminEmail } from './utils/adminClient.js'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function ProfilePage({ authUser }) {
  const [authDetails, setAuthDetails] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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
            <p className="profile-lead">Manage your Guardian Angel account.</p>
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
                  <dt>Guardian Study Planner</dt>
                  <dd>
                    <span className="profile-status-badge is-active">Free access</span>
                  </dd>
                </div>
              </dl>
              <div className="profile-quick-links">
                <Link className="btn btn-secondary" to="/guardian-study-planner">
                  Open Study Planner
                </Link>
                <Link className="btn btn-secondary" to="/guardian-portfolio">
                  Guardian Portfolio
                </Link>
                {isSuperAdminEmail(authUser.email) ? (
                  <Link className="btn btn-primary" to="/admin">
                    Admin Panel
                  </Link>
                ) : null}
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
          </div>

          {message ? <p className="profile-status-msg" role="status">{message}</p> : null}
          {error ? <p className="planner-error profile-error">{error}</p> : null}
        </section>
      </section>
    </>
  )
}

export default ProfilePage
