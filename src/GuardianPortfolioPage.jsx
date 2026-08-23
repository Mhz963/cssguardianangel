import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import GuardianPortfolioShowcase from './GuardianPortfolioShowcase.jsx'
import {
  ALLOWED_PORTFOLIO_EXTENSIONS,
  MAX_PORTFOLIO_ITEMS,
  addPortfolioItem,
  createEmptyPortfolio,
  deletePortfolioItem,
  fetchMyPortfolio,
  fetchMyPortfolioItems,
  formatFileSize,
  saveMyPortfolio,
} from './utils/portfolioClient.js'

function Field({ label, hint, children }) {
  return (
    <label>
      {label}
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

export default function GuardianPortfolioPage({ authUser }) {
  const [draft, setDraft] = useState(() => createEmptyPortfolio(authUser))
  const [items, setItems] = useState([])
  const [itemDraft, setItemDraft] = useState({ title: '', description: '', url: '', file: null })
  const [fileInputKey, setFileInputKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState('')
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
                <Field label="File" hint={ALLOWED_PORTFOLIO_EXTENSIONS.join(', ')}>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept={ALLOWED_PORTFOLIO_EXTENSIONS.join(',')}
                    onChange={(event) =>
                      setItemDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))
                    }
                  />
                  {itemDraft.file ? (
                    <small>
                      {itemDraft.file.name} · {formatFileSize(itemDraft.file.size)}
                    </small>
                  ) : null}
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

          <aside className="planner-card gp-preview">
            <h3>Preview</h3>
            <GuardianPortfolioShowcase
              portfolio={draft}
              items={items}
              emptyLabel="Your public page will show only the fields you fill in."
            />
          </aside>
        </div>

        {message ? <p className="gp-status is-ok">{message}</p> : null}
        {error ? <p className="planner-error gp-error">{error}</p> : null}
      </section>
    </main>
  )
}
