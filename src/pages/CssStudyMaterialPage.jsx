import { compulsorySubjects, optionalGroups } from '../data/syllabusData'
import { cssStudyMaterials } from '../data/cssStudyMaterialsData'
import { useState } from 'react'

export default function CssStudyMaterialPage() {
  const [query, setQuery] = useState('')
  const [downloadingSubject, setDownloadingSubject] = useState('')
  const [openSubject, setOpenSubject] = useState('')
  const totalSlides = cssStudyMaterials.reduce((count, group) => count + group.slides.length, 0)
  const normalizedQuery = query.trim().toLowerCase()
  const matchesStudyQuery = (slide, subjectTitle) => {
    if (!normalizedQuery) return true
    const searchable = [slide.title || '', slide.fileName || '', subjectTitle || ''].join(' ').toLowerCase()
    return searchable.includes(normalizedQuery)
  }
  const filteredTotal = cssStudyMaterials.reduce(
    (count, group) =>
      count +
      group.slides.filter((slide) => matchesStudyQuery(slide, group.subject)).length,
    0,
  )

  const getConfiguredPublicOrigin = () => {
    const configured =
      String(import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_PUBLIC_WEB_URL || '').trim()
    if (!configured) return ''
    try {
      return new URL(configured).origin
    } catch {
      return ''
    }
  }

  const getPublicSlideUrl = (slide) => new URL(slide.url, window.location.origin).toString()

  const getViewerReachableSlideUrl = (slide) => {
    const absoluteUrl = getPublicSlideUrl(slide)
    try {
      const parsed = new URL(absoluteUrl)
      const isLocalHost =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.local')
      if (!isLocalHost) return absoluteUrl
      const publicOrigin = getConfiguredPublicOrigin()
      if (!publicOrigin) return absoluteUrl
      return new URL(`${parsed.pathname}${parsed.search}`, publicOrigin).toString()
    } catch {
      return absoluteUrl
    }
  }

  const triggerSlideDownload = (slide) => {
    const publicSlideUrl = getPublicSlideUrl(slide)
    const anchor = document.createElement('a')
    anchor.href = publicSlideUrl
    anchor.download = slide.fileName
    anchor.rel = 'noopener'
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
  }

  const handleDownloadAll = async (group) => {
    const visibleSlides = group.slides.filter((slide) => matchesStudyQuery(slide, group.subject))
    if (visibleSlides.length === 0) return

    setDownloadingSubject(group.subject)
    for (const slide of visibleSlides) {
      triggerSlideDownload(slide)
      await new Promise((resolve) => window.setTimeout(resolve, 170))
    }
    window.setTimeout(() => setDownloadingSubject(''), 250)
  }

  const openSlideViewer = (slide) => {
    const publicSlideUrl = getViewerReachableSlideUrl(slide)
    const onlineViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(publicSlideUrl)}`
    window.open(onlineViewerUrl, '_blank', 'noopener,noreferrer')
  }

  const studyBySubject = new Map(cssStudyMaterials.map((item) => [item.subject, item]))

  const compulsoryStudyMaterials = compulsorySubjects.map((title) => studyBySubject.get(title)).filter(Boolean)
  const optionalSections = optionalGroups
    .map((grp) => ({
      group: grp.group,
      subjects: grp.subjects.map((title) => studyBySubject.get(title)).filter(Boolean),
    }))
    .filter((section) => section.subjects.length > 0)
  const optionalSubjectsInSyllabus = new Set(optionalGroups.flatMap((grp) => grp.subjects))
  const additionalOptionalStudyMaterials = cssStudyMaterials.filter(
    (item) => item.category === 'optional' && !optionalSubjectsInSyllabus.has(item.subject),
  )
  const hasQuery = normalizedQuery.length > 0
  const getVisibleSlidesForGroup = (group) =>
    group.slides.filter((slide) => matchesStudyQuery(slide, group.subject))
  const hasMatchInGroup = (group) => getVisibleSlidesForGroup(group).length > 0
  const visibleCompulsoryStudyMaterials = hasQuery
    ? compulsoryStudyMaterials.filter(hasMatchInGroup)
    : compulsoryStudyMaterials
  const visibleOptionalSections = hasQuery
    ? optionalSections
        .map((section) => ({
          ...section,
          subjects: section.subjects.filter(hasMatchInGroup),
        }))
        .filter((section) => section.subjects.length > 0)
    : optionalSections
  const visibleAdditionalOptionalStudyMaterials = hasQuery
    ? additionalOptionalStudyMaterials.filter(hasMatchInGroup)
    : additionalOptionalStudyMaterials

  const renderStudyGroup = (group) => {
    const visibleSlides = getVisibleSlidesForGroup(group)
    const isOpen = hasQuery ? true : openSubject === group.subject

            return (
              <article className={`study-group-card ${isOpen ? 'open' : ''}`} key={group.subject}>
                <button
                  className="study-group-trigger"
                  type="button"
                  onClick={() => setOpenSubject((current) => (current === group.subject ? '' : group.subject))}
                  aria-expanded={isOpen}
                >
                  <span>{group.subject}</span>
                  <span className="rule-icon">{isOpen ? '−' : '+'}</span>
                </button>

                <div className={`study-group-body ${isOpen ? 'open' : ''}`}>
                  <header className="study-group-head">
                    <div className="study-group-topbar">
                      <div>
                        <p>{group.description}</p>
                      </div>
                      <div className="study-group-meta">
                        <span>{`${visibleSlides.length}/${group.slides.length} shown`}</span>
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => handleDownloadAll(group)}
                          disabled={visibleSlides.length === 0 || downloadingSubject === group.subject}
                        >
                          {downloadingSubject === group.subject
                            ? 'Downloading...'
                            : `Download All (${visibleSlides.length})`}
                        </button>
                      </div>
                    </div>
                  </header>

                  {visibleSlides.length === 0 ? (
                    <article className="papers-empty study-empty">
                      <h3>No matching slides in {group.subject}</h3>
                      <p>Try a different keyword to view slides for this section.</p>
                    </article>
                  ) : (
                    <div className="study-slides-grid">
                      {visibleSlides.map((slide) => (
                        <article className="study-slide-item" key={slide.url}>
                          <div>
                            <div className="study-slide-top">
                      <div className="study-slide-meta">
                              <p className="study-slide-tag">Lecture Slide</p>
                        {/motivation/i.test(slide.title || slide.fileName || '') ? (
                          <span className="study-motivation-badge">Motivation</span>
                        ) : null}
                      </div>
                              <span className="study-lecture-badge">
                                {slide.lectureNumber ? `Lecture ${slide.lectureNumber}` : 'Lecture'}
                              </span>
                            </div>
                            <h4>{slide.title}</h4>
                          </div>
                          <div className="study-slide-actions">
                            <button
                              className="btn btn-secondary"
                              type="button"
                              onClick={() => openSlideViewer(slide)}
                            >
                              View Slide
                            </button>
                    <a className="btn btn-primary" href={getPublicSlideUrl(slide)} download={slide.fileName}>
                              Download
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
  }

  return (
    <main className="page-main">
      <section className="container css-rules-page">
        <div className="section-title">
          <p>CSS Study Material</p>
          <h2>CSS Lecture Slides for Smart Preparation</h2>
        </div>


        <p className="rules-source study-material-warning-mantra">
          <span className="guardian-highlight-word-red">
            Do not rely on these slides alone for your CSS preparation, they are meant to give a brief
            overview of each subject and to guide aspirants to select optionals based on their
            interests.
          </span>
        </p>
        <div className="study-toolbar">
          <input
            type="search"
            placeholder="Search by slide title (e.g. Lecture 3, International Relations, Criminology)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search CSS study material slides"
          />
          <p>
            {normalizedQuery ? `${filteredTotal} matching slides` : `${totalSlides} total slides`}
          </p>
        </div>

        {visibleCompulsoryStudyMaterials.length > 0 ? (
          <>
            <h3 className="study-category-title">Compulsory Subjects</h3>
            <div className="study-groups">{visibleCompulsoryStudyMaterials.map(renderStudyGroup)}</div>
          </>
        ) : null}

        {visibleOptionalSections.length > 0 ? (
          <>
            {visibleOptionalSections.map((section) => (
              <div key={section.group}>
                <h3 className="study-category-title">{section.group}</h3>
                <div className="study-groups">{section.subjects.map(renderStudyGroup)}</div>
              </div>
            ))}
          </>
        ) : null}

        {visibleAdditionalOptionalStudyMaterials.length > 0 ? (
          <div>
            <h3 className="study-category-title">Additional Optional Subjects</h3>
            <div className="study-groups">{visibleAdditionalOptionalStudyMaterials.map(renderStudyGroup)}</div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
