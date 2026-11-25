import { formatNewsTimestamp } from '../utils/formatNewsTimestamp.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../utils/supabaseClient.js'

function getStickyNoteTitle(note) {
  if (note?.title?.trim()) return note.title.trim()
  const text = String(note?.text || '').trim()
  if (!text) return 'Untitled note'
  const firstLine = text.split('\n')[0].trim()
  if (!firstLine) return 'Untitled note'
  return firstLine.length > 72 ? `${firstLine.slice(0, 69)}…` : firstLine
}

function getStickyNoteBody(note) {
  if (typeof note?.body === 'string') return note.body
  const text = String(note?.text || '').trim()
  if (!text) return ''
  const lines = text.split('\n')
  if (lines.length <= 1) return text
  const body = lines.slice(1).join('\n').trim()
  return body || text
}

export default function StickyNotesWidget({ authUser }) {
  const [isOpen, setIsOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [activeNoteId, setActiveNoteId] = useState(null)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [isStickyNotesHydrated, setIsStickyNotesHydrated] = useState(() => !(supabase && authUser?.id))
  const stickyNotesStorageKey = authUser?.id ? `ga-sticky-notes-${authUser.id}` : 'ga-sticky-notes'
  const stickyNotesLoadedUserRef = useRef(authUser?.id || 'guest')
  const stickyNotesListRef = useRef(null)
  const stickyNotesCountRef = useRef(0)
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(stickyNotesStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(stickyNotesStorageKey)
      const parsed = raw ? JSON.parse(raw) : []
      setNotes(Array.isArray(parsed) ? parsed : [])
    } catch {
      setNotes([])
    }
  }, [stickyNotesStorageKey])

  useEffect(() => {
    let isCancelled = false
    const currentUserKey = authUser?.id || 'guest'
    const loadStickyNotes = async () => {
      if (!supabase || !authUser?.id) {
        stickyNotesLoadedUserRef.current = currentUserKey
        setIsStickyNotesHydrated(true)
        return
      }
      setIsStickyNotesHydrated(false)
      try {
        const { data } = await supabase
          .from('user_sticky_notes')
          .select('notes')
          .eq('user_id', authUser.id)
          .maybeSingle()
        if (isCancelled) return
        if (Array.isArray(data?.notes) && data.notes.length > 0) {
          setNotes(data.notes)
        } else if (Array.isArray(data?.notes) && data.notes.length === 0) {
          setNotes((prev) => (prev.length > 0 ? prev : []))
        }
      } catch {
        // Keep local notes if remote fetch fails.
      } finally {
        if (!isCancelled) {
          stickyNotesLoadedUserRef.current = currentUserKey
          setIsStickyNotesHydrated(true)
        }
      }
    }
    loadStickyNotes()
    return () => {
      isCancelled = true
    }
  }, [authUser?.id])

  useEffect(() => {
    try {
      localStorage.setItem(stickyNotesStorageKey, JSON.stringify(notes))
    } catch {
      // Ignore storage failures.
    }

    if (!isStickyNotesHydrated) return
    const currentUserKey = authUser?.id || 'guest'
    if (stickyNotesLoadedUserRef.current !== currentUserKey) return

    const syncStickyNotes = async () => {
      if (!supabase || !authUser?.id) return
      try {
        await supabase.from('user_sticky_notes').upsert(
          {
            user_id: authUser.id,
            notes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
      } catch {
        // Keep local notes if remote sync fails.
      }
    }
    syncStickyNotes()
  }, [notes, authUser?.id, isStickyNotesHydrated, stickyNotesStorageKey])

  useEffect(() => {
    const listEl = stickyNotesListRef.current
    if (!listEl || !isOpen) return
    if (notes.length > stickyNotesCountRef.current) {
      listEl.scrollTop = 0
    }
    stickyNotesCountRef.current = notes.length
  }, [notes.length, isOpen])

  useEffect(() => {
    if (!activeNoteId) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setActiveNoteId(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeNoteId])

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)),
    [notes],
  )

  const activeNote = useMemo(
    () => sortedNotes.find((note) => note.id === activeNoteId) || null,
    [sortedNotes, activeNoteId],
  )

  const handlePaste = async () => {
    try {
      if (!navigator?.clipboard?.readText) return
      const text = await navigator.clipboard.readText()
      if (typeof text === 'string' && text.trim()) {
        setDraftBody((current) => (current ? `${current}\n${text}` : text))
        setIsComposeOpen(true)
        setIsOpen(true)
      }
    } catch {
      // Clipboard can fail due to browser permissions.
    }
  }

  const handleSave = () => {
    const body = draftBody.trim()
    if (!body) return
    const title = draftTitle.trim() || getStickyNoteTitle({ text: body })
    const note = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      title,
      body,
      text: `${title}\n${body}`,
      createdAt: Date.now(),
    }
    setNotes((current) => [note, ...current].slice(0, 30))
    setDraftTitle('')
    setDraftBody('')
    setIsComposeOpen(false)
    setIsOpen(true)
  }

  const handleDelete = (id) => {
    setNotes((current) => current.filter((note) => note.id !== id))
    if (activeNoteId === id) setActiveNoteId(null)
  }

  const handleCopy = async (note) => {
    const title = getStickyNoteTitle(note)
    const body = getStickyNoteBody(note)
    const payload = body && body !== title ? `${title}\n\n${body}` : title
    try {
      await navigator.clipboard.writeText(payload)
    } catch {
      // Ignore copy failures.
    }
  }

  const resetCompose = () => {
    setDraftTitle('')
    setDraftBody('')
    setIsComposeOpen(false)
  }

  return (
    <div className="sticky-notes-wrap" aria-label="Sticky notes">
      <button
        className="sticky-notes-fab"
        type="button"
        onClick={() => {
          setIsOpen((current) => {
            const next = !current
            if (!next) {
              setActiveNoteId(null)
              resetCompose()
            }
            return next
          })
        }}
        aria-label={isOpen ? 'Close sticky notes' : 'Open sticky notes'}
        title="Sticky notes"
      >
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path d="M6.5 3.8h11c1 0 1.8.8 1.8 1.8v9.3c0 .5-.2.9-.5 1.3l-3.7 3.7c-.3.3-.8.5-1.3.5H6.5c-1 0-1.8-.8-1.8-1.8V5.6c0-1 .8-1.8 1.8-1.8Z" fill="none" />
          <path d="M15.5 19.8v-3.2c0-.8.6-1.4 1.4-1.4h3.2" fill="none" />
          <path d="M8 8h8M8 11.2h8M8 14.4h5.6" fill="none" />
        </svg>
      </button>

      {isOpen ? (
        <div className="sticky-notes-panel glass-panel" role="dialog" aria-label="Sticky notes panel">
          <div className="sticky-notes-head">
            <div className="sticky-notes-head-main">
              <h3>Notes</h3>
              <span className="sticky-notes-count">{sortedNotes.length}</span>
            </div>
            <button
              className="sticky-notes-close-btn"
              type="button"
              aria-label="Close notes"
              onClick={() => {
                setIsOpen(false)
                setActiveNoteId(null)
                resetCompose()
              }}
            >
              Close
            </button>
          </div>

          <div className="sticky-notes-body">
            <div className="sticky-notes-list" ref={stickyNotesListRef}>
              {sortedNotes.length === 0 ? (
                <div className="sticky-notes-empty">
                  <p>No notes yet. Tap “New note” to save your first one.</p>
                </div>
              ) : (
                sortedNotes.map((note) => (
                  <div key={note.id} className="sticky-note-row">
                    <button
                      className="sticky-note-row-open"
                      type="button"
                      onClick={() => setActiveNoteId(note.id)}
                    >
                      <span className="sticky-note-row-title">{getStickyNoteTitle(note)}</span>
                      <span className="sticky-note-row-meta">{formatNewsTimestamp(note.createdAt)}</span>
                    </button>
                    <button
                      className="sticky-note-row-delete"
                      type="button"
                      aria-label={`Delete ${getStickyNoteTitle(note)}`}
                      onClick={() => handleDelete(note.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            {isComposeOpen ? (
              <div className="sticky-notes-compose">
                <input
                  className="sticky-notes-title-input"
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Title"
                  maxLength={120}
                />
                <textarea
                  className="sticky-notes-body-input"
                  value={draftBody}
                  onChange={(event) => setDraftBody(event.target.value)}
                  placeholder="Write your note…"
                  rows={4}
                />
                <div className="sticky-notes-actions">
                  <button className="btn btn-secondary" type="button" onClick={resetCompose}>
                    Cancel
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={handlePaste}>
                    Paste
                  </button>
                  <button className="btn btn-primary" type="button" onClick={handleSave} disabled={!draftBody.trim()}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="sticky-notes-footer">
                <button
                  className="btn btn-primary sticky-notes-new-btn"
                  type="button"
                  onClick={() => setIsComposeOpen(true)}
                >
                  + New note
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {activeNote ? (
        <div
          className="sticky-note-modal-backdrop"
          role="presentation"
          onClick={() => setActiveNoteId(null)}
        >
          <div
            className="sticky-note-modal glass-panel"
            role="dialog"
            aria-label={getStickyNoteTitle(activeNote)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky-note-modal-head">
              <div>
                <h4>{getStickyNoteTitle(activeNote)}</h4>
                <p>{formatNewsTimestamp(activeNote.createdAt)}</p>
              </div>
              <button
                className="sticky-note-modal-close"
                type="button"
                aria-label="Close note"
                onClick={() => setActiveNoteId(null)}
              >
                ×
              </button>
            </div>
            <div className="sticky-note-modal-body">
              <pre>{getStickyNoteBody(activeNote)}</pre>
            </div>
            <div className="sticky-note-modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => handleCopy(activeNote)}>
                Copy
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => handleDelete(activeNote.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
