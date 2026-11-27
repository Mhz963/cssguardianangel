import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import './styles/portfolio.css'
import GuardianPortfolioShowcase from './GuardianPortfolioShowcase.jsx'
import { GIG_IDEAS } from './portfolio/portfolioContent.js'
import {
  ALLOWED_PHOTO_EXTENSIONS,
  ALLOWED_PORTFOLIO_EXTENSIONS,
  GIG_CATEGORIES,
  GIG_CURRENCIES,
  MAX_GIGS,
  MAX_PORTFOLIO_ITEMS,
  addPortfolioItem,
  createEmptyGigDraft,
  createEmptyPortfolio,
  deletePortfolioItem,
  fetchMyPortfolio,
  fetchMyPortfolioItems,
  formatFileSize,
  formatGigPrice,
  getInitials,
  parseSkills,
  removeGigCover,
  removePortfolioPhoto,
  saveMyPortfolio,
  uploadGigCover,
  uploadPortfolioPhoto,
} from './utils/portfolioClient.js'

const STEPS = [
  { id: 'profile', label: 'Profile' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'work', label: 'Work samples' },
  { id: 'publish', label: 'Contact & publish' },
]

function Field({ label, optional = false, hint, children }) {
  return (
    <label className="pf-field">
      <span>
        {label} {optional ? <em>(optional)</em> : null}
      </span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function buildChecklist(draft, items) {
  const gigs = draft.gigs || []
  return [
    { label: 'Name and headline', done: Boolean(draft.display_name?.trim() && draft.headline?.trim()) },
    { label: 'About you and your skills', done: Boolean(draft.bio?.trim() && parseSkills(draft.skillsText).length) },
    { label: 'Profile photo', done: Boolean(draft.photoUrl) },
    { label: 'At least one gig with a price', done: gigs.some((g) => g.price) },
    { label: 'At least one work sample', done: items.length > 0 },
    { label: 'WhatsApp number so clients can reach you', done: Boolean(draft.links?.whatsapp?.trim()) },
    { label: 'Published', done: Boolean(draft.is_public) },
  ]
}

export default function GuardianPortfolioPage({ authUser }) {
  const [draft, setDraft] = useState(() => createEmptyPortfolio(authUser))
  const [savedPublic, setSavedPublic] = useState(false)
  const [items, setItems] = useState([])
  const [step, setStep] = useState(0)
  const [itemDraft, setItemDraft] = useState({ title: '', description: '', url: '', file: null })
  const [gigDraft, setGigDraft] = useState(createEmptyGigDraft)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [photoInputKey, setPhotoInputKey] = useState(0)
  const [gigFileKey, setGigFileKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPhotoBusy, setIsPhotoBusy] = useState(false)
  const [isGigBusy, setIsGigBusy] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState('')
  const [pendingGigId, setPendingGigId] = useState('')
  const [editingGigId, setEditingGigId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [portfolio, nextItems] = await Promise.all([fetchMyPortfolio(authUser), fetchMyPortfolioItems(authUser.id)])
        if (cancelled) return
        setDraft(portfolio)
        setSavedPublic(Boolean(portfolio.is_public))
        setItems(nextItems)
      } catch (loadError) {
        if (!cancelled) setError(loadError?.message || 'Unable to load your portfolio.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [authUser])

  const publicPath = draft.slug ? `/p/${draft.slug}` : ''
  const publicUrl = useMemo(() => {
    if (!publicPath || typeof window === 'undefined') return ''
    return `${window.location.origin}${publicPath}`
  }, [publicPath])

  const checklist = buildChecklist(draft, items)
  const doneCount = checklist.filter((c) => c.done).length
  const gigs = Array.isArray(draft.gigs) ? draft.gigs : []
  const hasName = Boolean(String(draft.display_name || '').trim())
  const stepDone = [
    Boolean(hasName && draft.headline?.trim()),
    gigs.length > 0,
    items.length > 0,
    Boolean(savedPublic),
  ]

  const clearNotices = () => {
    setError('')
    setMessage('')
  }

  const goTo = (index) => {
    clearNotices()
    setStep(index)
    window.document.getElementById('pf-editor-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const updateField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updateLink = (key, value) => {
    setDraft((current) => ({ ...current, links: { ...current.links, [key]: value } }))
  }

  const saveDraft = async (nextDraft, successMessage) => {
    clearNotices()
    setIsSaving(true)
    try {
      const saved = await saveMyPortfolio(authUser, nextDraft)
      setDraft(saved)
      setSavedPublic(Boolean(saved.is_public))
      if (successMessage) setMessage(successMessage)
      return true
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save your portfolio.')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    if (!hasName) {
      setError('Add your name so clients know who they are hiring.')
      return
    }
    if (!draft.headline?.trim()) {
      setError('Add a one-line headline, for example "English tutor and essay reviewer".')
      return
    }
    const ok = await saveDraft(draft, 'Profile saved.')
    if (ok) goTo(1)
  }

  const handlePublishSubmit = async (event) => {
    event.preventDefault()
    await saveDraft(
      draft,
      draft.is_public
        ? 'Saved and published. Share your link below.'
        : 'Saved. Your profile is private until you tick "Publish my profile".',
    )
  }

  const handleCopyLink = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setMessage('Link copied. Paste it in your WhatsApp status, groups and social media bios.')
      setError('')
    } catch {
      setError('Could not copy the link. Open your page and copy it from the address bar.')
    }
  }

  const persistDraft = async (nextDraft) => {
    if (!String(nextDraft.display_name || '').trim()) return nextDraft
    return saveMyPortfolio(authUser, nextDraft)
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    clearNotices()
    setIsPhotoBusy(true)
    try {
      const uploaded = await uploadPortfolioPhoto(authUser.id, file, draft.photo_path)
      const saved = await persistDraft({ ...draft, ...uploaded })
      setDraft(saved)
      setPhotoInputKey((current) => current + 1)
      setMessage('Profile photo updated.')
    } catch (photoError) {
      setError(photoError?.message || 'Unable to upload that photo.')
    } finally {
      setIsPhotoBusy(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!draft.photo_path && !draft.photoUrl) return
    clearNotices()
    setIsPhotoBusy(true)
    try {
      await removePortfolioPhoto(draft.photo_path)
      const saved = await persistDraft({ ...draft, photo_path: '', photoUrl: '', links: { ...draft.links, photo_path: '' } })
      setDraft(saved)
      setPhotoInputKey((current) => current + 1)
      setMessage('Profile photo removed.')
    } catch (photoError) {
      setError(photoError?.message || 'Unable to remove that photo.')
    } finally {
      setIsPhotoBusy(false)
    }
  }

  const handleAddItem = async (event) => {
    event.preventDefault()
    clearNotices()
    setIsUploading(true)
    try {
      const nextItem = await addPortfolioItem({
        userId: authUser.id,
        title: itemDraft.title,
        description: itemDraft.description,
        file: itemDraft.file,
        externalUrl: itemDraft.url,
        currentCount: items.length,
      })
      setItems((current) => [...current, nextItem])
      setItemDraft({ title: '', description: '', url: '', file: null })
      setFileInputKey((current) => current + 1)
      setMessage('Work sample added.')
    } catch (uploadError) {
      setError(uploadError?.message || 'Unable to add that work sample.')
    } finally {
      setIsUploading(false)
    }
  }

  const resetGigForm = () => {
    setEditingGigId('')
    setGigDraft(createEmptyGigDraft())
    setGigFileKey((current) => current + 1)
  }

  const applyGigIdea = (idea) => {
    clearNotices()
    setEditingGigId('')
    setGigDraft({ ...createEmptyGigDraft(), ...idea, currency: 'PKR', file: null })
    setGigFileKey((current) => current + 1)
    setMessage('Idea added to the form. Change the wording and price to match what you really offer, then save.')
  }

  const handleEditGig = (gig) => {
    clearNotices()
    setPendingGigId('')
    setEditingGigId(gig.id)
    setGigDraft({
      title: gig.title || '',
      description: gig.description || '',
      category: gig.category || 'Writing',
      currency: gig.currency || 'PKR',
      price: gig.price || '',
      delivery: gig.delivery || '',
      file: null,
      coverUrl: gig.coverUrl || '',
    })
    setGigFileKey((current) => current + 1)
    window.document.getElementById('pf-gig-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSaveGig = async (event) => {
    event.preventDefault()
    clearNotices()
    const isEditing = Boolean(editingGigId)
    if (!hasName) {
      setError('Save your profile (step 1) before adding gigs.')
      return
    }
    if (!isEditing && gigs.length >= MAX_GIGS) {
      setError(`You can publish up to ${MAX_GIGS} gigs. Remove one to add another.`)
      return
    }
    if (!String(gigDraft.title || '').trim()) {
      setError('Give this gig a title, for example "I will review your CSS essay".')
      return
    }
    if (!String(gigDraft.price || '').trim()) {
      setError('Add a starting price so clients know what to expect.')
      return
    }

    setIsGigBusy(true)
    try {
      const currentGig = isEditing ? gigs.find((gig) => gig.id === editingGigId) : null
      const gigId = currentGig?.id || crypto.randomUUID()
      let cover = { cover_path: currentGig?.cover_path || '', coverUrl: currentGig?.coverUrl || '' }
      if (gigDraft.file) {
        cover = await uploadGigCover(authUser.id, gigId, gigDraft.file, currentGig?.cover_path || '')
      }
      const nextGig = {
        id: gigId,
        title: gigDraft.title.trim(),
        description: String(gigDraft.description || '').trim(),
        category: gigDraft.category,
        currency: gigDraft.currency,
        price: String(gigDraft.price).trim(),
        delivery: String(gigDraft.delivery || '').trim(),
        cover_path: cover.cover_path,
        coverUrl: cover.coverUrl,
      }
      const nextGigs = isEditing ? gigs.map((gig) => (gig.id === gigId ? nextGig : gig)) : [...gigs, nextGig]
      const saved = await persistDraft({ ...draft, gigs: nextGigs })
      setDraft(saved)
      resetGigForm()
      setMessage(isEditing ? 'Gig updated.' : 'Gig saved. Add another or continue to work samples.')
    } catch (gigError) {
      setError(gigError?.message || 'Unable to save that gig.')
    } finally {
      setIsGigBusy(false)
    }
  }

  const handleDeleteGig = async (gig) => {
    if (pendingGigId !== gig.id) {
      setPendingGigId(gig.id)
      window.setTimeout(() => {
        setPendingGigId((current) => (current === gig.id ? '' : current))
      }, 4000)
      return
    }
    clearNotices()
    setIsGigBusy(true)
    try {
      await removeGigCover(gig.cover_path)
      const saved = await persistDraft({ ...draft, gigs: gigs.filter((entry) => entry.id !== gig.id) })
      setDraft(saved)
      setPendingGigId('')
      if (editingGigId === gig.id) resetGigForm()
      setMessage('Gig removed.')
    } catch (gigError) {
      setError(gigError?.message || 'Unable to remove that gig.')
    } finally {
      setIsGigBusy(false)
    }
  }

  const handleDeleteItem = async (item) => {
    if (pendingDeleteId !== item.id) {
      setPendingDeleteId(item.id)
      window.setTimeout(() => {
        setPendingDeleteId((current) => (current === item.id ? '' : current))
      }, 4000)
      return
    }
    clearNotices()
    try {
      await deletePortfolioItem(authUser.id, item)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      setPendingDeleteId('')
      setMessage('Work sample removed.')
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to remove that item.')
    }
  }

  const shareText = encodeURIComponent(
    `Assalam o Alaikum! I now offer freelance services${draft.headline ? ` (${draft.headline})` : ''}. See my gigs and work here: ${publicUrl}`,
  )

  const notices = (
    <>
      {error ? (
        <p className="pf-message is-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="pf-message" role="status">
          {message}
        </p>
      ) : null}
    </>
  )

  const stepNav = (backLabel, nextLabel) => (
    <div className="pf-step-nav">
      {step > 0 ? (
        <button type="button" className="btn btn-secondary" onClick={() => goTo(step - 1)}>
          ← {backLabel}
        </button>
      ) : (
        <span />
      )}
      {nextLabel ? (
        <button type="button" className="btn btn-primary" onClick={() => goTo(step + 1)} disabled={!hasName || !savedOnce(draft)}>
          {nextLabel} →
        </button>
      ) : null}
    </div>
  )

  return (
    <main className="page-main pf-page" id="main-content">
      <section className="container">
        <div className="section-title" id="pf-editor-top">
          <p>Guardian Portfolio</p>
          <h2>Your portfolio editor</h2>
        </div>
        <div className="pf-editor-head">
          <p className="pf-lead">
            Four short steps: tell clients who you are, list your services as gigs, show proof of your work, then publish
            and share your link. Your changes appear in the preview as you type.{' '}
            <Link className="pf-text-link" to="/guardian-portfolio#tutorial">
              Watch the guide
            </Link>
          </p>
          <span className={`pf-status-pill ${savedPublic ? 'is-live' : ''}`}>{savedPublic ? 'Published' : 'Private draft'}</span>
        </div>

        <ol className="pf-stepper" aria-label="Portfolio steps">
          {STEPS.map((s, index) => (
            <li key={s.id}>
              <button
                type="button"
                className={`${step === index ? 'is-active' : ''} ${stepDone[index] ? 'is-done' : ''}`}
                aria-current={step === index ? 'step' : undefined}
                onClick={() => goTo(index)}
                disabled={index > 0 && !savedOnce(draft)}
              >
                <span className="pf-stepper-num">{stepDone[index] && step !== index ? '✓' : index + 1}</span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>

        {isLoading ? <p className="pf-muted">Loading your portfolio…</p> : null}

        <div className="pf-editor">
          <div className="pf-card pf-panel">
            {step === 0 ? (
              <form className="pf-form" onSubmit={handleProfileSubmit}>
                <header>
                  <h3>1. Your profile</h3>
                  <p className="pf-muted">This is the first thing clients see. Keep it short, honest and specific.</p>
                </header>
                <div className="pf-photo-row">
                  <span className="pf-avatar">
                    {draft.photoUrl ? <img src={draft.photoUrl} alt="" /> : getInitials(draft.display_name)}
                  </span>
                  <div>
                    <div className="pf-actions">
                      <label className="btn btn-secondary pf-file-btn">
                        {isPhotoBusy ? 'Uploading…' : draft.photoUrl ? 'Change photo' : 'Upload photo'}
                        <input
                          key={photoInputKey}
                          type="file"
                          accept={ALLOWED_PHOTO_EXTENSIONS.join(',')}
                          onChange={handlePhotoChange}
                          disabled={isPhotoBusy || !hasName}
                        />
                      </label>
                      {draft.photoUrl ? (
                        <button className="pf-small-btn" type="button" onClick={handleRemovePhoto} disabled={isPhotoBusy}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <p className="pf-muted">
                      {hasName ? 'A clear, friendly photo builds trust. PNG, JPG or WEBP up to 4 MB.' : 'Add your name first, then a photo.'}
                    </p>
                  </div>
                </div>
                <div className="pf-form-row">
                  <Field label="Your name">
                    <input value={draft.display_name} onChange={(e) => updateField('display_name', e.target.value)} autoComplete="name" />
                  </Field>
                  <Field label="City" optional>
                    <input
                      value={draft.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      autoComplete="address-level2"
                      placeholder="Lahore"
                    />
                  </Field>
                </div>
                <Field label="Headline" hint="One line under your name. Say what you do, not what you are studying.">
                  <input
                    value={draft.headline}
                    onChange={(e) => updateField('headline', e.target.value)}
                    placeholder="English tutor and CSS essay reviewer"
                    maxLength={90}
                  />
                </Field>
                <Field label="What you offer" optional hint="One sentence about the result a client gets.">
                  <input
                    value={draft.offer}
                    onChange={(e) => updateField('offer', e.target.value)}
                    placeholder="I help students write clearer essays and score higher in English."
                  />
                </Field>
                <Field label="About you" optional hint="Two or three sentences: your background, experience and why clients can trust you.">
                  <textarea value={draft.bio} onChange={(e) => updateField('bio', e.target.value)} rows={4} />
                </Field>
                <Field label="Skills" optional hint="Separate with commas. These show as tags on your profile.">
                  <input
                    value={draft.skillsText}
                    onChange={(e) => updateField('skillsText', e.target.value)}
                    placeholder="Essay feedback, Précis writing, Urdu–English translation, MS Word"
                  />
                </Field>
                {notices}
                <div className="pf-step-nav">
                  <span />
                  <button className="btn btn-primary" type="submit" disabled={isSaving || isLoading}>
                    {isSaving ? 'Saving…' : 'Save and continue →'}
                  </button>
                </div>
              </form>
            ) : null}

            {step === 1 ? (
              <div className="pf-form">
                <header>
                  <h3>2. Your gigs</h3>
                  <p className="pf-muted">
                    A gig is one service with a clear price, like on Fiverr. Start with one or two you can deliver well. You
                    can have up to {MAX_GIGS} ({gigs.length} used).
                  </p>
                </header>
                <div>
                  <p className="pf-field">
                    <span>Need an idea? Tap one to fill the form</span>
                  </p>
                  <div className="pf-ideas-strip">
                    {GIG_IDEAS.map((idea) => (
                      <button type="button" key={idea.title} className="pf-idea-btn" onClick={() => applyGigIdea(idea)}>
                        <span className="pf-chip">{idea.category}</span>
                        <br />
                        {idea.title}
                      </button>
                    ))}
                  </div>
                </div>
                <form className="pf-form" id="pf-gig-form" onSubmit={handleSaveGig}>
                  <Field label="Gig title" hint='Start with "I will…" and say exactly what the client gets.'>
                    <input
                      value={gigDraft.title}
                      onChange={(e) => setGigDraft((c) => ({ ...c, title: e.target.value }))}
                      placeholder="I will review your CSS essay and give detailed feedback"
                      maxLength={100}
                    />
                  </Field>
                  <Field label="What is included" optional hint="What you deliver, in what format, and how many revisions.">
                    <textarea
                      value={gigDraft.description}
                      onChange={(e) => setGigDraft((c) => ({ ...c, description: e.target.value }))}
                      rows={3}
                    />
                  </Field>
                  <div className="pf-form-row is-three">
                    <Field label="Category">
                      <select value={gigDraft.category} onChange={(e) => setGigDraft((c) => ({ ...c, category: e.target.value }))}>
                        {GIG_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Starting price">
                      <div className="pf-actions" style={{ flexWrap: 'nowrap', gap: '0.4rem' }}>
                        <select
                          aria-label="Currency"
                          value={gigDraft.currency}
                          onChange={(e) => setGigDraft((c) => ({ ...c, currency: e.target.value }))}
                          style={{ width: '5.5rem' }}
                        >
                          {GIG_CURRENCIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <input
                          inputMode="numeric"
                          value={gigDraft.price}
                          onChange={(e) => setGigDraft((c) => ({ ...c, price: e.target.value }))}
                          placeholder="1500"
                        />
                      </div>
                    </Field>
                    <Field label="Delivery time" optional>
                      <input
                        value={gigDraft.delivery}
                        onChange={(e) => setGigDraft((c) => ({ ...c, delivery: e.target.value }))}
                        placeholder="2 days"
                      />
                    </Field>
                  </div>
                  <Field label="Cover image" optional hint="Without one, a neat cover is made from your title. PNG, JPG or WEBP.">
                    <input
                      key={gigFileKey}
                      type="file"
                      accept={ALLOWED_PHOTO_EXTENSIONS.join(',')}
                      onChange={(e) => setGigDraft((c) => ({ ...c, file: e.target.files?.[0] || null }))}
                    />
                  </Field>
                  {notices}
                  <div className="pf-actions">
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={isGigBusy || (!editingGigId && gigs.length >= MAX_GIGS)}
                    >
                      {isGigBusy ? 'Saving…' : editingGigId ? 'Update gig' : 'Save gig'}
                    </button>
                    {editingGigId || gigDraft.title ? (
                      <button className="pf-small-btn" type="button" onClick={resetGigForm}>
                        {editingGigId ? 'Cancel editing' : 'Clear form'}
                      </button>
                    ) : null}
                  </div>
                </form>
                {gigs.length ? (
                  <ul className="pf-list" aria-label="Your gigs">
                    {gigs.map((gig) => (
                      <li className="pf-list-item" key={gig.id}>
                        <div>
                          <strong>{gig.title}</strong>
                          <span>
                            {gig.category} · {formatGigPrice(gig)}
                            {gig.delivery ? ` · ${gig.delivery}` : ''}
                          </span>
                        </div>
                        <div className="pf-list-actions">
                          <button className="pf-small-btn" type="button" onClick={() => handleEditGig(gig)} disabled={isGigBusy}>
                            Edit
                          </button>
                          <button
                            className="pf-small-btn is-danger"
                            type="button"
                            onClick={() => handleDeleteGig(gig)}
                            disabled={isGigBusy}
                          >
                            {pendingGigId === gig.id ? 'Confirm remove' : 'Remove'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {stepNav('Profile', 'Next: work samples')}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="pf-form">
                <header>
                  <h3>3. Work samples</h3>
                  <p className="pf-muted">
                    Proof wins clients. Add an essay you wrote, a translation, a lesson plan, a design or a certificate.
                    Remove anything private (names, phone numbers) first. Up to {MAX_PORTFOLIO_ITEMS} items ({items.length}{' '}
                    used).
                  </p>
                </header>
                <form className="pf-form" onSubmit={handleAddItem}>
                  <Field label="Title">
                    <input
                      value={itemDraft.title}
                      onChange={(e) => setItemDraft((c) => ({ ...c, title: e.target.value }))}
                      placeholder="Sample essay feedback"
                    />
                  </Field>
                  <Field label="Short description" optional>
                    <textarea
                      value={itemDraft.description}
                      onChange={(e) => setItemDraft((c) => ({ ...c, description: e.target.value }))}
                      rows={2}
                    />
                  </Field>
                  <div className="pf-form-row">
                    <Field
                      label="Upload a file"
                      hint={itemDraft.file ? `${itemDraft.file.name} · ${formatFileSize(itemDraft.file.size)}` : 'PDF, Word or image, up to 8 MB'}
                    >
                      <input
                        key={fileInputKey}
                        type="file"
                        accept={ALLOWED_PORTFOLIO_EXTENSIONS.join(',')}
                        onChange={(e) => setItemDraft((c) => ({ ...c, file: e.target.files?.[0] || null }))}
                      />
                    </Field>
                    <Field label="Or paste a link" hint="Google Drive, Behance, a published article…">
                      <input
                        value={itemDraft.url}
                        onChange={(e) => setItemDraft((c) => ({ ...c, url: e.target.value }))}
                        placeholder="https://"
                      />
                    </Field>
                  </div>
                  {notices}
                  <div className="pf-actions">
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={isUploading || items.length >= MAX_PORTFOLIO_ITEMS}
                    >
                      {isUploading ? 'Uploading…' : 'Add sample'}
                    </button>
                  </div>
                </form>
                {items.length ? (
                  <ul className="pf-list" aria-label="Your work samples">
                    {items.map((item) => (
                      <li className="pf-list-item" key={item.id}>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.fileName || item.externalUrl}</span>
                        </div>
                        <button className="pf-small-btn is-danger" type="button" onClick={() => handleDeleteItem(item)}>
                          {pendingDeleteId === item.id ? 'Confirm remove' : 'Remove'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {stepNav('Gigs', 'Next: contact & publish')}
              </div>
            ) : null}

            {step === 3 ? (
              <form className="pf-form" onSubmit={handlePublishSubmit}>
                <header>
                  <h3>4. Contact & publish</h3>
                  <p className="pf-muted">
                    Clients contact you directly. Your WhatsApp number powers the "Get in touch" button on every gig.
                  </p>
                </header>
                <Field label="WhatsApp number" hint="Recommended. Example: 03001234567. It appears on your public page.">
                  <input
                    value={draft.links.whatsapp}
                    onChange={(e) => updateLink('whatsapp', e.target.value)}
                    placeholder="03001234567"
                    inputMode="tel"
                  />
                </Field>
                <div className="pf-form-row">
                  <Field label="LinkedIn" optional>
                    <input value={draft.links.linkedin} onChange={(e) => updateLink('linkedin', e.target.value)} placeholder="https://" />
                  </Field>
                  <Field label="Fiverr" optional>
                    <input value={draft.links.fiverr} onChange={(e) => updateLink('fiverr', e.target.value)} placeholder="https://" />
                  </Field>
                  <Field label="Upwork" optional>
                    <input value={draft.links.upwork} onChange={(e) => updateLink('upwork', e.target.value)} placeholder="https://" />
                  </Field>
                  <Field label="Website" optional>
                    <input value={draft.links.website} onChange={(e) => updateLink('website', e.target.value)} placeholder="https://" />
                  </Field>
                </div>
                <div className="pf-form-row">
                  <Field label="General rate" optional hint="Shown on your profile, e.g. From Rs 1,500 per task.">
                    <input value={draft.rate_text} onChange={(e) => updateField('rate_text', e.target.value)} />
                  </Field>
                  <Field label="Your link name" hint={`Letters, numbers and hyphens. Your page: ${publicUrl || '…'}`}>
                    <input value={draft.slug} onChange={(e) => updateField('slug', e.target.value)} />
                  </Field>
                </div>
                <label className="pf-check">
                  <input type="checkbox" checked={draft.is_public} onChange={(e) => updateField('is_public', e.target.checked)} />
                  <span>
                    <strong>Publish my profile.</strong> Anyone with the link can see it, and it is listed on Browse CSS Jawans.
                    Untick any time to make it private again.
                  </span>
                </label>
                {notices}
                <div className="pf-step-nav">
                  <button type="button" className="btn btn-secondary" onClick={() => goTo(2)}>
                    ← Work samples
                  </button>
                  <button className="btn btn-primary" type="submit" disabled={isSaving || isLoading}>
                    {isSaving ? 'Saving…' : draft.is_public ? 'Save and publish' : 'Save'}
                  </button>
                </div>
                {savedPublic && publicPath ? (
                  <div className="pf-panel">
                    <p className="pf-field">
                      <span>Your public link</span>
                    </p>
                    <div className="pf-link-box">{publicUrl}</div>
                    <div className="pf-actions">
                      <button className="btn btn-secondary" type="button" onClick={handleCopyLink}>
                        Copy link
                      </button>
                      <a className="btn btn-secondary" href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer">
                        Share on WhatsApp
                      </a>
                      <Link className="pf-text-link" to={publicPath} target="_blank" rel="noreferrer">
                        Open my page ↗
                      </Link>
                    </div>
                    <p className="pf-muted">
                      Tip: put the link in your WhatsApp status and bio, Facebook and LinkedIn, and share it in your college
                      and community groups.
                    </p>
                  </div>
                ) : null}
              </form>
            ) : null}
          </div>

          <aside className="pf-card pf-preview" aria-label="Live preview">
            <div className="pf-preview-head">
              <span>Live preview</span>
              <span className="pf-muted">
                {doneCount}/{checklist.length} done
              </span>
            </div>
            <div style={{ padding: '0.9rem 1rem' }}>
              <div className="pf-progress" aria-hidden="true">
                <span style={{ width: `${Math.round((doneCount / checklist.length) * 100)}%` }} />
              </div>
              <ul className="pf-checklist" style={{ marginTop: '0.8rem' }}>
                {checklist.map((c) => (
                  <li key={c.label} className={c.done ? 'is-done' : ''}>
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
            <GuardianPortfolioShowcase portfolio={draft} items={items} compact />
          </aside>
        </div>
      </section>
    </main>
  )
}

/** Steps after the first need a saved profile (name is required to save). */
function savedOnce(draft) {
  return Boolean(String(draft.display_name || '').trim())
}
