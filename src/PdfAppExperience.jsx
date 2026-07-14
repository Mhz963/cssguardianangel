import { useCallback, useEffect, useState } from 'react'

export const GA_PDF_APP_VIEW_EVENT = 'ga-pdf-app-view'
export const GA_PDF_APP_TOAST_EVENT = 'ga-pdf-app-toast'

function toAbsoluteUrl(url) {
  const href = String(url || '')
  if (!href) return ''
  if (/^https?:\/\//i.test(href) || href.startsWith('blob:') || href.startsWith('data:')) {
    return href
  }
  if (typeof window === 'undefined') return href
  try {
    return new URL(href, window.location.href).href
  } catch {
    return href
  }
}

function isPrivateHost(url) {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== 'http:' && protocol !== 'https:') return false
    const host = hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.local')) return true
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return true
    return false
  } catch {
    return false
  }
}

/**
 * Build a viewable src. Mobile browsers rarely render raw PDFs in iframes,
 * so public https PDFs go through Google Docs viewer.
 */
function resolveViewerSrc({ pdfUrl, blobUrl, dataUrl }) {
  if (blobUrl) return String(blobUrl)
  if (dataUrl) return String(dataUrl)

  const absolute = toAbsoluteUrl(pdfUrl)
  if (!absolute) return ''

  if (/^https:\/\//i.test(absolute) && !isPrivateHost(absolute)) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(absolute)}`
  }

  return absolute
}

/** View-only in-app / mobile PDF viewer. */
export function openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName } = {}) {
  const absolutePdf = toAbsoluteUrl(pdfUrl)

  // Local / LAN files: open directly (Google Docs cannot reach private hosts).
  if (absolutePdf && isPrivateHost(absolutePdf) && !blobUrl && !dataUrl) {
    const opened = window.open(absolutePdf, '_blank', 'noopener,noreferrer')
    if (opened) return true
  }

  const src = resolveViewerSrc({ pdfUrl: absolutePdf || pdfUrl, blobUrl, dataUrl })
  if (!src) {
    if (absolutePdf) {
      window.open(absolutePdf, '_blank', 'noopener,noreferrer')
      return true
    }
    return false
  }

  window.dispatchEvent(
    new CustomEvent(GA_PDF_APP_VIEW_EVENT, {
      detail: {
        src,
        fileName: fileName || 'Guardian Angel PDF',
        originalUrl: absolutePdf || '',
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
      window.setTimeout(() => setToast(''), 3600)
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
                {viewer.originalUrl ? (
                  <a
                    className="btn btn-secondary pdf-app-viewer-close"
                    href={viewer.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open tab
                  </a>
                ) : null}
                <button type="button" className="btn btn-primary pdf-app-viewer-close" onClick={closeViewer}>
                  Close
                </button>
              </div>
            </div>
            <iframe
              className="pdf-app-viewer-frame"
              title={viewer.fileName || 'PDF Viewer'}
              src={viewer.src}
              allow="fullscreen"
            />
            <p className="pdf-app-viewer-hint">Close returns to the previous screen.</p>
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
