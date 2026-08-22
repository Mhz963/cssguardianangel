import { useEffect, useMemo, useState } from 'react'
import { handlePdfAction } from './pdfNativeBridge.js'
import {
  buildAtsResume,
  cloneResume,
  enhanceResumeCopy,
  isPlaceholder,
  createEmptyCertification,
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProject,
  createEmptyResumeDraft,
  validateResumeDraft,
} from './utils/resumeEngine.js'

const DRAFT_KEY = 'ga-resume-builder-draft'

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return createEmptyResumeDraft()
    const parsed = JSON.parse(raw)
    return {
      ...createEmptyResumeDraft(),
      ...parsed,
      experiences: parsed.experiences?.length ? parsed.experiences : [createEmptyExperience()],
      education: parsed.education?.length ? parsed.education : [createEmptyEducation()],
      projects: parsed.projects?.length ? parsed.projects : [createEmptyProject()],
      certifications: parsed.certifications?.length ? parsed.certifications : [createEmptyCertification()],
    }
  } catch {
    return createEmptyResumeDraft()
  }
}

function Field({ label, children, hint }) {
  return (
    <label>
      {label}
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export default function GuardianResumeBuilderPage() {
  const [draft, setDraft] = useState(loadDraft)
  const [resume, setResume] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [polishStatus, setPolishStatus] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore quota errors
    }
  }, [draft])

  const updateField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updateListItem = (listKey, id, key, value) => {
    setDraft((current) => ({
      ...current,
      [listKey]: current[listKey].map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }))
  }

  const addListItem = (listKey, factory) => {
    setDraft((current) => ({ ...current, [listKey]: [...current[listKey], factory()] }))
  }

  const removeListItem = (listKey, id, factory) => {
    setDraft((current) => {
      const next = current[listKey].filter((item) => item.id !== id)
      return { ...current, [listKey]: next.length ? next : [factory()] }
    })
  }

  const handleBuild = (event) => {
    event.preventDefault()
    const validationError = validateResumeDraft(draft)
    if (validationError) {
      setError(validationError)
      setMessage('')
      return
    }
    setIsBuilding(true)
    setError('')
    try {
      setResume(enhanceResumeCopy(buildAtsResume(draft)))
      setMessage('Guardian AI drafted an ATS resume. Review the preview, then download the PDF or polish further.')
    } catch (buildError) {
      setError(buildError?.message || 'Unable to build the resume.')
    } finally {
      setIsBuilding(false)
    }
  }

  const handleOnDevicePolish = async () => {
    let currentResume = resume
    if (!currentResume) {
      const validationError = validateResumeDraft(draft)
      if (validationError) {
        setError(validationError)
        setMessage('')
        return
      }
      currentResume = enhanceResumeCopy(buildAtsResume(draft))
      setResume(currentResume)
    }
    setIsPolishing(true)
    setError('')
    setPolishStatus('Polishing with Guardian AI. First-time Hugging Face load may take a minute...')
    try {
      const { polishResumeOnDevice } = await import('./utils/resumeOnDevicePolish.js')
      const polished = await polishResumeOnDevice(currentResume, {
        onProgress: ({ status, progress, file }) => {
          if (status === 'ready' || status === 'done') {
            setPolishStatus('Model ready. Rewriting summary and bullets...')
            return
          }
          if (progress) setPolishStatus(`Downloading ${file || 'model'}… ${progress}%`)
        },
      })
      setResume(polished)
      setMessage(
        polished.polishSource === 'on-device'
          ? 'Hugging Face model refined the wording. Edit anything that looks off, then download the PDF.'
          : 'Guardian AI polished the wording on this device. Edit anything that looks off, then download the PDF.',
      )
      setPolishStatus('')
    } catch (polishError) {
      setResume(enhanceResumeCopy(currentResume))
      setMessage('Guardian AI polished the wording on this device. The Hugging Face model could not load this time.')
      setError(polishError?.message || '')
      setPolishStatus('')
    } finally {
      setIsPolishing(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!resume) {
      setError('Build the resume before downloading.')
      return
    }
    setIsExporting(true)
    setError('')
    try {
      const { buildAtsResumePdf } = await import('./utils/resumePdf.js')
      const pdf = await buildAtsResumePdf(resume)
      await handlePdfAction({
        dataUrl: pdf.dataUrl,
        blobUrl: pdf.blobUrl,
        fileName: pdf.fileName,
        action: 'download',
      })
      setMessage('ATS PDF downloaded.')
    } catch (pdfError) {
      setError(pdfError?.message || 'Unable to create the PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleReset = () => {
    const empty = createEmptyResumeDraft()
    setDraft(empty)
    setResume(null)
    setError('')
    setMessage('')
    setPolishStatus('')
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
  }

  const updateResumeText = (path, value) => {
    setResume((current) => {
      if (!current) return current
      const next = cloneResume(current)
      if (path[0] === 'summary') next.summary = value
      if (path[0] === 'skills') next.skills = value.split(/[,•\n]+/).map((item) => item.trim()).filter(Boolean)
      return next
    })
  }

  const previewReady = Boolean(resume)
  const contactBits = useMemo(() => {
    if (!resume) return []
    return [resume.header.city, resume.header.phone, resume.header.email]
      .filter((item) => item && !isPlaceholder(item))
  }, [resume])

  return (
    <main className="page-main grb-page">
      <section className="container">
        <header className="grb-hero">
          <p className="kicker">Guardian Angel Resources</p>
          <h1>Guardian Resume Builder</h1>
          <p>
            Enter your details in plain language. Guardian AI polishes them on this device into a single-column ATS
            resume. No account and no paid API. Optional Hugging Face polish can refine wording after a one-time
            browser download.
          </p>
        </header>

        <div className="grb-layout">
          <form className="planner-card planner-form grb-form" onSubmit={handleBuild}>
            <h3>Your details</h3>
            <div className="grb-grid-2">
              <Field label="Full name">
                <input
                  value={draft.fullName}
                  onChange={(event) => updateField('fullName', event.target.value)}
                  placeholder="Muhammad Hasan"
                  autoComplete="name"
                />
              </Field>
              <Field label="Target role / job">
                <input
                  value={draft.targetRole}
                  onChange={(event) => updateField('targetRole', event.target.value)}
                  placeholder="Research Officer, CSS, Teacher..."
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone">
                <input
                  value={draft.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="03xx-xxxxxxx"
                  autoComplete="tel"
                />
              </Field>
              <Field label="City">
                <input
                  value={draft.city}
                  onChange={(event) => updateField('city', event.target.value)}
                  placeholder="Islamabad"
                />
              </Field>
              <Field label="LinkedIn" hint="Optional. Left empty if you skip it.">
                <input
                  value={draft.linkedin}
                  onChange={(event) => updateField('linkedin', event.target.value)}
                  placeholder="linkedin.com/in/you"
                />
              </Field>
              <Field label="Portfolio / website" hint="Optional">
                <input
                  value={draft.website}
                  onChange={(event) => updateField('website', event.target.value)}
                  placeholder="https://your-portfolio.com"
                />
              </Field>
              <Field label="GitHub" hint="Optional">
                <input
                  value={draft.github}
                  onChange={(event) => updateField('github', event.target.value)}
                  placeholder="github.com/you"
                />
              </Field>
              <Field label="Upwork" hint="Optional">
                <input
                  value={draft.upwork}
                  onChange={(event) => updateField('upwork', event.target.value)}
                  placeholder="upwork.com/freelancers/you"
                />
              </Field>
            </div>

            <Field
              label="Summary notes"
              hint="Leave blank to keep Career Objective empty. Only your words are used."
            >
              <textarea
                rows={4}
                value={draft.summaryNotes}
                onChange={(event) => updateField('summaryNotes', event.target.value)}
                placeholder="CSS aspirant, 3 years teaching, strong in current affairs and writing..."
              />
            </Field>

            <Field label="Skills" hint="Comma or line separated. Use real skills only.">
              <textarea
                rows={3}
                value={draft.skillsText}
                onChange={(event) => updateField('skillsText', event.target.value)}
                placeholder="Research, Report writing, MS Office, Classroom management"
              />
            </Field>

            <div className="grb-block">
              <div className="grb-block-head">
                <h4>Experience</h4>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => addListItem('experiences', createEmptyExperience)}
                >
                  Add role
                </button>
              </div>
              {draft.experiences.map((item, index) => (
                <article key={item.id} className="grb-entry">
                  <div className="grb-entry-top">
                    <strong>Role {index + 1}</strong>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => removeListItem('experiences', item.id, createEmptyExperience)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grb-grid-2">
                    <Field label="Job title">
                      <input
                        value={item.title}
                        onChange={(event) => updateListItem('experiences', item.id, 'title', event.target.value)}
                        placeholder="Subject Teacher"
                      />
                    </Field>
                    <Field label="Organization">
                      <input
                        value={item.organization}
                        onChange={(event) =>
                          updateListItem('experiences', item.id, 'organization', event.target.value)
                        }
                        placeholder="ABC School"
                      />
                    </Field>
                    <Field label="Location">
                      <input
                        value={item.location}
                        onChange={(event) => updateListItem('experiences', item.id, 'location', event.target.value)}
                        placeholder="Lahore"
                      />
                    </Field>
                    <Field label="Start">
                      <input
                        value={item.startDate}
                        onChange={(event) => updateListItem('experiences', item.id, 'startDate', event.target.value)}
                        placeholder="2021"
                      />
                    </Field>
                    <Field label="End">
                      <input
                        value={item.current ? 'Present' : item.endDate}
                        disabled={item.current}
                        onChange={(event) => updateListItem('experiences', item.id, 'endDate', event.target.value)}
                        placeholder="2024"
                      />
                    </Field>
                    <label className="grb-check">
                      <input
                        type="checkbox"
                        checked={item.current}
                        onChange={(event) => updateListItem('experiences', item.id, 'current', event.target.checked)}
                      />
                      Current role
                    </label>
                  </div>
                  <Field label="What you did" hint="One point per line. Raw notes are polished automatically.">
                    <textarea
                      rows={4}
                      value={item.notes}
                      onChange={(event) => updateListItem('experiences', item.id, 'notes', event.target.value)}
                      placeholder={'taught class of 40\nchecked copies weekly\nhelped students with essay writing'}
                    />
                  </Field>
                </article>
              ))}
            </div>

            <div className="grb-block">
              <div className="grb-block-head">
                <h4>Education</h4>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => addListItem('education', createEmptyEducation)}
                >
                  Add education
                </button>
              </div>
              {draft.education.map((item, index) => (
                <article key={item.id} className="grb-entry">
                  <div className="grb-entry-top">
                    <strong>Education {index + 1}</strong>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => removeListItem('education', item.id, createEmptyEducation)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grb-grid-2">
                    <Field label="School / university">
                      <input
                        value={item.school}
                        onChange={(event) => updateListItem('education', item.id, 'school', event.target.value)}
                        placeholder="University of Punjab"
                      />
                    </Field>
                    <Field label="Degree">
                      <input
                        value={item.degree}
                        onChange={(event) => updateListItem('education', item.id, 'degree', event.target.value)}
                        placeholder="BS"
                      />
                    </Field>
                    <Field label="Field">
                      <input
                        value={item.field}
                        onChange={(event) => updateListItem('education', item.id, 'field', event.target.value)}
                        placeholder="Political Science"
                      />
                    </Field>
                    <Field label="Years">
                      <input
                        value={item.startDate}
                        onChange={(event) => updateListItem('education', item.id, 'startDate', event.target.value)}
                        placeholder="2018"
                      />
                    </Field>
                    <Field label="End">
                      <input
                        value={item.endDate}
                        onChange={(event) => updateListItem('education', item.id, 'endDate', event.target.value)}
                        placeholder="2022"
                      />
                    </Field>
                  </div>
                  <Field label="Details" hint="Optional honors, thesis, or relevant coursework.">
                    <textarea
                      rows={2}
                      value={item.details}
                      onChange={(event) => updateListItem('education', item.id, 'details', event.target.value)}
                    />
                  </Field>
                </article>
              ))}
            </div>

            <div className="grb-block">
              <div className="grb-block-head">
                <h4>Projects</h4>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => addListItem('projects', createEmptyProject)}
                >
                  Add project
                </button>
              </div>
              {draft.projects.map((item) => (
                <article key={item.id} className="grb-entry">
                  <div className="grb-entry-top">
                    <Field label="Project name">
                      <input
                        value={item.name}
                        onChange={(event) => updateListItem('projects', item.id, 'name', event.target.value)}
                        placeholder="Current Affairs Digest"
                      />
                    </Field>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => removeListItem('projects', item.id, createEmptyProject)}
                    >
                      Remove
                    </button>
                  </div>
                  <Field label="What you built or researched">
                    <textarea
                      rows={3}
                      value={item.notes}
                      onChange={(event) => updateListItem('projects', item.id, 'notes', event.target.value)}
                    />
                  </Field>
                </article>
              ))}
            </div>

            <div className="grb-block">
              <div className="grb-block-head">
                <h4>Certifications</h4>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => addListItem('certifications', createEmptyCertification)}
                >
                  Add certificate
                </button>
              </div>
              {draft.certifications.map((item) => (
                <article key={item.id} className="grb-entry">
                  <div className="grb-grid-2">
                    <Field label="Name">
                      <input
                        value={item.name}
                        onChange={(event) => updateListItem('certifications', item.id, 'name', event.target.value)}
                      />
                    </Field>
                    <Field label="Issuer">
                      <input
                        value={item.issuer}
                        onChange={(event) => updateListItem('certifications', item.id, 'issuer', event.target.value)}
                      />
                    </Field>
                    <Field label="Year">
                      <input
                        value={item.year}
                        onChange={(event) => updateListItem('certifications', item.id, 'year', event.target.value)}
                      />
                    </Field>
                  </div>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => removeListItem('certifications', item.id, createEmptyCertification)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>

            {error ? <p className="planner-error">{error}</p> : null}
            {message ? <p className="planner-message">{message}</p> : null}
            {polishStatus ? <p className="planner-meta">{polishStatus}</p> : null}

            <div className="grb-actions">
              <button className="btn btn-primary" type="submit" disabled={isBuilding}>
                {isBuilding ? 'Building…' : 'Build ATS resume'}
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleOnDevicePolish}
                disabled={isPolishing}
              >
                {isPolishing ? 'Polishing…' : 'Polish with Guardian AI'}
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleDownloadPdf}
                disabled={!previewReady || isExporting}
              >
                {isExporting ? 'Preparing PDF…' : 'Download ATS PDF'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={handleReset}>
                Reset
              </button>
            </div>
          </form>

          <aside className="planner-card grb-preview" aria-live="polite">
            <h3>ATS preview</h3>
            {!previewReady ? (
              <p className="planner-meta">
                Fill the form and click Build ATS resume. The preview stays editable so you can correct any line
                before download.
              </p>
            ) : (
              <div className="grb-paper">
                <h2>{resume.header.name}</h2>
                {contactBits.length ? <p className="grb-contact">{contactBits.join(' | ')}</p> : null}

                {resume.links?.length ? (
                  <section>
                    <h4>Professional Links</h4>
                    <ul className="grb-plain-list">
                      {resume.links.map((item) => (
                        <li key={item.label}>
                          <strong>{item.label}:</strong> {item.url}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {resume.summary ? (
                  <section>
                    <h4>Career Objective</h4>
                    <textarea
                      rows={5}
                      value={resume.summary}
                      onChange={(event) => updateResumeText(['summary'], event.target.value)}
                    />
                  </section>
                ) : null}

                {resume.skills.length ? (
                  <section>
                    <h4>Technical Skills</h4>
                    <ul>
                      {resume.skills.map((skill) => (
                        <li key={skill}>{skill}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {resume.experience.length ? (
                  <section>
                    <h4>Professional Experience</h4>
                    {resume.experience.map((job, jobIndex) => (
                      <div key={job.id || jobIndex} className="grb-job-block">
                        <p className="grb-job-line">
                          {[job.title, job.organization, job.dates].filter(Boolean).join(' | ')}
                        </p>
                        {job.location ? <p className="grb-muted">{job.location}</p> : null}
                        <ul>
                          {(job.bullets || []).map((bullet, bulletIndex) => (
                            <li key={`${job.id}-${bulletIndex}`}>
                              <input
                                value={bullet}
                                onChange={(event) => {
                                  setResume((current) => {
                                    const next = cloneResume(current)
                                    next.experience[jobIndex].bullets[bulletIndex] = event.target.value
                                    return next
                                  })
                                }}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                ) : null}

                {resume.projects.length ? (
                  <section>
                    <h4>Professional Projects</h4>
                    {resume.projects.map((item, index) => (
                      <div key={item.id || index}>
                        <p className="grb-job-line">
                          {index + 1}. {item.name}
                        </p>
                        <ul>
                          {(item.bullets || []).map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                ) : null}

                {resume.education.length ? (
                  <section>
                    <h4>Educational Background</h4>
                    {resume.education.map((item, index) => (
                      <div key={item.id || index}>
                        <p className="grb-job-line">
                          {[item.degree, item.field, item.dates].filter(Boolean).join(' | ')}
                        </p>
                        {item.school ? <p className="grb-muted">{item.school}</p> : null}
                        {item.details ? <p>{item.details}</p> : null}
                      </div>
                    ))}
                  </section>
                ) : null}

                {resume.certifications.length ? (
                  <section>
                    <h4>Certifications</h4>
                    <ul>
                      {resume.certifications.map((item) => (
                        <li key={item.id}>
                          {[item.name, item.issuer, item.year].filter(Boolean).join(' | ')}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <p className="planner-meta">
                  Source:{' '}
                  {resume.polishSource === 'on-device'
                    ? 'Hugging Face on-device model'
                    : 'Guardian AI writer'}
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}
