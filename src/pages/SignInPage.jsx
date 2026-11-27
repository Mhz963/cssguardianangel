import logo from '../assets/guardian-angel-logo-720.webp'
import {
  cleanRecoveryUrl,
  clearPasswordRecovery,
  detectPasswordRecoveryFromUrl,
  friendlyAuthError,
  isPasswordRecoveryPending,
  markPasswordRecovery,
  readAuthLinkError,
  readRecoveryTokenHash,
} from '../utils/authRecovery.js'
import { hasSupabaseConfig, supabase } from '../utils/supabaseClient.js'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const SIGNIN_DRAFT_KEY = 'ga-signin-draft'
/** Supabase allows one reset email per address every 60 seconds. */
const RESEND_COOLDOWN_S = 60
/** Modes that must stay on this page even while a (recovery) session exists. */
const RECOVERY_MODES = new Set(['forgot', 'reset', 'code'])

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
    if (readAuthLinkError()) return 'forgot'
    if (isPasswordRecoveryPending() || detectPasswordRecoveryFromUrl()) return 'reset'
    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup') return 'signup'
    if (modeParam === 'forgot') return 'forgot'
    if (modeParam === 'code') return 'code'
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
  const [resetCode, setResetCode] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const [isVerifyingLink, setIsVerifyingLink] = useState(() => Boolean(readRecoveryTokenHash()))
  const linkHandled = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(readAuthLinkError)
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
    if (readAuthLinkError()) return
    if (isPasswordRecoveryPending() || detectPasswordRecoveryFromUrl()) {
      markPasswordRecovery()
      setMode('reset')
      return
    }
    setMode(resolveInitialMode())
  }, [searchParams])

  // Reset links: show a clear message for expired ones, and verify `token_hash` links on this page.
  useEffect(() => {
    if (linkHandled.current) return
    linkHandled.current = true
    if (readAuthLinkError()) {
      // The message is already shown (initial state); drop the error from the address bar.
      clearPasswordRecovery()
      navigate('/signin?mode=forgot', { replace: true })
      return
    }
    const tokenHash = readRecoveryTokenHash()
    if (!tokenHash || !supabase) return
    markPasswordRecovery()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      .then(({ error: verifyError }) => {
        if (verifyError) {
          clearPasswordRecovery()
          navigate('/signin?mode=forgot', { replace: true })
          setMode('forgot')
          setError(friendlyAuthError(verifyError))
          return
        }
        cleanRecoveryUrl()
        setMessage('Link confirmed. Choose a new password for your account.')
      })
      .catch((verifyError) => {
        setMode('forgot')
        setError(friendlyAuthError(verifyError))
      })
      .finally(() => setIsVerifyingLink(false))
  }, [])

  // In reset mode without a recovery session (old tab, link opened elsewhere), offer the emailed code instead.
  useEffect(() => {
    if (mode !== 'reset' || isVerifyingLink || !supabase) return undefined
    let active = true
    const timer = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession()
      if (!active || data?.session) return
      clearPasswordRecovery()
      setMode('code')
      setMessage('Enter your email and the code from your reset email, then choose a new password.')
    }, 1200)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [mode, isVerifyingLink])

  useEffect(() => {
    if (resendIn <= 0) return undefined
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

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
    if (authUser && isAuthReady && !RECOVERY_MODES.has(mode) && !isVerifyingLink) {
      const nextPath = resolvePostAuthPath({ from: location.state?.from })
      navigate(nextPath, { replace: true })
    }
  }, [authUser, isAuthReady, mode, isVerifyingLink, navigate, location.state])

  useEffect(() => {
    if (RECOVERY_MODES.has(mode)) return
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
        await sendResetEmail(email)
        return
      }

      if (mode === 'code') {
        const code = resetCode.replace(/\s+/g, '')
        if (!email) {
          setError('Please enter your email address.')
          return
        }
        if (!/^\d{6,10}$/.test(code)) {
          setError('Enter the code from your reset email (numbers only).')
          return
        }
        if (!password || password.length < 6) {
          setError('Password must be at least 6 characters.')
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' })
        if (verifyError) throw verifyError
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        finishReset()
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
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData?.session) {
          setMode('code')
          setError(friendlyAuthError({ message: 'Auth session missing' }))
          return
        }
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        finishReset()
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
      setError(
        RECOVERY_MODES.has(mode)
          ? friendlyAuthError(submitError)
          : submitError?.message || 'Unable to continue. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function sendResetEmail(email) {
    if (!email) {
      setError('Please enter your email address.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/signin?mode=reset`,
    })
    if (resetError) throw resetError
    setResendIn(RESEND_COOLDOWN_S)
    setResetCode('')
    setForm((current) => ({ ...current, password: '' }))
    setConfirmPassword('')
    setMode('code')
    setMessage(
      `If an account exists for ${email}, a reset email is on its way. Open the link in it, or enter the code from the email below. Check your spam folder if it has not arrived in a few minutes.`,
    )
  }

  function finishReset() {
    clearPasswordRecovery()
    setConfirmPassword('')
    setResetCode('')
    setForm((current) => ({ ...current, password: '' }))
    setMessage('Password updated successfully. Redirecting...')
    const nextPath = resolvePostAuthPath({ from: location.state?.from })
    navigate(nextPath, { replace: true })
  }

  const handleResend = async () => {
    if (resendIn > 0 || isSubmitting || !supabase) return
    setError('')
    setMessage('')
    setIsSubmitting(true)
    try {
      await sendResetEmail(form.email.trim())
    } catch (resendError) {
      setError(friendlyAuthError(resendError))
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
                : mode === 'forgot' || mode === 'code'
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
            <p className="auth-mode-lead">
              {isVerifyingLink ? 'Checking your reset link...' : 'Choose a new password for your Guardian Angel account.'}
            </p>
          ) : null}
          {mode === 'code' ? (
            <p className="auth-mode-lead">
              Enter the code from your reset email and choose a new password. This works on any device.
            </p>
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

            {mode === 'code' ? (
              <label>
                Reset Code
                <input
                  name="resetCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value)}
                  placeholder="Code from the email"
                  required
                />
              </label>
            ) : null}

            {mode === 'signin' || mode === 'signup' || mode === 'reset' || mode === 'code' ? (
            <label>
              {mode === 'reset' || mode === 'code' ? 'New Password' : 'Password'}
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={mode === 'reset' || mode === 'code' ? 6 : undefined}
              />
            </label>
            ) : null}

            {mode === 'reset' || mode === 'code' ? (
              <label>
                Confirm New Password
                <input
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
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

            {mode === 'forgot' ? (
              <p className="auth-forgot-link">
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setMessage('')
                    setMode('code')
                  }}
                  disabled={isSubmitting}
                >
                  Already have a code?
                </button>
              </p>
            ) : null}

            {mode === 'code' ? (
              <p className="auth-forgot-link">
                <button type="button" onClick={handleResend} disabled={isSubmitting || resendIn > 0}>
                  {resendIn > 0 ? `Resend email in ${resendIn}s` : 'Resend reset email'}
                </button>
              </p>
            ) : null}

            <div className="blog-create-actions">
              <button className="btn btn-primary planner-submit" type="submit" disabled={isSubmitting || isVerifyingLink}>
                {mode === 'signup'
                  ? 'Create Account'
                  : mode === 'forgot'
                    ? isSubmitting
                      ? 'Sending...'
                      : 'Send Reset Link'
                    : mode === 'reset' || mode === 'code'
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
                if (RECOVERY_MODES.has(mode)) {
                  clearPasswordRecovery()
                  setMode('signin')
                  return
                }
                setMode((current) => (current === 'signin' ? 'signup' : 'signin'))
              }}
              disabled={isSubmitting}
            >
              {RECOVERY_MODES.has(mode)
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
