import { useCallback, useEffect, useState } from 'react'

export const GA_PDF_APP_VIEW_EVENT = 'ga-pdf-app-view'
export const GA_PDF_APP_TOAST_EVENT = 'ga-pdf-app-toast'

function resolveViewerSrc({ pdfUrl, blobUrl, dataUrl }) {
  if (pdfUrl && /^https?:\/\//i.test(String(pdfUrl))) return String(pdfUrl)
  if (blobUrl) return String(blobUrl)
  if (dataUrl) return String(dataUrl)
  return ''
}

export function openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName, mode = 'view' } = {}) {
  const src = resolveViewerSrc({ pdfUrl, blobUrl, dataUrl })
  if (!src) return false
  window.dispatchEvent(
    new CustomEvent(GA_PDF_APP_VIEW_EVENT, {
      detail: {
        src,
        pdfUrl: pdfUrl || '',
        blobUrl: blobUrl || '',
        dataUrl: dataUrl || '',
        fileName: fileName || 'Guardian Angel PDF',
        mode: mode === 'download' ? 'download' : 'view',
      },
    }),
  )
  return true
}

export function showPdfAppToast(message) {
  window.dispatchEvent(
    new CustomEvent(GA_PDF_APP_TOAST_EVENT, {
      detail: { message: message || '' },
    }),
  )
}

async function blobFromViewerDetail(detail) {
  if (detail?.dataUrl) {
    const response = await fetch(detail.dataUrl)
    if (!response.ok) throw new Error('Could not read PDF data')
    return response.blob()
  }
  if (detail?.blobUrl) {
    const response = await fetch(detail.blobUrl)
    if (!response.ok) throw new Error('Could not read PDF blob')
    return response.blob()
  }
  if (detail?.pdfUrl && /^https?:\/\//i.test(detail.pdfUrl)) {
    const response = await fetch(detail.pdfUrl, { credentials: 'include' })
    if (!response.ok) throw new Error('Could not fetch PDF')
    return response.blob()
  }
  if (detail?.src) {
    const response = await fetch(detail.src, { credentials: 'include' })
    if (!response.ok) throw new Error('Could not load PDF')
    return response.blob()
  }
  throw new Error('No PDF source')
}

function asPdfBlob(blob) {
  if (blob && typeof blob.type === 'string' && blob.type.includes('pdf')) return blob
  return new Blob([blob], { type: 'application/pdf' })
}

/**
 * Same mobile save method as the working Expo app path: system share/save sheet.
 * Must run directly from a button tap (user gesture).
 */
export async function savePdfWithMobileSheet(detail) {
  const safeName = detail?.fileName || 'Guardian_Angel_Report.pdf'
  const raw = await blobFromViewerDetail(detail)
  const blob = asPdfBlob(raw)
  const file = new File([blob], safeName, { type: 'application/pdf' })

  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: safeName,
        text: 'Guardian Angel PDF',
      })
      return true
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = safeName
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
  return true
}

export function PdfAppExperienceHost() {
  const [viewer, setViewer] = useState(null)
  const [toast, setToast] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const closeViewer = useCallback(() => {
    setViewer(null)
    try {
      if (window.history.state?.gaPdfAppViewer) {
        window.history.back()
      }
    } catch {
      // ignore
    }
  }, [])

  const handleSavePdf = useCallback(async () => {
    if (!viewer || isSaving) return
    setIsSaving(true)
    try {
      await savePdfWithMobileSheet(viewer)
      setToast('Choose Save / Files to keep the PDF')
      window.setTimeout(() => setToast(''), 2800)
    } catch (error) {
      if (error?.name === 'AbortError') {
        // user cancelled share sheet — not an error
      } else {
        setToast(error?.message || 'Could not save PDF')
        window.setTimeout(() => setToast(''), 3200)
      }
    } finally {
      setIsSaving(false)
    }
  }, [viewer, isSaving])

  useEffect(() => {
    const onView = (event) => {
      const detail = event?.detail
      if (!detail?.src) return
      setViewer(detail)
      try {
        window.history.pushState({ gaPdfAppViewer: true }, '', window.location.href)
      } catch {
        // ignore
      }
      if (detail.mode === 'download') {
        setToast('Tap Save PDF below to download')
        window.setTimeout(() => setToast(''), 2800)
      }
    }

    const onPopState = () => {
      setViewer((current) => (current ? null : current))
    }

    const onToast = (event) => {
      const message = event?.detail?.message
      if (!message) return
      setToast(message)
      window.setTimeout(() => setToast(''), 2800)
    }

    window.addEventListener(GA_PDF_APP_VIEW_EVENT, onView)
    window.addEventListener('popstate', onPopState)
    window.addEventListener(GA_PDF_APP_TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(GA_PDF_APP_VIEW_EVENT, onView)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener(GA_PDF_APP_TOAST_EVENT, onToast)
    }
  }, [])

  useEffect(() => {
    if (!viewer) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [viewer])

  return (
    <>
      {viewer ? (
        <div className="pdf-app-viewer-overlay" role="dialog" aria-modal="true">
          <div className="pdf-app-viewer-shell">
            <div className="pdf-app-viewer-header">
              <h3>{viewer.fileName || 'PDF Viewer'}</h3>
              <div className="pdf-app-viewer-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSavePdf}
                  disabled={isSaving}
                >
                  {isSaving ? 'Preparing…' : 'Save PDF'}
                </button>
                <button type="button" className="btn btn-primary pdf-app-viewer-close" onClick={closeViewer}>
                  Close
                </button>
              </div>
            </div>
            <object
              className="pdf-app-viewer-frame"
              data={viewer.src}
              type="application/pdf"
              aria-label={viewer.fileName || 'PDF'}
            >
              <iframe className="pdf-app-viewer-frame" title={viewer.fileName || 'PDF Viewer'} src={viewer.src} />
            </object>
            <p className="pdf-app-viewer-hint">
              {viewer.mode === 'download'
                ? 'Tap Save PDF to download on your phone (same as app save sheet).'
                : 'Tap Save PDF to download, or Close to go back one step.'}
            </p>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div className="pdf-app-toast" role="status">
          {toast}
        </div>
      ) : null}
    </>
  )
}
