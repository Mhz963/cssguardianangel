import VideoGuide from './components/VideoGuide.jsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FIRST_MONTH_PRICE_PKR, MONTHLY_PRICE_PKR } from './utils/paymentClient.js'

const PLANNER_FEATURES = [
  {
    title: 'Subject Locker',
    text: 'Select compulsory and optional subjects with FPSC group rules and lock your 600-mark combination.',
    details: [
      'All compulsory subjects pre-listed, with your one compulsory elective choice.',
      'Optional subjects organized in official FPSC groups with per-group limits.',
      'Locks your combination at exactly 600 marks so your plan stays valid.',
      'Locked subjects flow into your strategy, calendar, and reports automatically.',
    ],
  },
  {
    title: 'Strategy Builder',
    text: 'Build a personalized timetable around your productive hours, daily targets, and revision cycles.',
    details: [
      'Pick your productive hours across morning, evening, and night slots.',
      'Set daily study load and subjects-per-day pace that fits your life.',
      'Generates a personal CSS timetable — not a generic template.',
      'Planner reminders nudge you when a study block begins.',
    ],
  },
  {
    title: 'Performance Analysis',
    text: 'Rate every subject as Survivor, Contender, or Topper and instantly see where to push harder.',
    details: [
      'Drag each subject into Survivor, Contender, or Topper level.',
      'Visual board shows your weak zones at a glance.',
      'Export a Performance Analysis PDF to review or share with a mentor.',
    ],
  },
  {
    title: 'Timer & Analytics',
    text: 'Run focused study sessions and track your real hours with clear per-subject analytics.',
    details: [
      'Start, pause, and stop a real study timer per session.',
      'Sessions are saved so your history builds automatically.',
      'See daily and weekly study-hour analytics to keep yourself honest.',
    ],
  },
  {
    title: 'Social Balance',
    text: 'Monitor screen time and social habits so scrolling never silently eats your preparation.',
    details: [
      'Log social and entertainment screen time alongside study time.',
      'Compare study vs. scroll to spot discipline leaks early.',
      'Build a sustainable routine instead of burnout sprints.',
    ],
  },
  {
    title: 'Guardian Calendar',
    text: 'Mark study, revision, and mock-test days on a monthly calendar that keeps you accountable.',
    details: [
      'Month view with study, revision, and mock-test day statuses.',
      'Tap any day to update its status as your plan evolves.',
      'Keeps a visible record of consistency across the month.',
    ],
  },
  {
    title: 'Guardian Angel Report',
    text: 'Generate clean PDF progress reports for weekly review, mentoring, or honest self-audit.',
    details: [
      'One-tap weekly report PDF with your plan and progress.',
      'Course outline PDF for your locked subject combination.',
      'View or download reports on web, mobile, and in the app.',
    ],
  },
  {
    title: 'AI Examiner',
    text: 'Practice Essay, Precis, and Affairs answers with structured scoring and 7-day improvement drills.',
    inDevelopment: true,
    details: [
      'Practice Essay, Precis, Current Affairs, Pakistan Affairs, and Islamiat answers.',
      'Structured scoring on relevance, structure, analysis, evidence, and language.',
      'Generates a 7-day drill plan you can apply straight to your calendar.',
    ],
  },
]

function GuardianStudyPlannerLandingPage({ authUser }) {
  const getStartedPath = authUser ? '/payment' : '/signin?mode=signup'
  const getStartedState = authUser ? undefined : { from: '/guardian-study-planner' }
  const [activeFeature, setActiveFeature] = useState(null)

  useEffect(() => {
    if (!activeFeature) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setActiveFeature(null)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activeFeature])

  return (
    <main className="gsp-landing">
      <section className="gsp-landing-screen" aria-label="Guardian Study Planner">
        <div className="gsp-landing-hero-media" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="metadata">
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="gsp-landing-hero-overlay" aria-hidden="true" />

        <div className="container gsp-landing-content">
          <header className="gsp-landing-head">
            <h1 className="gsp-landing-brand">Guardian Study Planner</h1>
          </header>

          <div className="gsp-landing-feature-list">
            {PLANNER_FEATURES.map((feature) => (
              <button
                key={feature.title}
                type="button"
                className="gsp-landing-feature"
                onClick={() => setActiveFeature(feature)}
              >
                <h3>
                  {feature.title}
                  {feature.inDevelopment ? <span className="gsp-landing-dev-tag">In Development</span> : null}
                </h3>
                <p>{feature.text}</p>
              </button>
            ))}
          </div>

          <footer className="gsp-landing-foot">
            <Link className="btn btn-primary gsp-landing-cta" to={getStartedPath} state={getStartedState}>
              Get Started
            </Link>
            <p className="gsp-landing-price">
              PKR {FIRST_MONTH_PRICE_PKR.toLocaleString('en-PK')} first month · PKR{' '}
              {MONTHLY_PRICE_PKR.toLocaleString('en-PK')}/month after
            </p>
          </footer>
        </div>
      </section>

      <section className="container gsp-landing-guide">
        <VideoGuide
          id="planner-guide"
          src="/media/study-planner-tutorial.mp4"
          poster="/media/study-planner-tutorial-poster.webp"
          title="See the Study Planner in action"
          duration="2 min"
        >
          Lock your subjects, generate your plan, track study hours and follow your progress in the Guardian Angel Report.
        </VideoGuide>
      </section>

      {activeFeature ? (
        <div
          className="gsp-feature-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={activeFeature.title}
          onClick={() => setActiveFeature(null)}
        >
          <article className="gsp-feature-modal" onClick={(event) => event.stopPropagation()}>
            <header className="gsp-feature-modal-head">
              <h3>
                {activeFeature.title}
                {activeFeature.inDevelopment ? (
                  <span className="gsp-landing-dev-tag">In Development</span>
                ) : null}
              </h3>
              <button
                type="button"
                className="gsp-feature-modal-close"
                aria-label="Close"
                onClick={() => setActiveFeature(null)}
              >
                &times;
              </button>
            </header>
            <p className="gsp-feature-modal-lead">{activeFeature.text}</p>
            <ul className="gsp-feature-modal-list">
              {activeFeature.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {activeFeature.inDevelopment ? (
              <p className="gsp-feature-modal-devnote">
                AI Examiner is currently in development mode for web and mobile — it will keep
                improving with upcoming updates.
              </p>
            ) : null}
            <Link
              className="btn btn-primary gsp-landing-cta"
              to={getStartedPath}
              state={getStartedState}
              onClick={() => setActiveFeature(null)}
            >
              Get Started
            </Link>
          </article>
        </div>
      ) : null}
    </main>
  )
}

export default GuardianStudyPlannerLandingPage
