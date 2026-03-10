import { useEffect, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import './App.css'
import logo from './assets/guardian-angel-logo.png'
import {
  compulsorySubjects,
  detailedSubjectPages,
  optionalGroups,
  referenceUrl,
  slugify,
} from './data/syllabusData'

const pillars = [
  {
    title: 'Premium Quality Content',
    text: 'Guardian Angel material is designed according to FPSC standards and focuses on topper level preparation.',
  },
  {
    title: 'Completely Free',
    text: 'No subscriptions. No hidden charges. Knowledge is Priceless.',
  },
  {
    title: 'Smart Preparation',
    text: 'Guardian Angel focuses on strategic preparation, not unnecessary workload.',
  },
  {
    title: 'Equal Opportunity',
    text: 'Students from every city, village, and background can prepare for CSS.',
  },
]

const cssRulesSections = [
  {
    title: 'CSS Age Limit',
    content: [
      "1. No candidate shall be eligible for admission to the competitive examination unless he is neither below the age of twenty-one years nor above the age of thirty years on the cut-off date.",
      "Explanation: A candidate born on or before the 31st day of December, 1988 and on or after the 2nd day of January, 1998 shall not be eligible for the competitive examination of the year 2019.",
      "2. Two years relaxation in upper-age limit of a candidate shall be admissible in respect of the following categories, namely:",
      "(a) the candidates belonging to the scheduled caste and Buddhist community subject to production of a certificate, in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf;",
      "(b) the candidates belonging to the recognized Tribes who are permanent residents of the areas mentioned below and whose families have been living in these areas, subject to production of a certificate, in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf:",
      "(i) Baluchistan;",
      "(ii) Tribal Areas of D.I.Khan and Peshawar Divisions (including former Frontier States of Dir, Swat, Chitral and Amb);",
      "(iii) former excluded (Baloch) area forming part of the Dera Ghazi Khan and Rajanpur Districts;",
      "(iv) former Tribal Areas of Mardan and Hazara Divisions; and",
      "(v) Upper Tanawal Area of Hazara Division;",
      "(c) the candidates who are permanent residents of Azad Kashmir Territory, subject to production of a certificate in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by the Division to which business of Azad Jammu and Kashmir stands allocated;",
      "(d) the candidates who are permanent residents of Gilgit-Baltistan including Gilgit, Diamir, Baltistan, Ghizer and Guanche, subject to production of a certificate in support of their claim, as set out in the application form prescribed by the Commission from time to time and issued by the Deputy Commissioner, District Magistrate or such other person by whatever name called and authorized in this behalf;",
      "(e) the special candidates, namely, physically impaired, hearing or speech impaired and visually impaired, subject to production of certificate of disability in support of their claim issued by an officer of the Federal Government or, as the case may be, Provincial Government duly authorized in this behalf;",
      "(f) in-service Government servants, armed forces personnel, contract employees, including the Government servants of Azad Jammu and Kashmir, who possess a minimum of two years continuous Government service as on the cut-off date subject to production of departmental permission certificate from the competent authority as set out by the Commission from time to time. Employees of nationalized banks, State Bank of Pakistan, Water and Power Development Authority, regulatory authorities, autonomous bodies and other semi-autonomous bodies are not entitled to the age-relaxation under these rules:",
      "Provided that period of extraordinary leave (EOL) shall not be considered as period spent on duty under Fundamental Rule-9(6) for grant of age-relaxation under these rules.",
      "3. The relaxation in upper age-limits prescribed in these rules shall be permitted upto the maximum period of an individual concession and not by the total period of the concessions taken together, if admissible in any case.",
      "4. Except as provided in these rules, a candidate shall not be entitled to further relaxation in age-limit under any other rule for the time being in force or on any other ground.",
    ],
  },
  {
    title: 'CSS Cut-off Date',
    content: [
      "The cutoff date for determining the eligibility of the candidate in terms of age, qualifications, domicile shall be the 31st day of December of the year preceding the year of competitive examination.",
      "Explanation: For competitive examination 2019 the cut-off date thereof shall be the 31st day of December, 2018.",
    ],
  },
  {
    title: 'CSS Educational Qualifications',
    content: [
      "1. A candidate for competitive examination must hold at least a second division or grade \"C\" bachelor's degree in any faculty of one of the Pakistani universities or an equivalent degree or comparable educational qualifications of a foreign university recognized by the Higher Education Commission (HEC), subject to production of equivalence certificate issued by HEC.",
      "2. Where a candidate does not hold the required degree on or before the cut-off date, he shall be required to produce a certificate from the duly authorized officer of the concerned degree awarding institution, to the effect that the candidate has fulfilled all the requirements of the said degree and has cleared and passed the examination for the said degree on or before the cut-off date. The candidate however would be required to produce the said degree before the final result is declared by the Commission.",
      "3. A candidate who has obtained a third division or 'D' grade in his bachelor's degree shall be eligible for the competitive examination in cases where he has obtained a higher division or grade in master's degree.",
    ],
  },
  {
    title: 'CSS Nationality',
    content: [
      '1. Candidates for competitive examination must be a citizen of Pakistan or a person deriving his nationality from the State of Jammu and Kashmir.',
      '2. A candidate who has married a person who is not a citizen of Pakistan shall not be eligible for appointment provided that a person who marries a foreign national of any country recognized by Federal Government with the prior permission of Government may be regarded as eligible for appointment.',
    ],
  },
  {
    title: 'CSS Domicile',
    content: [
      '1. Seats in respect of the Occupational Groups and Services shall be allocated in accordance with the policy as may be prescribed by the Federal Government before finalizing the appointments and for that purpose the candidates shall produce domicile certificate issued by the competent authority in accordance with the law and the rules.',
      '2. A candidate who has acquired the citizenship of Pakistan by registration under the Pakistan Citizenship Act, 1951 (II of 1951) and the rules made thereunder shall produce along with the application an attested copy of the certificate of citizenship. A candidate who has not been registered as a citizen of Pakistan but claims that he should be deemed to be citizen of Pakistan under the Pakistan Citizenship Act, 1951 (II of 1951) shall produce proof to the effect that he fulfills the conditions on the basis of which he claims to be deemed as a citizen of Pakistan. A candidate who derives his nationality from the State of Jammu and Kashmir shall produce along with the application a certificate issued by the Division to which business of the Azad Jammu and Kashmir stands allocated duly signed by an officer not below the rank of Deputy Secretary in support of his claim.',
      '3. Candidates of Azad Jammu and Kashmir shall produce domicile certificate alongwith permanent residence certificate along with the application forms issued by the Division to which business of the Azad Jammu and Kashmir stands allocated duly signed by an officer not below the rank of Deputy Secretary in support of his claim. No such certificates shall be accepted at any later stage.',
      '4. Domicile once claimed by a candidate and accepted by the Commission for the purpose of admission to competitive examination shall be final. No change will be allowed at a subsequent examination or selection.',
      '5. Domicile claimed by a candidate and accepted at the time of his first entry into Government service shall be treated as final for the purpose of candidature and allocation and no subsequent change in his domicile shall be accepted.',
    ],
  },
  {
    title: 'CSS Application Form',
    content: [
      "1. All applications for the competitive examination must be made online through the Commission's website www.fpsc.gov.pk.",
      '2. Online applications must be made on or before the closing date as advertised by the Commission.',
      "3. Printed copy of duly filled online application form (i.e. hardcopy) may be obtained and after signing it, copies of all documents and certificates as mentioned in application form alongwith original treasury receipt may be attached with it and dispatched to the Secretary of the Commission, so as to reach the Commission's headquarters within ten days of the closing date.",
      '4. An online application received incomplete, wrongly filled in or its hardcopy not accompanied with any one of the documents mentioned in the application form, shall be rejected.',
      '5. Hardcopy of the online application, if reached to the Commission after the stipulated period of ten days from the closing date, it shall not be accepted and online form already submitted to the Commission shall stand rejected.',
      '6. Any correction in the printed hard copy of online form may be made by hand and initialled before dispatch or submission to the Commission, whereafter no request for change in any entry of online application or its hard copy shall be accepted.',
      '7. No plea that hardcopy of online application form or any document attached therewith has been lost or delayed in the post shall be entertained.',
      "8. The candidate shall have to pay or deposit two hundred and fifty Rupees in the Commission's head of account as fine, if hard copy of online application is received without signature, subject to no other deficiency in application or attached documents, otherwise his application shall stand rejected.",
      '9. Hardcopy of the online application must be dispatched in a separate envelope. Two or more applications in one envelope shall not be acceptable.',
      "10. Candidate shall pay two thousand two hundred Rupees, or such other fee as the Commission may determine from time to time, as application fee for competitive examination as per procedure prescribed in Appendix-II and deposited in the nearest Government's treasury or in State Bank or National Bank of Pakistan under the head of account C02101-Organs of State Exam Fee (FPSC Receipt). Cash, postal orders, bank drafts and cheques shall not be accepted by the Commission.",
      '11. Original treasury receipt for written examination must be attached with the application form to be deposited to the Commission. Without providing original treasury receipt, the application of the candidate shall be rejected.',
      '12. Subjects for the competitive examination shall comprise compulsory papers of 600 marks and optional papers of 600 marks.',
      '13. Optional subjects must be selected carefully, as wrong selection of subjects shall lead to rejection of candidature.',
      '14. Combination of optional subjects once chosen before closing date for submission of online application or corrected in hard copy of online application shall be treated as final and no request for change in subjects shall be allowed thereafter.',
      '15. A candidate who misses any compulsory or optional subject of written examination for medical or any other reasons shall neither be allowed to appear in the remaining subjects nor separate examination for re-appearing in that missed paper shall be allowed.',
      '16. No candidate shall be eligible to avail more than three chances of the competitive examination within prescribed age-limits.',
      'Explanation.- A candidate shall be deemed to have attempted the examination and his chance stand consumed, if he actually appeared in any one or more papers of the competitive examination and even if he tendered blank answer book or sheet and even if rejected subsequently.',
      '17. A candidate who conceals the number of previous attempts, shall be liable to prosecution leading to his disqualification under these rules.',
      "18. No candidate shall be admitted to the examination hall who does not hold original Computerized National Identity Card (CNIC) and admission certificate generated or downloaded from the Commission's website i.e. www.fpsc.gov.pk as admission certificate shall not be sent through post.",
      '19. A candidate who arrives at examination hall or centre late, than the time mentioned in admission certificate and date sheet, he shall not be allowed to sit in the examination.',
      '20. Candidates shall be admitted to the examination provisionally at their own risk subject to their being found eligible in all respects. On detailed scrutiny of the applications after the announcement of result of the written examination, if any candidate is found ineligible in any respect under these rules his candidature shall be cancelled and rejected regardless of the fact whether he has appeared in the examination or qualified therein.',
      '21. To avoid inconvenience, candidates shall ensure before appearing at the examination that they fulfill all requirements of the rules, relating to the examination.',
    ],
  },
  {
    title: 'CSS Occupational Groups',
    content: [
      'The competitive examination shall be conducted by the Commission in respect of the Occupational Groups and Services consisting of:',
      '1. Commerce and Trade Group',
      '2. Foreign Service of Pakistan',
      '3. Information Group',
      '4. Inland Revenue Service',
      '5. Military Lands and Cantonments Group',
      '6. Office Management Group',
      '7. Pakistan Administrative Service',
      '8. Pakistan Audit and Accounts Service',
      '9. Pakistan Customs Service',
      '10. Police Service of Pakistan',
      '11. Postal Group',
      '12. Railways (Commercial and Transportation) Group',
    ],
  },
  {
    title: 'CSS Qualifying Marks for Written Exam',
    content: [
      '1. A candidate who fails to secure at least 40% marks in any of the compulsory subjects, 33% marks in any of the optional subjects and 50% marks in the aggregate shall be considered to have failed in written examination and shall not be eligible for medical examination, psychological assessment and viva voce.',
      '2. Only the candidates declared qualified in the written examination and found eligible shall be called for subsequent medical examination, psychological assessment and viva voce.',
    ],
  },
  {
    title: 'CSS Medical Examination',
    content: [
      '1. All candidates must be in good mental and bodily health and free from any physical defect likely to interfere with the discharge of their duties. The candidates who after such medical examination which the Commission and the appointing authority may prescribe are found not to satisfy these requirements shall not be appointed except special candidates as mentioned in sub-rule (2) of CSS Competitive Examination Rules, 2019.',
      '2. Special candidates in the categories of physically impaired, hearing or speech impaired and visually impaired shall be eligible to compete for competitive examination against all Occupational Groups and Services according to his choice.',
      '3. Special candidates who are visually impaired or physically impaired shall be provided helper (writer), if they have been, by any Federal or a Provincial Council for Rehabilitation of Disabled Persons, declared permanently incapacitated with respect to writing and a disability certificate in that regard has been attached by them with application form and also requested for provision of helper in their application form. The Commission shall arrange the helper from within the available staff of the Commission deputed at the examination centre. The role of the helper would merely be to reproduce in writing the words so uttered by the special candidate. No intellectual contribution by the helper shall be permissible. The educational level of the helper would be graduation, intermediate or matriculation as per availability at the examination centre. No request for helper of choice or venue of the examination shall be entertained. The special candidate alongwith helper shall remain within the examination hall till conclusion of the paper.',
      '4. Extra time of 15 minutes per hour shall only be allowed to visually impaired candidates. The other categories of special candidates shall not be allowed extra time.',
      "5. The special candidate referred to in sub-rules (3) and (4) of CSS Competitive Examination Rules, 2019 may attempt the question paper on computer, as the case may be, for which facility shall only be provided at the Commission's headquarters and its provincial offices, however, no TA/DA shall be admissible. Such computer literate candidates shall fill the relevant entries in the online application form, else they shall not be allowed to attempt the paper on computer.",
      '6. No application or medical certificate regarding claim for disability or request for provision of helper or computer on medical grounds or sudden accident, shall be accepted after the closing date, except where the claim has been made in the application form before the closing date and certificate of disability as aforesaid attached as an evidence.',
      '7. Candidates who qualify the written examination shall be medically examined by the medical board constituted for the purpose. If any candidate remains absent twice in his medical examination, his candidature shall automatically stand rejected and no appeal in this regard shall be entertained and his chance shall be considered as consumed.',
      "8. In order to prevent disappointment, candidates may get themselves examined by a Government's medical officer of the standing of a civil surgeon before applying for admission to the examination.",
    ],
  },
  {
    title: 'CSS Viva Voce',
    content: [
      '1. A candidate who is declared qualified in written examination shall be interviewed by a board who shall have before them a record of his career, both academic and extramural and he shall be asked questions on matters of general interest. The object of the interview is to assess his suitability for the services for which he is entered and in framing their assessment the board shall attach particular importance to the moral and ethical qualities of the candidates, his intelligence and alertness of mind, his vigour and strength of character and his potential qualities of leadership. The board shall take into consideration his extramural activities such as sports, debates, hobbies, etc., and their effect on his physique and character, in assessing his merit.',
      '2. All candidates are expected to have basic knowledge regarding Islam and Pakistan. Questions may be asked in the viva voce on these subjects. Persons securing less than pass marks in these subjects shall not be considered for appointment, irrespective of their proficiency in other fields. However, the non-Muslim candidates shall not be asked any question regarding Islam.',
      '3. Viva voce shall be of 300 marks. A candidate who fails to secure at least 100 marks in viva voce shall be considered to have failed and shall not be eligible for appointment.',
      '4. The result of viva voce shall be intimated to all candidates in due course of time.',
    ],
  },
]

function Header({ theme, onToggleTheme }) {
  const [animateToggle, setAnimateToggle] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'CSS Rules', to: '/css-rules' },
    { label: 'CSS Syllabus', to: '/css-syllabus' },
  ]

  const handleThemeToggle = () => {
    setAnimateToggle(true)
    onToggleTheme()
    window.setTimeout(() => setAnimateToggle(false), 800)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <header className="topbar">
      <div className="topbar-inner container">
        <Link className="brand" to="/" aria-label="Guardian Angel home">
          <img src={logo} alt="Guardian Angel logo" />
          <div>
            <strong>Guardian Angel</strong>
            <span>Knowledge Is Priceless</span>
          </div>
        </Link>

        <button
          className={`nav-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
          type="button"
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
          {navItems.map((item) =>
            item.to.startsWith('/#') ? (
              <a key={item.label} href={item.to} onClick={closeMobileMenu}>
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-active' : '')}
                onClick={closeMobileMenu}
              >
                {item.label}
              </NavLink>
            ),
          )}
          <a className="btn btn-nav" href="/#student-message" onClick={closeMobileMenu}>
            Start Preparation
          </a>
          <button
            className={`btn btn-secondary theme-toggle ${animateToggle ? 'animate' : ''}`}
            type="button"
            onClick={handleThemeToggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span aria-hidden="true" className="theme-icon">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" role="img">
                  <circle cx="12" cy="12" r="4.2" />
                  <path d="M12 2.2v3M12 18.8v3M2.2 12h3M18.8 12h3M4.8 4.8l2.1 2.1M17.1 17.1l2.1 2.1M19.2 4.8l-2.1 2.1M6.9 17.1l-2.1 2.1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M21 14.8A9.2 9.2 0 1 1 9.2 3a7.5 7.5 0 1 0 11.8 11.8Z" />
                </svg>
              )}
            </span>
          </button>
        </nav>
      </div>
    </header>
  )
}

function HomePage() {
  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal-on-scroll')
    if (revealItems.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            currentObserver.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    )

    revealItems.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <section className="intro" id="home">
        <div className="intro-video" aria-hidden="true">
          <video autoPlay loop muted playsInline preload="metadata" poster={logo}>
            <source src="/media/guardian-intro.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="intro-overlay" aria-hidden="true" />

        <section className="hero container">
          <div className="hero-copy reveal-on-scroll">
            
            <h1>Pakistan&apos;s First Free, High Quality CSS Preparation Platform</h1>
            <p className="subtext">
              Guardian Angel is an independent platform dedicated to helping CSS aspirants across
              Pakistan access premium quality education completely free of cost.
            </p>
            <p className="hero-tagline">Where Merit Meets Opportunity</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#mission">
                Explore Mission
              </a>
              <a className="btn btn-secondary" href="#student-message">
                Read Student Message
              </a>
            </div>
          </div>
        </section>
      </section>

      <main>
        <section className="mission container glass-panel reveal-on-scroll" id="mission">
          <div className="section-title">
            <h2>Knowledge is Priceless</h2>
          </div>
          <p className="mission-body">
            Talent should never be limited by money. In Pakistan, thousands of brilliant students
            cannot afford expensive academies. Guardian Angel exists to bridge that gap. Guardian Angel&apos;s mission is to democratize CSS education in Pakistan by providing
            world class preparation resources free of cost, ensuring that every talented student,
            regardless of financial background, has the opportunity to compete.
          </p>
          
        </section>

        <section className="highlights container" id="why-guardian-angel">
          {pillars.map((item, index) => (
            <article
              className="card reveal-on-scroll"
              key={item.title}
              style={{ '--reveal-delay': `${index * 100}ms` }}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </section>

        <section className="message container glass-panel reveal-on-scroll" id="student-message">
          <div className="message-content">
            <div className="section-title">
              <h2>CSS is not just an examination.</h2>
            </div>
            <p className="message-body">
              It is a gateway to leadership, service, and national impact. Guardian Angel stands
              with every hardworking aspirant who dreams of wearing the badge of Pakistan&apos;s
              civil service.
            </p>
          </div>
          <div className="message-actions">
            <a className="btn btn-primary home-action-btn" href="/css-rules">
              Browse CSS Rules
            </a>
          </div>
        </section>

        <section className="cta container reveal-on-scroll" id="join">
          <div>
            
            <h2>If you have the determination, Guardian Angel will provide the guidance</h2>
            <p className="cta-subtext">
              High quality study material built for aspirants who are ready to work hard and
              serve the nation.
            </p>
          </div>
          <a className="btn btn-primary home-action-btn" href="/css-syllabus">
            Browse CSS Syllabus
          </a>
        </section>
      </main>
    </>
  )
}

function CssSyllabusPage() {
  return (
    <main className="page-main">
      <section className="syllabus container" id="css-syllabus">
        <div className="section-title">
          <p>CSS Syllabus</p>
          <h2>Compulsory and Optional Subjects</h2>
        </div>

        <article className="syllabus-block">
          <h3>Compulsory Subjects Syllabus</h3>
          <ul className="syllabus-list syllabus-list-links">
            {compulsorySubjects.map((subject) => (
              <li key={subject}>
                <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
              </li>
            ))}
          </ul>
        </article>

        <div className="optional-groups">
          {optionalGroups.map((item) => (
            <article className="group-card" key={item.group}>
              <h3>{item.group}</h3>
              <p className="group-rule">{item.rules}</p>
              <ul className="syllabus-list syllabus-list-links">
                {item.subjects.map((subject) => (
                  <li key={subject}>
                    <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <article className="about-syllabus">
          <h3>Reference Source</h3>
          <p>
            Course list and grouping are based on the source syllabus page. Open the original
            source at{' '}
            <a href={referenceUrl} target="_blank" rel="noreferrer">
              The CSS Point
            </a>
            .
          </p>
        </article>
      </section>
    </main>
  )
}

function CssRulesPage() {
  const [openRuleIndex, setOpenRuleIndex] = useState(0)
  const handleRuleToggle = (index, event) => {
    const headerButton = event.currentTarget
    const topBefore = headerButton.getBoundingClientRect().top

    setOpenRuleIndex((current) => (current === index ? -1 : index))

    window.requestAnimationFrame(() => {
      const topAfter = headerButton.getBoundingClientRect().top
      const delta = topAfter - topBefore
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'auto' })
    })
  }

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Rules</p>
          <h2>Introduction as per CSS Rules 2019</h2>
        </div>

        <p className="rules-source">
          Source:{' '}
          <a
            href="https://www.fpsc.gov.pk/category/introduction-as-per-css-rules-2019"
            target="_blank"
            rel="noreferrer"
          >
            Federal Public Service Commission (FPSC)
          </a>
        </p>

        <div className="rules-accordion">
          {cssRulesSections.map((rule, index) => {
            const isOpen = openRuleIndex === index
            return (
              <article className={`rule-item ${isOpen ? 'open' : ''}`} key={rule.title}>
                <button
                  className="rule-header"
                  type="button"
                  onClick={(event) => handleRuleToggle(index, event)}
                  aria-expanded={isOpen}
                >
                  <span>{rule.title}</span>
                  <span className="rule-icon">{isOpen ? '−' : '+'}</span>
                </button>
                <div className={`rule-body ${isOpen ? 'open' : ''}`}>
                  <div className="rule-content">
                    {rule.content.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function SubjectDetailPage() {
  const { subjectSlug } = useParams()
  const slugAliases = {
    'english-precis-composition': 'english',
    gsa: 'general-science-ability',
    'islamic-studies': 'islamiat',
    'comparative-religions': 'comparative-study-of-major-religions',
  }

  const resolvedSlug = slugAliases[subjectSlug] ?? subjectSlug
  const subject = detailedSubjectPages.find(
    (item) => item.slug === resolvedSlug || item.sourceSlug === resolvedSlug,
  )

  if (!subject) {
    return (
      <main className="page-main">
        <section className="container subject-page">
          <h1>Subject not found</h1>
          <p>Please return to the syllabus page and choose a listed subject.</p>
          <Link className="btn btn-primary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-main">
      <section className="container subject-page">
        <p className="kicker">Detailed CSS Subject Page</p>
        <h1>{subject.title}</h1>
        <div className="subject-meta-grid">
          <article className="subject-meta-card">
            <h3>Marks</h3>
            <p>{subject.marks}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Category</h3>
            <p>{subject.category}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Group</h3>
            <p>{subject.group}</p>
          </article>
        </div>

        <article className="subject-outline">
          <h2>Course Outline</h2>
          <p>{subject.sourceTitle}</p>
          {subject.outlineImages?.length > 0 ? (
            <div className="outline-images">
              {subject.outlineImages.map((imagePath) => (
                <img key={imagePath} src={imagePath} alt={`${subject.title} course outline`} />
              ))}
            </div>
          ) : subject.outlineSections?.length > 0 ? (
            <div className="outline-sections">
              {subject.outlineSections.map((section) => (
                <section className="outline-section" key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.points?.length > 0 ? (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : subject.outline.length > 0 ? (
            <ul>
              {subject.outline.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p>
              Detailed outline was not available in readable format on the source page. Please open
              the original source for this subject.
            </p>
          )}
        </article>

        <div className="subject-actions">
          <Link className="btn btn-secondary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
          <a className="btn btn-primary" href={subject.sourceUrl} target="_blank" rel="noreferrer">
            Open Original Source
          </a>
        </div>
      </section>
    </main>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top container">
        <div className="footer-brand">
          <Link className="brand" to="/" aria-label="Guardian Angel home">
            <img src={logo} alt="Guardian Angel logo" />
            <div>
              <strong>Guardian Angel</strong>
              <span>Knowledge Is Priceless</span>
            </div>
          </Link>
          <p>
            Pakistan&apos;s first free, high quality CSS preparation platform, independently led by
            Guardian Angel, where merit meets opportunity.
          </p>
        </div>

        <div className="footer-links">
          <h4>Explore</h4>
          <a href="/#mission">Mission</a>
          <a href="/#why-guardian-angel">Why Guardian Angel</a>
          <Link to="/css-syllabus">CSS Syllabus</Link>
          <Link to="/css-rules">CSS Rules</Link>
          <a href="/#student-message">Student Message</a>
        </div>

        <div className="footer-links">
          <h4>Core Values</h4>
          <a href="/#why-guardian-angel">Premium Quality</a>
          <a href="/#why-guardian-angel">Completely Free</a>
          <a href="/#why-guardian-angel">Equal Opportunity</a>
          <a href="/#mission">Knowledge is Priceless</a>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>© {new Date().getFullYear()} Guardian Angel. All rights reserved.</p>
      </div>
    </footer>
  )
}

function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 220)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <button
      className={`scroll-top-btn ${isVisible ? 'visible' : ''}`}
      type="button"
      aria-label="Back to top"
      aria-hidden={!isVisible}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      ↑
    </button>
  )
}

function ScrollToTopOnRouteChange() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('ga-theme') || 'light'
    } catch {
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('ga-theme', theme)
    } catch {
      // Ignore storage failures and continue with in-memory theme.
    }
  }, [theme])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return undefined

    const root = document.documentElement

    const handlePointerMove = (event) => {
      root.style.setProperty('--cursor-x', `${event.clientX}px`)
      root.style.setProperty('--cursor-y', `${event.clientY}px`)
      root.style.setProperty('--cursor-glow-opacity', '1')
    }

    const handlePointerLeave = () => {
      root.style.setProperty('--cursor-glow-opacity', '0')
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <div className="site">
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/css-syllabus" element={<CssSyllabusPage />} />
          <Route path="/css-rules" element={<CssRulesPage />} />
          <Route path="/css-syllabus/:subjectSlug" element={<SubjectDetailPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer />
        <BackToTopButton />
      </div>
    </BrowserRouter>
  )
}

export default App
