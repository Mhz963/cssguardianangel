import { openPdfAppViewer, showPdfAppToast } from './PdfAppExperience.jsx'

const PDF_CHUNK_SIZE = 6000

export function isNativeAppView() {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView?.postMessage)
}

export function isMobileWebView() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

const fileToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function postNativeJson(payload) {
  if (!isNativeAppView()) return false
  try {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

function extractBase64(dataUrl) {
  const raw = String(dataUrl || '')
  const comma = raw.indexOf(',')
  if (comma === -1) return raw
  return raw.slice(comma + 1)
}

async function resolveBlobFromSources({ dataUrl, blobUrl, pdfUrl }) {
  if (dataUrl) {
    const response = await fetch(dataUrl)
    if (!response.ok) throw new Error('Could not read PDF data')
    return response.blob()
  }
  if (blobUrl) {
    const response = await fetch(blobUrl)
    if (!response.ok) throw new Error('Could not read PDF blob')
    return response.blob()
  }
  if (pdfUrl) {
    const href = String(pdfUrl)
    // Same-origin assets, absolute http(s), or relative /assets/… paths
    if (
      /^https?:\/\//i.test(href) ||
      href.startsWith('/') ||
      href.startsWith('./') ||
      href.startsWith('../') ||
      href.startsWith('blob:') ||
      href.startsWith('data:')
    ) {
      const response = await fetch(href, { credentials: 'include' })
      if (!response.ok) throw new Error(`Could not fetch PDF (${response.status})`)
      return response.blob()
    }
  }
  throw new Error('No PDF source available')
}

function asPdfBlob(blob) {
  if (blob && typeof blob.type === 'string' && blob.type.includes('pdf')) return blob
  return new Blob([blob], { type: 'application/pdf' })
}

function clickDownloadAnchor(href, fileName) {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.setAttribute('download', fileName || 'Guardian_Angel_Report.pdf')
  anchor.rel = 'noopener noreferrer'
  // iOS Safari often ignores download= and navigates; prefer same-tab only for blob:
  if (!String(href).startsWith('blob:')) {
    anchor.target = '_blank'
  }
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * Direct download / save sheet — never opens the in-page PDF viewer.
 */
export async function downloadPdfDirect({ dataUrl, blobUrl, pdfUrl, fileName } = {}) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'

  // Native Expo shell: post to RN and let share sheet handle save (no in-web overlay).
  if (isNativeAppView()) {
    if (pdfUrl && typeof window.__gaPostPdfFromUrl === 'function') {
      const href = String(pdfUrl)
      if (/^https?:\/\//i.test(href) || href.startsWith('/') || looksLikePdfPath(href)) {
        const absolute =
          href.startsWith('/') && typeof window !== 'undefined'
            ? `${window.location.origin}${href}`
            : href
        window.__gaPostPdfFromUrl('download', safeName, absolute)
        showPdfAppToast('Saving PDF…')
        return true
      }
    }
    if (dataUrl && typeof window.__gaPostPdfPayload === 'function') {
      window.__gaPostPdfPayload('download', safeName, dataUrl)
      showPdfAppToast('Saving PDF…')
      return true
    }
    if (blobUrl && typeof window.__gaPostPdfFromBlobUrl === 'function') {
      window.__gaPostPdfFromBlobUrl('download', safeName, blobUrl)
      showPdfAppToast('Saving PDF…')
      return true
    }
    // Fallback: chunked postMessage without injected helpers (older shells).
    if (dataUrl) {
      const ok = await postPdfDataUrlToNative('download', safeName, dataUrl)
      if (ok) {
        showPdfAppToast('Saving PDF…')
        return true
      }
    }
    if (blobUrl) {
      const ok = await postPdfBlobToNativeApp(blobUrl, safeName, 'download')
      if (ok) {
        showPdfAppToast('Saving PDF…')
        return true
      }
    }
    if (pdfUrl && /^https?:\/\//i.test(String(pdfUrl))) {
      const ok = await postPdfUrlToNativeApp(pdfUrl, safeName, 'download')
      if (ok) {
        showPdfAppToast('Saving PDF…')
        return true
      }
    }
  }

  try {
    const rawBlob = await resolveBlobFromSources({ dataUrl, blobUrl, pdfUrl })
    const blob = asPdfBlob(rawBlob)
    const file = new File([blob], safeName, { type: 'application/pdf' })
    const objectUrl = URL.createObjectURL(blob)

    // Prefer Web Share (files) on phones — works for Chrome/Safari save flows.
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: safeName,
            text: 'Guardian Angel PDF',
          })
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
          showPdfAppToast('Choose Save / Files to keep the PDF')
          return true
        }
      } catch (shareError) {
        if (shareError?.name === 'AbortError') {
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
          return true
        }
      }
    }

    // Blob + download attribute (best on Android Chrome / desktop).
    clickDownloadAnchor(objectUrl, safeName)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
    showPdfAppToast(`${safeName} download started`)
    return true
  } catch (error) {
    // Last resort: original URL with download attribute
    if (pdfUrl) {
      clickDownloadAnchor(String(pdfUrl), safeName)
      showPdfAppToast('Opening PDF download…')
      return true
    }
    console.warn('[pdf download]', error)
    return false
  }
}

function looksLikePdfPath(url) {
  return /\.pdf($|\?|#)/i.test(String(url || ''))
}

export async function postPdfUrlToNativeApp(pdfUrl, fileName, action = 'view') {
  if (!pdfUrl || !isNativeAppView()) return false
  if (typeof window.__gaPostPdfFromUrl === 'function') {
    window.__gaPostPdfFromUrl(action, fileName, pdfUrl)
    return true
  }
  const href = String(pdfUrl)
  if (!/^https?:\/\//i.test(href)) return false
  return postNativeJson({
    type: 'ga_pdf_remote',
    url: href,
    action: action || 'view',
    fileName: fileName || 'Guardian_Angel_Report.pdf',
  })
}

export async function postPdfDataUrlToNative(action, fileName, dataUrl) {
  if (!isNativeAppView() || !dataUrl) return false
  if (typeof window.__gaPostPdfPayload === 'function') {
    window.__gaPostPdfPayload(action, fileName, dataUrl)
    return true
  }

  const base64 = extractBase64(dataUrl)
  if (!base64) return false
  const total = Math.ceil(base64.length / PDF_CHUNK_SIZE) || 1
  const streamId = `ga_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  if (
    !postNativeJson({
      type: 'ga_pdf_v2_start',
      id: streamId,
      action: action || 'view',
      fileName: fileName || 'Guardian_Angel_Report.pdf',
      total,
    })
  ) {
    return false
  }

  for (let index = 0; index < total; index += 1) {
    if (
      !postNativeJson({
        type: 'ga_pdf_v2_part',
        id: streamId,
        index,
        total,
        part: base64.slice(index * PDF_CHUNK_SIZE, (index + 1) * PDF_CHUNK_SIZE),
      })
    ) {
      return false
    }
    await sleep(55)
  }
  await sleep(55)
  return postNativeJson({ type: 'ga_pdf_v2_end', id: streamId })
}

export async function postPdfBlobToNativeApp(blobUrl, fileName, action = 'view') {
  if (!blobUrl || !isNativeAppView()) return false
  try {
    if (typeof window.__gaPostPdfFromBlobUrl === 'function') {
      window.__gaPostPdfFromBlobUrl(action, fileName, blobUrl)
      return true
    }
    const response = await fetch(blobUrl)
    if (!response.ok) return false
    const blob = await response.blob()
    const nextDataUrl = await fileToDataUrl(blob)
    return postPdfDataUrlToNative(action, fileName, nextDataUrl)
  } catch {
    return false
  }
}

/**
 * Unified PDF action for app WebView + mobile/desktop browser.
 * Download never opens the PDF viewer overlay.
 */
export async function handlePdfUserAction({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' }) {
  if (action === 'download') {
    return downloadPdfDirect({ dataUrl, blobUrl, pdfUrl, fileName })
  }

  // View
  if (isNativeAppView() || isMobileWebView()) {
    return openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName })
  }

  const target = pdfUrl || blobUrl || dataUrl
  return openPdfInBrowser(target)
}

/** @deprecated Prefer handlePdfUserAction — kept for call-site compatibility */
export async function sendPdfToNativeApp({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' }) {
  return handlePdfUserAction({ dataUrl, blobUrl, pdfUrl, fileName, action })
}

export function openPdfInBrowser(url) {
  if (!url) return false
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  return Boolean(opened)
}

export function downloadPdfInBrowser(url, fileName) {
  if (!url) return
  clickDownloadAnchor(url, fileName || 'Guardian_Angel_Report.pdf')
}
