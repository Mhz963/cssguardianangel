import { useCallback, useEffect, useState } from 'react'

export const GA_PDF_APP_VIEW_EVENT = 'ga-pdf-app-view'
export const GA_PDF_APP_DOWNLOAD_EVENT = 'ga-pdf-app-download'

function resolveViewerSrc({ pdfUrl, blobUrl, dataUrl }) {
  if (pdfUrl && /^https?:\/\//i.test(String(pdfUrl))) return String(pdfUrl)
  if (blobUrl) return String(blobUrl)
  if (dataUrl) return String(dataUrl)
  return ''
}

/**
 * Open the in-website PDF viewer (works inside the existing app WebView after Vercel deploy).
 */
export function openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName } = {}) {
  const src = resolveViewerSrc({ pdfUrl, blobUrl, dataUrl })
  if (!src) return false
  window.dispatchEvent(
    new CustomEvent(GA_PDF_APP_VIEW_EVENT, {
      detail: {
        src,
        fileName: fileName || 'Guardian Angel PDF',
      },
    }),
  )
  return true
}

export function triggerPdfAppDownload(detail) {
  window.dispatchEvent(new CustomEvent(GA_PDF_APP_DOWNLOAD_EVENT, { detail: detail || {} }))
}

/**
 * In-WebView PDF viewer + download toast — no native update required.
 */
export function PdfAppExperienceHost() {
  const [viewer, setViewer] = useState(null)
  const [toast, setToast] = useState('')

  const closeViewer = useCallback(() => {
    setViewer(null)
    // Unwind only the history entry we added for this viewer (one step, not to Home).
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
      // Hardware/WebView back should close viewer only, not keep walking history.
      setViewer((current) => (current ? null : current))
    }

    const onDownloadToast = (event) => {
      const message = event?.detail?.message || 'PDF download started'
      setToast(message)
      window.setTimeout(() => setToast(''), 2800)
    }

    window.addEventListener(GA_PDF_APP_VIEW_EVENT, onView)
    window.addEventListener('popstate', onPopState)
    window.addEventListener(GA_PDF_APP_DOWNLOAD_EVENT, onDownloadToast)
    return () => {
      window.removeEventListener(GA_PDF_APP_VIEW_EVENT, onView)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener(GA_PDF_APP_DOWNLOAD_EVENT, onDownloadToast)
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
              <button type="button" className="btn btn-primary pdf-app-viewer-close" onClick={closeViewer}>
                Close
              </button>
            </div>
            {/* Direct PDF URL — avoid Google Docs viewer (it pollutes history and jumps Home). */}
            <object className="pdf-app-viewer-frame" data={viewer.src} type="application/pdf" aria-label={viewer.fileName || 'PDF'}>
              <iframe className="pdf-app-viewer-frame" title={viewer.fileName || 'PDF Viewer'} src={viewer.src} />
            </object>
            <p className="pdf-app-viewer-hint">Close returns to the previous screen. Use Download PDF to save the file.</p>
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
