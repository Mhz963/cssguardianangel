import { Link } from 'react-router-dom'
import { SUPPORT_EMAIL } from '../siteConfig.js'

export function AboutGuardianAngelPage() {
  return (
    <main className="page-main">
      <section className="container about-guardian-page">
        <div className="section-title about-guardian-animated">
          <h2>About Guardian Angel</h2>
          
        </div>

        <article className="about-guardian-card about-guardian-animated about-guardian-animated-delay">
          <p>
            Guardian Angel believes that education is a basic right of every citizen, as guaranteed by
            the Constitution of Pakistan. Over time, education has been turned into a business where many academies
            exploit students through marketing, costly notes, and by selling CSS as a brand instead of treating it as a
            national responsibility.
          </p>
          <p>
            In many cases, success stories and CSP officers are used as promotional tools to create an illusion of
            guaranteed success, which shifts the focus from learning and service to profit and branding.
          </p>
          <p>
            Guardian Angel stands as an{' '}
            <span className="guardian-highlight-word">anti system to this business academic culture</span>. It focuses on
            providing real, simple, and high
            quality guidance to CSS aspirants so that every student has equal opportunity to compete fairly and serve
            the nation with honesty and purpose. Any individual who donates knowledge, time, or guidance to others is
            also a Guardian Angel and a true hero of the nation.
          </p>
        </article>
      </section>
    </main>
  )
}

export function PrivacyPolicyPage() {
  return (
    <main className="page-main">
      <section className="container privacy-policy-page">
        <header className="privacy-policy-header">
          <p className="kicker">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="privacy-policy-updated">
            <strong>Last updated:</strong> 25 November 2026
          </p>
          <p className="privacy-policy-intro">
            Guardian Angel (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Guardian Angel website and related
            services (the &quot;Service&quot;). This Privacy Policy explains how we handle personal information when you use
            the Service. By using the Service, you acknowledge this policy. If you do not agree, please discontinue use of
            the Service.
          </p>
        </header>

        <article className="privacy-policy-body">
          <section>
            <h2>1. Who is responsible</h2>
            <p>
              The operator of Guardian Angel is the data controller for personal information processed through this website,
              subject to the role of infrastructure providers described below. For questions about this policy, use the
              contact details or channels we publish on the Service.
            </p>
          </section>

          <section>
            <h2>2. Information we collect</h2>
            <p>Depending on how you use the Service, we may process:</p>
            <ul>
              <li>
                <strong>Account and authentication data</strong> — for example, identifiers and profile details you provide
                when you sign in (such as email address or display name), and technical session tokens associated with your
                account.
              </li>
              <li>
                <strong>Service usage and content you create</strong> — for example, study planner data, preferences, notes,
                or other content you save while signed in, and interactions with features such as blogs or reading progress
                where those features are available.
              </li>
              <li>
                <strong>Technical and log data</strong> — for example, IP address, browser type, device type, approximate
                location derived from IP, pages viewed, referring URLs, and timestamps. Hosting and analytics providers may
                collect similar data in their systems.
              </li>
              <li>
                <strong>Cookies and similar technologies</strong> — small files or storage on your device used for sign-in
                sessions, security, preferences (such as theme), and to understand how the Service is used where we enable
                analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How we use your information</h2>
            <p>We use personal information to:</p>
            <ul>
              <li>Provide, operate, and maintain the Service (including authentication and syncing your data across sessions)</li>
              <li>Improve reliability, security, and performance, and to prevent abuse or fraud</li>
              <li>Communicate with you about the Service where appropriate (for example, essential account or security notices)</li>
              <li>Comply with applicable law and respond to lawful requests from public authorities</li>
            </ul>
            <p>We do not sell your personal information.</p>
          </section>

          <section>
            <h2>4. Legal bases (where applicable)</h2>
            <p>
              If laws such as the GDPR or UK GDPR apply to you, we rely on one or more of the following bases: performance
              of a contract (providing the Service you request); legitimate interests (for example, securing the Service and
              understanding aggregate usage), balanced against your rights; consent, where we ask for it (for example, for
              non-essential cookies where required); and legal obligation.
            </p>
          </section>

          <section>
            <h2>5. Service providers and hosting</h2>
            <p>
              We use trusted third parties to host the Service, store data, and provide authentication or database services
              (for example, cloud hosting and backend providers such as Supabase). They process information only as needed to
              deliver their services to us and in line with our instructions and applicable law. We do not authorize them to
              use your personal information for their own marketing.
            </p>
          </section>

          <section>
            <h2>6. Retention</h2>
            <p>
              We keep personal information only as long as necessary for the purposes above, including legal, accounting, or
              security needs. Account-related data is generally retained while your account exists and for a reasonable
              period afterward unless a longer period is required by law. You may request deletion of your account data where
              applicable; some information may be retained in backups for a limited time or where we must retain it by law.
            </p>
          </section>

          <section>
            <h2>7. Your rights</h2>
            <p>
              Depending on where you live, you may have rights to access, correct, delete, or export your personal
              information, to object to or restrict certain processing, or to withdraw consent where processing is based on
              consent. You may also have the right to lodge a complaint with a supervisory authority. You can delete your
              account and its data yourself at any time (see <Link to="/delete-account">Delete your account</Link>), or email
              us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We will respond in line with applicable law.
            </p>
          </section>

          <section>
            <h2>8. Security</h2>
            <p>
              We implement appropriate technical and organizational measures designed to protect personal information.
              However, no method of transmission or storage is completely secure; we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2>9. Children</h2>
            <p>
              The Service is not directed at children under the age where parental consent is required in your jurisdiction.
              We do not knowingly collect personal information from such children. If you believe we have done so, please
              contact us and we will take appropriate steps.
            </p>
          </section>

          <section>
            <h2>10. International transfers</h2>
            <p>
              Our service providers may process data in countries other than your own. Where required, we use appropriate
              safeguards (such as standard contractual clauses or equivalent mechanisms) for transfers of personal
              information.
            </p>
          </section>

          <section>
            <h2>11. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the revised version on this page and update
              the &quot;Last updated&quot; date. Material changes may be communicated through the Service or other reasonable
              means where appropriate.
            </p>
          </section>

          <section>
            <h2>12. Contact</h2>
            <p>
              For privacy-related questions or requests, email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Our service providers are Supabase (sign-in, database
              and file storage), Vercel (hosting), Google Fonts (typefaces) and YouTube (embedded videos).
            </p>
          </section>
        </article>

        <p className="privacy-policy-back">
          <Link className="btn btn-primary" to="/">
            Back to home
          </Link>
        </p>
      </section>
    </main>
  )
}

export function DeleteAccountPage() {
  return (
    <main className="page-main" id="main-content">
      <section className="container privacy-policy-page">
        <header className="privacy-policy-header">
          <p className="kicker">Account</p>
          <h1>Delete your Guardian Angel account</h1>
        </header>
        <article className="privacy-policy-body">
          <section>
            <h2>Delete it yourself (website or Android app)</h2>
            <ol>
              <li>Sign in at cssguardianangel.com or in the CSS Guardian Angel app.</li>
              <li>
                Open <Link to="/profile#delete-account">My Profile</Link> and scroll to <strong>Delete Account</strong>.
              </li>
              <li>Type DELETE and confirm.</li>
            </ol>
          </section>
          <section>
            <h2>What is deleted</h2>
            <p>
              Your sign-in account, profile, study planner data, sticky notes, blog posts, comments, reactions, portfolio and
              any files you uploaded are permanently deleted straight away. This cannot be undone.
            </p>
          </section>
          <section>
            <h2>Can&apos;t sign in?</h2>
            <p>
              Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address you registered with and ask us to
              delete your account. We will confirm within 7 days.
            </p>
          </section>
        </article>
        <p className="privacy-policy-back">
          <Link className="btn btn-primary" to="/profile#delete-account">
            Go to My Profile
          </Link>
        </p>
      </section>
    </main>
  )
}

export function TermsPage() {
  return (
    <main className="page-main" id="main-content">
      <section className="container privacy-policy-page">
        <header className="privacy-policy-header">
          <p className="kicker">Legal</p>
          <h1>Terms of Use</h1>
          <p className="privacy-policy-updated">
            <strong>Last updated:</strong> 25 November 2026
          </p>
        </header>
        <article className="privacy-policy-body">
          <section>
            <h2>1. The service</h2>
            <p>
              Guardian Angel is a free, independent study platform for candidates preparing for the CSS examination. It is
              not affiliated with the Federal Public Service Commission (FPSC). Always confirm rules, dates and syllabus
              changes with official FPSC notices.
            </p>
          </section>
          <section>
            <h2>2. Your account</h2>
            <p>
              Keep your sign-in details private and give accurate information. You can delete your account at any time from{' '}
              <Link to="/delete-account">Delete your account</Link>.
            </p>
          </section>
          <section>
            <h2>3. Content you post</h2>
            <p>
              You own the blogs, comments and portfolio items you publish, and you are responsible for them. Do not post
              anything unlawful, abusive, misleading, or that infringes someone else&apos;s rights. We may remove content
              or suspend accounts that break these terms.
            </p>
          </section>
          <section>
            <h2>4. Study material</h2>
            <p>
              Study material is provided for personal preparation. Do not resell it. Official documents and past papers
              remain the property of their publishers and are linked or reproduced for educational use.
            </p>
          </section>
          <section>
            <h2>5. No guarantee</h2>
            <p>
              We work to keep information accurate, but the service is provided &quot;as is&quot; without guarantees of
              exam results or uninterrupted availability.
            </p>
          </section>
          <section>
            <h2>6. Contact</h2>
            <p>
              Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
            </p>
          </section>
        </article>
        <p className="privacy-policy-back">
          <Link className="btn btn-primary" to="/">
            Back to home
          </Link>
        </p>
      </section>
    </main>
  )
}
