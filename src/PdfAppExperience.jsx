import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

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

function dataUrlToBytes(dataUrl) {
  const raw = String(dataUrl || '')
  const comma = raw.indexOf(',')
  const base64 = comma >= 0 ? raw.slice(comma + 1) : raw
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * View-only PDF overlay rendered with pdf.js (canvas pages).
 * Works for generated blob/data PDFs inside app WebViews and mobile browsers
 * where native <object>/<iframe> PDF embedding is unavailable.
 */
export function PdfAppExperienceHost() {
  const [viewer, setViewer] = useState(null)
  const [toast, setToast] = useState('')
  const [viewerStatus, setViewerStatus] = useState('idle') // idle | loading | ready | error
  const pagesRef = useRef(null)

  const closeViewer = useCallback(() => {
    setViewer(null)
    setViewerStatus('idle')
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

  // Render PDF pages to canvases whenever a document opens.
  useEffect(() => {
    if (!viewer) return undefined
    let cancelled = false
    let pdfDoc = null

    const renderDocument = async () => {
      const container = pagesRef.current
      if (!container) return
      setViewerStatus('loading')
      try {
        const source = viewer.dataUrl || viewer.blobUrl || viewer.src
        let loadingTask
        if (String(source).startsWith('data:')) {
          loadingTask = pdfjsLib.getDocument({ data: dataUrlToBytes(source) })
        } else {
          loadingTask = pdfjsLib.getDocument({ url: source })
        }
        pdfDoc = await loadingTask.promise
        if (cancelled) return

        container.innerHTML = ''
        const containerWidth = container.clientWidth || window.innerWidth || 360
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.5)

        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
          if (cancelled) return
          const page = await pdfDoc.getPage(pageNumber)
          const baseViewport = page.getViewport({ scale: 1 })
          const cssScale = Math.max((containerWidth - 12) / baseViewport.width, 0.2)
          const renderViewport = page.getViewport({ scale: cssScale * pixelRatio })

          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(renderViewport.width)
          canvas.height = Math.floor(renderViewport.height)
          canvas.className = 'pdf-app-viewer-page'
          const context = canvas.getContext('2d')
          container.appendChild(canvas)

          await page.render({ canvasContext: context, viewport: renderViewport }).promise
        }

        if (!cancelled) setViewerStatus('ready')
      } catch {
        if (!cancelled) setViewerStatus('error')
      }
    }

    renderDocument()

    return () => {
      cancelled = true
      try {
        pdfDoc?.destroy?.()
      } catch {
        // ignore
      }
    }
  }, [viewer])

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
            <div className="pdf-app-viewer-pages" ref={pagesRef} aria-label={viewer.fileName || 'PDF'} />
            {viewerStatus === 'loading' ? (
              <p className="pdf-app-viewer-hint">Loading PDF…</p>
            ) : viewerStatus === 'error' ? (
              <p className="pdf-app-viewer-hint">Could not display this PDF. Try Download instead.</p>
            ) : (
              <p className="pdf-app-viewer-hint">Scroll to read. Close goes back one step.</p>
            )}
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
