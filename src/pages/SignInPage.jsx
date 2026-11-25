import logo from '../assets/guardian-angel-logo-720.webp'
import { clearPasswordRecovery, detectPasswordRecoveryFromUrl, isPasswordRecoveryPending, markPasswordRecovery } from '../utils/authRecovery.js'
import { hasSupabaseConfig, supabase } from '../utils/supabaseClient.js'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const SIGNIN_DRAFT_KEY = 'ga-signin-draft'

/** Google OAuth is enabled above this width; disabled (greyed) at mobile widths (WebView / small screens). */
const SIGNIN_GOOGLE_DISABLED_MEDIA = '(max-width: 720px)'

function resolvePostAuthPath({ from }) {
  if (from === '/payment') return '/guardian-study-planner'
  return from || '/guardian-study-planner'
}

export default function SignInPage({ authUser, isAuthReady }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const resolveInitialMode = () => {
    if (isPasswordRecoveryPending() || detectPasswordRecoveryFromUrl()) return 'reset'
    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup') return 'signup'
    if (modeParam === 'forgot') return 'forgot'
    if (modeParam === 'reset') return 'reset'
    return 'signin'
  }
  const [mode, setMode] = useState(resolveInitialMode)
  const [form, setForm] = useState(() => {
    try {
      const raw = localStorage.getItem(SIGNIN_DRAFT_KEY)
      const draft = raw ? JSON.parse(raw) : null
      return {
        fullName: draft?.fullName || '',
        email: draft?.email || '',
        password: draft?.password || '',
      }
    } catch {
      return { fullName: '', email: '', password: '' }
    }
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(SIGNIN_GOOGLE_DISABLED_MEDIA).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mq = window.matchMedia(SIGNIN_GOOGLE_DISABLED_MEDIA)
    const onChange = () => setIsNarrowViewport(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (isPasswordRecoveryPending() || detectPasswordRecoveryFromUrl()) {
      markPasswordRecovery()
      setMode('reset')
      return
    }
    setMode(resolveInitialMode())
  }, [searchParams])

  useEffect(() => {
    if (!supabase) return undefined
    if (detectPasswordRecoveryFromUrl() || isPasswordRecoveryPending()) {
      markPasswordRecovery()
      setMode('reset')
    }
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        markPasswordRecovery()
        setMode('reset')
        setError('')
        setMessage('Choose a new password for your account.')
      }
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
    }
  }, [location.state])

  useEffect(() => {
    if (authUser && isAuthReady && mode !== 'reset' && mode !== 'forgot') {
      const nextPath = resolvePostAuthPath({ from: location.state?.from })
      navigate(nextPath, { replace: true })
    }
  }, [authUser, isAuthReady, mode, navigate, location.state])

  useEffect(() => {
    if (mode === 'reset' || mode === 'forgot') return
    try {
      localStorage.setItem(SIGNIN_DRAFT_KEY, JSON.stringify(form))
    } catch {
      // Ignore storage failures and continue with in-memory interactions.
    }
  }, [form, mode])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!hasSupabaseConfig || !supabase) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    const email = form.email.trim()
    const password = form.password
    setIsSubmitting(true)
    try {
      if (mode === 'forgot') {
        if (!email) {
          setError('Please enter your email address.')
          return
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/signin?mode=reset`,
        })
        if (resetError) throw resetError
        setMessage('Password reset link sent. Please check your email and follow the instructions.')
        return
      }

      if (mode === 'reset') {
        if (!password || !confirmPassword) {
          setError('Please enter and confirm your new password.')
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.')
          return
        }
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        clearPasswordRecovery()
        setConfirmPassword('')
        setForm((current) => ({ ...current, password: '' }))
        setMessage('Password updated successfully. Redirecting...')
        const nextPath = resolvePostAuthPath({ from: location.state?.from })
        navigate(nextPath, { replace: true })
        return
      }

      if (!email || !password) {
        setError('Please enter email and password.')
        return
      }

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/signin`,
            data: {
              full_name: form.fullName.trim() || email.split('@')[0],
              username: email.split('@')[0],
            },
          },
        })
        if (signUpError) throw signUpError
        setMessage('Signup successful. Please verify your email, then sign in.')
        setMode('signin')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (submitError) {
      setError(submitError?.message || 'Unable to continue. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    if (isNarrowViewport) return
    if (!hasSupabaseConfig || !supabase) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }
    setIsSubmitting(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/signin`,
        },
      })
      if (oauthError) throw oauthError
    } catch (oauthError) {
      setError(oauthError?.message || 'Google sign-in failed.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <section className="intro auth-intro">
        <div className="intro-video auth-video" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="none" poster={logo}>
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="intro-overlay auth-overlay" aria-hidden="true" />
        <section className="container auth-page auth-page-overlay">
        <div className="section-title">
            {/* <p>{mode === 'signup' ? 'Create Account' : 'Sign In Required'}</p> */}
            <h2 className="auth-title-pump">
              {mode === 'signup'
                ? 'Join The Guardian Angel Community'
                : mode === 'forgot'
                  ? 'Reset Your Password'
                  : mode === 'reset'
                    ? 'Set a New Password'
                    : 'Access Guardian Study Planner'}
            </h2>
        </div>

        <article className="planner-card auth-card">
          {mode === 'forgot' ? (
            <p className="auth-mode-lead">
              Enter your account email and we will send you a password reset link.
            </p>
          ) : null}
          {mode === 'reset' ? (
            <p className="auth-mode-lead">Choose a new password for your Guardian Angel account.</p>
          ) : null}
          <form className="planner-form" onSubmit={handleSubmit}>
            {mode === 'signup' ? (
            <label>
                Full Name
              <input
                  name="fullName"
                type="text"
                  value={form.fullName}
                onChange={(event) =>
                    setForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  required
                />
              </label>
            ) : null}
            {mode !== 'reset' ? (
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            ) : null}

            {mode === 'signin' || mode === 'signup' || mode === 'reset' ? (
            <label>
              {mode === 'reset' ? 'New Password' : 'Password'}
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
                minLength={mode === 'reset' ? 6 : undefined}
              />
            </label>
            ) : null}

            {mode === 'reset' ? (
              <label>
                Confirm New Password
                <input
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </label>
            ) : null}

            {mode === 'signin' ? (
              <p className="auth-forgot-link">
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setMessage('')
                    setMode('forgot')
                  }}
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </p>
            ) : null}

            <div className="blog-create-actions">
              <button className="btn btn-primary planner-submit" type="submit" disabled={isSubmitting}>
                {mode === 'signup'
                  ? 'Create Account'
                  : mode === 'forgot'
                    ? isSubmitting
                      ? 'Sending...'
                      : 'Send Reset Link'
                    : mode === 'reset'
                      ? isSubmitting
                        ? 'Updating...'
                        : 'Update Password'
                      : 'Sign In'}
              </button>
              {mode === 'signin' || mode === 'signup' ? (
              <button
                className="btn btn-google"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isNarrowViewport}
                title={
                  isNarrowViewport
                    ? 'Google sign-in is available on wider screens. Use email and password here.'
                    : undefined
                }
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt=""
                  aria-hidden="true"
                />
                <span>Continue with Google</span>
              </button>
              ) : null}
            </div>
            {isNarrowViewport && (mode === 'signin' || mode === 'signup') ? (
              <p className="auth-google-desktop-only-msg" role="status">
                Google Signin is available on desktop.
              </p>
            ) : null}
            <button
              className="btn btn-secondary planner-submit"
              type="button"
              onClick={() => {
                setError('')
                setMessage('')
                if (mode === 'forgot' || mode === 'reset') {
                  setMode('signin')
                  return
                }
                setMode((current) => (current === 'signin' ? 'signup' : 'signin'))
              }}
              disabled={isSubmitting}
            >
              {mode === 'forgot' || mode === 'reset'
                ? 'Back to Sign In'
                : mode === 'signup'
                  ? 'Have an account? Sign In'
                  : "Don't have an account? Sign Up"}
            </button>
            {message ? <p className="auth-success-msg" role="status">{message}</p> : null}
            {error ? <p className="planner-error">{error}</p> : null}
          </form>
        </article>
      </section>
      </section>
    </>
  )
}
