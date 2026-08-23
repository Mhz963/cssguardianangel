import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GuardianPortfolioShowcase from './GuardianPortfolioShowcase.jsx'
import {
  ALLOWED_PHOTO_EXTENSIONS,
  ALLOWED_PORTFOLIO_EXTENSIONS,
  GIG_CATEGORIES,
  GIG_CURRENCIES,
  formatGigPrice,
  MAX_GIGS,
  MAX_PORTFOLIO_ITEMS,
  addPortfolioItem,
  createEmptyGigDraft,
  createEmptyPortfolio,
  deletePortfolioItem,
  fetchMyPortfolio,
  fetchMyPortfolioItems,
  formatFileSize,
  getInitials,
  removeGigCover,
  removePortfolioPhoto,
  saveMyPortfolio,
  uploadGigCover,
  uploadPortfolioPhoto,
} from './utils/portfolioClient.js'

function Field({ label, hint, children }) {
  return (
    <label className="gp-field">
      <span className="gp-field-label">{label}</span>
      {children}
      <small className="gp-field-hint">{hint || '\u00a0'}</small>
    </label>
  )
}

export default function GuardianPortfolioPage({ authUser }) {
  const [draft, setDraft] = useState(() => createEmptyPortfolio(authUser))
  const [items, setItems] = useState([])
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
        const [portfolio, nextItems] = await Promise.all([
          fetchMyPortfolio(authUser),
          fetchMyPortfolioItems(authUser.id),
        ])
        if (cancelled) return
        setDraft(portfolio)
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

  const updateField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const updateLink = (key, value) => {
    setDraft((current) => ({
      ...current,
      links: { ...current.links, [key]: value },
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSaving(true)
    try {
      const saved = await saveMyPortfolio(authUser, draft)
      setDraft(saved)
      setMessage(saved.is_public ? 'Portfolio saved. Your public link is ready.' : 'Portfolio saved. It stays private until you publish it.')
    } catch (saveError) {
      setError(saveError?.message || 'Unable to save your portfolio.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyLink = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setMessage('Public link copied.')
      setError('')
    } catch {
      setError('Could not copy the link. Copy it from the address bar after you open it.')
    }
  }

  const persistDraft = async (nextDraft) => {
    if (!String(nextDraft.display_name || '').trim()) return nextDraft
    return saveMyPortfolio(authUser, nextDraft)
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    setMessage('')
    setIsPhotoBusy(true)
    try {
      const uploaded = await uploadPortfolioPhoto(authUser.id, file, draft.photo_path)
      const nextDraft = { ...draft, ...uploaded }
      const saved = await persistDraft(nextDraft)
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
    setError('')
    setIsPhotoBusy(true)
    try {
      await removePortfolioPhoto(draft.photo_path)
      const nextDraft = { ...draft, photo_path: '', photoUrl: '', links: { ...draft.links, photo_path: '' } }
      const saved = await persistDraft(nextDraft)
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
    setError('')
    setMessage('')
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

  const handleEditGig = (gig) => {
    setError('')
    setMessage('')
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
    window.document.getElementById('gp-gig-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSaveGig = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    const gigs = Array.isArray(draft.gigs) ? draft.gigs : []
    const isEditing = Boolean(editingGigId)
    if (!isEditing && gigs.length >= MAX_GIGS) {
      setError(`You can publish up to ${MAX_GIGS} gigs.`)
      return
    }
    if (!String(gigDraft.title || '').trim()) {
      setError('Give this gig a title.')
      return
    }
    if (!String(gigDraft.price || '').trim()) {
      setError('Add a starting price for this gig.')
      return
    }

    setIsGigBusy(true)
    try {
      const currentGig = isEditing ? gigs.find((gig) => gig.id === editingGigId) : null
      const gigId = currentGig?.id || crypto.randomUUID()
      let cover = {
        cover_path: currentGig?.cover_path || '',
        coverUrl: currentGig?.coverUrl || '',
      }
      if (gigDraft.file) {
        cover = await uploadGigCover(authUser.id, gigId, gigDraft.file, currentGig?.cover_path || '')
      }
      const nextGig = {
        id: gigId,
        title: gigDraft.title.trim(),
        description: String(gigDraft.description || '').trim(),
        category: gigDraft.category,
        currency: gigDraft.currency,
        price: gigDraft.price.trim(),
        delivery: String(gigDraft.delivery || '').trim(),
        cover_path: cover.cover_path,
        coverUrl: cover.coverUrl,
      }
      const nextGigs = isEditing
        ? gigs.map((gig) => (gig.id === gigId ? nextGig : gig))
        : [...gigs, nextGig]
      const saved = await persistDraft({ ...draft, gigs: nextGigs })
      setDraft(saved)
      resetGigForm()
      setMessage(isEditing ? 'Gig updated.' : 'Gig added to your profile.')
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
    setError('')
    setIsGigBusy(true)
    try {
      await removeGigCover(gig.cover_path)
      const nextDraft = {
        ...draft,
        gigs: (draft.gigs || []).filter((entry) => entry.id !== gig.id),
      }
      const saved = await persistDraft(nextDraft)
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
    setError('')
    try {
      await deletePortfolioItem(authUser.id, item)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      setPendingDeleteId('')
      setMessage('Work sample removed.')
    } catch (deleteError) {
      setError(deleteError?.message || 'Unable to remove that item.')
    }
  }

  return (
    <main className="page-main gp-page">
      <section className="container">
        <header className="gp-hero">
          <p className="kicker">Guardian Angel Resources</p>
          <h1>Guardian Portfolio</h1>
          <p>
            Build a public profile, upload proof of work, and share one link with clients. Leave a field empty and it
            stays empty.
          </p>
        </header>

        {isLoading ? <p className="gp-status">Loading your portfolio…</p> : null}

        <div className="gp-layout">
          <div className="gp-editor">
            <form className="planner-card planner-form gp-form" onSubmit={handleSave}>
              <h3>Your public profile</h3>
              <div className="gp-photo-editor">
                <div className="gp-portrait is-edit">
                  {draft.photoUrl ? (
                    <img src={draft.photoUrl} alt={draft.display_name || 'Profile photo'} />
                  ) : (
                    <span>{getInitials(draft.display_name)}</span>
                  )}
                </div>
                <div>
                  <p className="gp-note">Profile photo. Optional. PNG, JPG, or WEBP up to 4 MB.</p>
                  <div className="gp-actions">
                    <label className="btn btn-secondary gp-file-btn">
                      {isPhotoBusy ? 'Uploading…' : draft.photoUrl ? 'Change photo' : 'Upload photo'}
                      <input
                        key={photoInputKey}
                        type="file"
                        accept={ALLOWED_PHOTO_EXTENSIONS.join(',')}
                        onChange={handlePhotoChange}
                        disabled={isPhotoBusy}
                      />
                    </label>
                    {draft.photoUrl ? (
                      <button className="btn btn-secondary" type="button" onClick={handleRemovePhoto} disabled={isPhotoBusy}>
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="gp-grid-2">
                <Field label="Display name">
                  <input
                    value={draft.display_name}
                    onChange={(event) => updateField('display_name', event.target.value)}
                    autoComplete="name"
                  />
                </Field>
                <Field label="City" hint="Optional">
                  <input
                    value={draft.city}
                    onChange={(event) => updateField('city', event.target.value)}
                    autoComplete="address-level2"
                  />
                </Field>
              </div>
              <Field label="Headline" hint="Optional. One line about the work you do.">
                <input
                  value={draft.headline}
                  onChange={(event) => updateField('headline', event.target.value)}
                  placeholder="English writer for small businesses"
                />
              </Field>
              <Field label="Offer" hint='Optional. Example: I help local shops get 12 Instagram posts in 3 days.'>
                <input
                  value={draft.offer}
                  onChange={(event) => updateField('offer', event.target.value)}
                />
              </Field>
              <Field label="About" hint="Optional">
                <textarea
                  value={draft.bio}
                  onChange={(event) => updateField('bio', event.target.value)}
                  rows={4}
                />
              </Field>
              <div className="gp-grid-2">
                <Field label="Skills" hint="Optional. Separate with commas.">
                  <input
                    value={draft.skillsText}
                    onChange={(event) => updateField('skillsText', event.target.value)}
                    placeholder="English writing, Canva, Excel"
                  />
                </Field>
                <Field label="Rate" hint="Optional">
                  <input
                    value={draft.rate_text}
                    onChange={(event) => updateField('rate_text', event.target.value)}
                    placeholder="Rs 4,000 per pack · from $15"
                  />
                </Field>
              </div>
              <div className="gp-grid-2">
                <Field label="WhatsApp" hint="Optional">
                  <input
                    value={draft.links.whatsapp}
                    onChange={(event) => updateLink('whatsapp', event.target.value)}
                    placeholder="03001234567"
                  />
                </Field>
                <Field label="Website" hint="Optional">
                  <input
                    value={draft.links.website}
                    onChange={(event) => updateLink('website', event.target.value)}
                  />
                </Field>
                <Field label="Upwork" hint="Optional">
                  <input
                    value={draft.links.upwork}
                    onChange={(event) => updateLink('upwork', event.target.value)}
                  />
                </Field>
                <Field label="Fiverr" hint="Optional">
                  <input
                    value={draft.links.fiverr}
                    onChange={(event) => updateLink('fiverr', event.target.value)}
                  />
                </Field>
                <Field label="LinkedIn" hint="Optional">
                  <input
                    value={draft.links.linkedin}
                    onChange={(event) => updateLink('linkedin', event.target.value)}
                  />
                </Field>
                <Field label="Public link" hint="Letters, numbers, and hyphens only.">
                  <input
                    value={draft.slug}
                    onChange={(event) => updateField('slug', event.target.value)}
                  />
                </Field>
              </div>
              <label className="gp-check">
                <input
                  type="checkbox"
                  checked={draft.is_public}
                  onChange={(event) => updateField('is_public', event.target.checked)}
                />
                Publish this portfolio so anyone with the link can view it
              </label>
              <div className="gp-actions">
                <button className="btn btn-primary" type="submit" disabled={isSaving || isLoading}>
                  {isSaving ? 'Saving…' : 'Save profile'}
                </button>
                {draft.is_public && publicPath ? (
                  <>
                    <Link className="btn btn-secondary" to={publicPath} target="_blank" rel="noreferrer">
                      Open public page
                    </Link>
                    <button className="btn btn-secondary" type="button" onClick={handleCopyLink}>
                      Copy link
                    </button>
                  </>
                ) : null}
              </div>
            </form>

            <form className="planner-card planner-form gp-form" onSubmit={handleAddItem}>
              <h3>Work & documents</h3>
              <p className="gp-note">
                Upload PDFs, images, or Word files up to 8 MB. You can add up to {MAX_PORTFOLIO_ITEMS} items
                ({items.length} used).
              </p>
              <Field label="Title">
                <input
                  value={itemDraft.title}
                  onChange={(event) => setItemDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Instagram pack for a local shop"
                />
              </Field>
              <Field label="Description" hint="Optional">
                <textarea
                  value={itemDraft.description}
                  onChange={(event) => setItemDraft((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                />
              </Field>
              <div className="gp-grid-2">
                <Field label="File" hint="PDF, images, or Word · up to 8 MB">
                  <div className="gp-upload">
                    <span className={`gp-upload-btn ${itemDraft.file ? 'has-file' : ''}`}>
                      <span className="gp-upload-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 16V7" strokeLinecap="round" />
                          <path d="M8.5 10.5 12 7l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M6 17.5v1.2A1.3 1.3 0 0 0 7.3 20h9.4a1.3 1.3 0 0 0 1.3-1.3v-1.2" strokeLinecap="round" />
                        </svg>
                      </span>
                      <span className="gp-upload-copy">
                        <strong>{itemDraft.file ? 'File selected' : 'Upload a file'}</strong>
                        <em>
                          {itemDraft.file
                            ? `${itemDraft.file.name} · ${formatFileSize(itemDraft.file.size)}`
                            : 'Click to browse'}
                        </em>
                      </span>
                      <input
                        key={fileInputKey}
                        type="file"
                        accept={ALLOWED_PORTFOLIO_EXTENSIONS.join(',')}
                        onChange={(event) =>
                          setItemDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))
                        }
                      />
                    </span>
                  </div>
                </Field>
                <Field label="Or a link" hint="Optional. Behance, Google Drive, GitHub…">
                  <input
                    value={itemDraft.url}
                    onChange={(event) => setItemDraft((current) => ({ ...current, url: event.target.value }))}
                    placeholder="https://"
                  />
                </Field>
              </div>
              <div className="gp-actions">
                <button className="btn btn-primary" type="submit" disabled={isUploading || items.length >= MAX_PORTFOLIO_ITEMS}>
                  {isUploading ? 'Uploading…' : 'Add to portfolio'}
                </button>
              </div>

              {items.length ? (
                <ul className="gp-manage-list">
                  {items.map((item) => (
                    <li key={item.id}>
                      <div>
                        <strong>{item.title}</strong>
                        {item.fileName ? <span>{item.fileName}</span> : null}
                        {item.externalUrl ? <span>{item.externalUrl}</span> : null}
                      </div>
                      <button className="btn btn-secondary" type="button" onClick={() => handleDeleteItem(item)}>
                        {pendingDeleteId === item.id ? 'Confirm remove' : 'Remove'}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="gp-empty">No work samples yet.</p>
              )}
            </form>
          </div>

        </div>

        <form id="gp-gig-form" className="planner-card planner-form gp-form gp-gig-form" onSubmit={handleSaveGig}>
          <h3>{editingGigId ? 'Edit gig' : 'Your gigs'}</h3>
          <p className="gp-note">
            Publish up to {MAX_GIGS} services, Fiverr-style. Use Edit or Remove on a saved gig to update it.
            {' '}{(draft.gigs || []).length}/{MAX_GIGS} used.
          </p>
          <div className="gp-grid-2">
            <Field label="Gig title">
              <input
                value={gigDraft.title}
                onChange={(event) => setGigDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder="I will write 5 CSS current affairs notes"
              />
            </Field>
            <Field label="Category">
              <select
                value={gigDraft.category}
                onChange={(event) => setGigDraft((current) => ({ ...current, category: event.target.value }))}
              >
                {GIG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="What the client gets" hint="Optional">
            <textarea
              value={gigDraft.description}
              onChange={(event) => setGigDraft((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              placeholder="5 typed notes, sources listed, delivered as a PDF."
            />
          </Field>
          <div className="gp-grid-2">
            <Field label="Currency">
              <select
                value={gigDraft.currency}
                onChange={(event) => setGigDraft((current) => ({ ...current, currency: event.target.value }))}
              >
                {GIG_CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} ({item.symbol})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Starting price">
              <input
                value={gigDraft.price}
                onChange={(event) => setGigDraft((current) => ({ ...current, price: event.target.value }))}
                placeholder="3000"
              />
            </Field>
          </div>
          <Field label="Delivery time" hint="Optional">
            <input
              value={gigDraft.delivery}
              onChange={(event) => setGigDraft((current) => ({ ...current, delivery: event.target.value }))}
              placeholder="3 days"
            />
          </Field>
          <Field label="Cover image" hint="Optional. PNG, JPG, or WEBP up to 4 MB.">
            <div className="gp-upload">
              <span className={`gp-upload-btn ${gigDraft.file ? 'has-file' : ''}`}>
                <span className="gp-upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 16V7" strokeLinecap="round" />
                    <path d="M8.5 10.5 12 7l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 17.5v1.2A1.3 1.3 0 0 0 7.3 20h9.4a1.3 1.3 0 0 0 1.3-1.3v-1.2" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="gp-upload-copy">
                  <strong>{gigDraft.file ? 'Cover selected' : 'Upload a cover'}</strong>
                  <em>
                    {gigDraft.file
                      ? `${gigDraft.file.name} · ${formatFileSize(gigDraft.file.size)}`
                      : 'Makes the gig card look like Fiverr'}
                  </em>
                </span>
                <input
                  key={gigFileKey}
                  type="file"
                  accept={ALLOWED_PHOTO_EXTENSIONS.join(',')}
                  onChange={(event) =>
                    setGigDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))
                  }
                />
              </span>
            </div>
          </Field>
          <div className="gp-actions">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isGigBusy || (!editingGigId && (draft.gigs || []).length >= MAX_GIGS)}
            >
              {isGigBusy ? 'Saving gig…' : editingGigId ? 'Save changes' : 'Add gig'}
            </button>
            {editingGigId ? (
              <button className="btn btn-secondary" type="button" onClick={resetGigForm} disabled={isGigBusy}>
                Cancel edit
              </button>
            ) : null}
          </div>
          {(draft.gigs || []).length ? (
            <ul className="gp-manage-list">
              {draft.gigs.map((gig) => (
                <li key={gig.id}>
                  <div>
                    <strong>{gig.title}</strong>
                    <span>{[gig.category, formatGigPrice(gig), gig.delivery].filter(Boolean).join(' · ')}</span>
                  </div>
                  <div className="gp-manage-actions">
                    <button className="btn btn-secondary" type="button" onClick={() => handleEditGig(gig)} disabled={isGigBusy}>
                      Edit
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => handleDeleteGig(gig)} disabled={isGigBusy}>
                      {pendingGigId === gig.id ? 'Confirm remove' : 'Remove'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="gp-empty">No gigs yet.</p>
          )}
        </form>

        <aside className="gp-preview-wide">
          <h3>Live site preview</h3>
          <GuardianPortfolioShowcase
            portfolio={draft}
            items={items}
            compact
            emptyLabel="Your public page will show only the fields you fill in."
          />
        </aside>

        {message ? <p className="gp-status is-ok">{message}</p> : null}
        {error ? <p className="planner-error gp-error">{error}</p> : null}
      </section>
    </main>
  )
}
