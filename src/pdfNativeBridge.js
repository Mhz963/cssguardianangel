import { openPdfAppViewer, showPdfAppToast } from './PdfAppExperience.jsx'

const PDF_CHUNK_SIZE = 6000

export function isNativeAppView() {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView?.postMessage)
}

export function isMobileWebView() {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')
}

function isIosBrowser() {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
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

function toAbsoluteUrl(url) {
  const href = String(url || '')
  if (!href) return ''
  if (/^https?:\/\//i.test(href) || href.startsWith('blob:') || href.startsWith('data:')) {
    return href
  }
  if (href.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${href}`
  }
  try {
    return new URL(href, window.location.href).href
  } catch {
    return href
  }
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
    const href = toAbsoluteUrl(pdfUrl)
    const response = await fetch(href, { credentials: 'include' })
    if (!response.ok) throw new Error(`Could not fetch PDF (${response.status})`)
    return response.blob()
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
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** In-page toast + system notification bar (mobile browser). */
async function notifyDownloadComplete(fileName) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  showPdfAppToast(`Downloaded: ${safeName}`)

  if (typeof window === 'undefined' || typeof Notification === 'undefined') return

  try {
    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }
    if (permission !== 'granted') return

    const registration =
      typeof navigator !== 'undefined' && navigator.serviceWorker
        ? await navigator.serviceWorker.getRegistration().catch(() => null)
        : null

    if (registration?.showNotification) {
      await registration.showNotification('PDF downloaded', {
        body: `${safeName} saved to your device`,
        tag: `ga-pdf-${safeName}`,
        renotify: true,
      })
      return
    }

    // Fallback when no service worker — still appears in the notification shade on supported browsers.
    // eslint-disable-next-line no-new
    new Notification('PDF downloaded', {
      body: `${safeName} saved to your device`,
      tag: `ga-pdf-${safeName}`,
    })
  } catch (error) {
    console.warn('[pdf notify]', error)
  }
}

/**
 * Native Expo path for view OR download. Returns true when post started.
 */
async function sendViaNativeBridge({ dataUrl, blobUrl, pdfUrl, fileName, action }) {
  if (!isNativeAppView()) return false
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  const safeAction = action === 'download' ? 'download' : 'view'

  if (pdfUrl && typeof window.__gaPostPdfFromUrl === 'function') {
    const absolute = toAbsoluteUrl(pdfUrl)
    if (/^https?:\/\//i.test(absolute) || absolute.startsWith('blob:')) {
      const ok = window.__gaPostPdfFromUrl(safeAction, safeName, absolute)
      if (ok !== false) return true
    }
  }

  if (dataUrl && typeof window.__gaPostPdfPayload === 'function') {
    const ok = window.__gaPostPdfPayload(safeAction, safeName, dataUrl)
    if (ok !== false) return true
  }

  if (blobUrl && typeof window.__gaPostPdfFromBlobUrl === 'function') {
    const ok = window.__gaPostPdfFromBlobUrl(safeAction, safeName, blobUrl)
    if (ok !== false) return true
  }

  if (dataUrl) {
    const ok = await postPdfDataUrlToNative(safeAction, safeName, dataUrl)
    if (ok) return true
  }

  if (blobUrl) {
    const ok = await postPdfBlobToNativeApp(blobUrl, safeName, safeAction)
    if (ok) return true
  }

  if (pdfUrl) {
    const absolute = toAbsoluteUrl(pdfUrl)
    if (/^https?:\/\//i.test(absolute)) {
      const ok = await postPdfUrlToNativeApp(absolute, safeName, safeAction)
      if (ok) return true
    }
  }

  return false
}

/**
 * Browser download — no PDF viewer screen.
 */
export async function downloadPdfDirect({ dataUrl, blobUrl, pdfUrl, fileName } = {}) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'

  // Request notification permission early (still near the user tap) so the
  // system tray notice can show after the file save.
  if (
    !isNativeAppView() &&
    typeof Notification !== 'undefined' &&
    Notification.permission === 'default'
  ) {
    try {
      void Notification.requestPermission()
    } catch {
      // ignore
    }
  }

  const nativeOk = await sendViaNativeBridge({
    dataUrl,
    blobUrl,
    pdfUrl,
    fileName: safeName,
    action: 'download',
  })
  if (nativeOk) {
    showPdfAppToast('Saving PDF…')
    return true
  }

  try {
    const rawBlob = await resolveBlobFromSources({ dataUrl, blobUrl, pdfUrl })
    const blob = asPdfBlob(rawBlob)
    const objectUrl = URL.createObjectURL(blob)

    // Primary: blob download (Android Chrome registers this in the download / notification tray).
    clickDownloadAnchor(objectUrl, safeName)

    // iOS Safari often ignores download= — offer Share → Save to Files.
    if (isIosBrowser() && typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        const file = new File([blob], safeName, { type: 'application/pdf' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: safeName,
            text: 'Guardian Angel PDF',
          })
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
          await notifyDownloadComplete(safeName)
          return true
        }
      } catch (shareError) {
        if (shareError?.name === 'AbortError') {
          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
          return true
        }
      }
    }

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30000)
    await notifyDownloadComplete(safeName)
    return true
  } catch (error) {
    if (pdfUrl) {
      clickDownloadAnchor(toAbsoluteUrl(pdfUrl), safeName)
      await notifyDownloadComplete(safeName)
      return true
    }
    console.warn('[pdf download]', error)
    return false
  }
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
 * App: always native viewer (view) / native save (download).
 * Mobile web: in-page viewer / blob download + notification.
 */
export async function handlePdfUserAction({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' }) {
  if (action === 'download') {
    return downloadPdfDirect({ dataUrl, blobUrl, pdfUrl, fileName })
  }

  // View in the Expo shell → always native (Modal / system viewer).
  if (isNativeAppView()) {
    const ok = await sendViaNativeBridge({
      dataUrl,
      blobUrl,
      pdfUrl,
      fileName,
      action: 'view',
    })
    if (ok) return true
    // Last resort if inject helpers missing
    return postPdfUrlToNativeApp(toAbsoluteUrl(pdfUrl), fileName, 'view')
  }

  // Mobile browser: in-page viewer (Google Docs for public https PDFs).
  if (isMobileWebView()) {
    return openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName })
  }

  // Desktop: new tab
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
