import { useCallback, useEffect, useState } from 'react'

export const GA_PDF_APP_VIEW_EVENT = 'ga-pdf-app-view'
export const GA_PDF_APP_TOAST_EVENT = 'ga-pdf-app-toast'

function resolveViewerSrc({ pdfUrl, blobUrl, dataUrl }) {
  if (pdfUrl && /^https?:\/\//i.test(String(pdfUrl))) return String(pdfUrl)
  if (blobUrl) return String(blobUrl)
  if (dataUrl) return String(dataUrl)
  return ''
}

/** Open PDF in view mode only (no share / save sheet). */
export function openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName } = {}) {
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

/** View-only PDF overlay — Close returns one history step. */
export function PdfAppExperienceHost() {
  const [viewer, setViewer] = useState(null)
  const [toast, setToast] = useState('')

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
            <p className="pdf-app-viewer-hint">Swipe or scroll to read. Close goes back one step.</p>
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
