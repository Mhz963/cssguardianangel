import { openPdfAppViewer, showPdfAppToast } from './PdfAppExperience.jsx'

const PDF_CHUNK_SIZE = 6000

export function isNativeAppView() {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView?.postMessage)
}

/** Phone/tablet browser (Chrome/Safari mobile) — not desktop. */
export function isMobileBrowser() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (isNativeAppView()) return false
  const ua = navigator.userAgent || ''
  if (/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua)) return true
  try {
    if (window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches) return true
  } catch {
    // ignore
  }
  return false
}

/** App WebView or mobile browser. */
export function isMobilePdfClient() {
  return isNativeAppView() || isMobileBrowser()
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

function asPdfBlob(blob) {
  if (blob && typeof blob.type === 'string' && blob.type.includes('pdf')) return blob
  return new Blob([blob], { type: 'application/pdf' })
}

function clickDownloadAnchor(href, fileName) {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.setAttribute('download', fileName || 'Guardian_Angel_Report.pdf')
  anchor.rel = 'noopener noreferrer'
  // Mark so the native WebView bridge must not treat this as a "share" / view intercept.
  anchor.setAttribute('data-ga-pdf-download', '1')
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function toAbsoluteUrl(url) {
  if (!url) return ''
  try {
    return new URL(String(url), window.location.href).href
  } catch {
    return String(url)
  }
}

async function resolveBlob({ dataUrl, blobUrl, pdfUrl, url }) {
  const source = dataUrl || blobUrl || pdfUrl || url
  if (!source) throw new Error('No PDF source')
  const response = await fetch(source, {
    credentials: /^https?:\/\//i.test(String(source)) ? 'include' : 'same-origin',
  })
  if (!response.ok) throw new Error(`Could not fetch PDF (${response.status})`)
  return asPdfBlob(await response.blob())
}

/** Force a real file download. Never uses share — Save File picker when available, else &lt;a download&gt;. */
export async function downloadPdfBlobSources({ dataUrl, blobUrl, pdfUrl, url, fileName } = {}) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  const blob = await resolveBlob({ dataUrl, blobUrl, pdfUrl, url })

  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: safeName,
        types: [
          {
            description: 'PDF',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return true
    } catch (error) {
      if (error?.name === 'AbortError') return true
      // Fall through to anchor download
    }
  }

  const objectUrl = URL.createObjectURL(blob)
  clickDownloadAnchor(objectUrl, safeName)
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
  return true
}

export async function postPdfUrlToNativeApp(pdfUrl, fileName, action = 'view') {
  if (!pdfUrl || !isNativeAppView()) return false
  if (typeof window.__gaPostPdfFromUrl === 'function') {
    window.__gaPostPdfFromUrl(action, fileName, pdfUrl)
    return true
  }
  const href = toAbsoluteUrl(pdfUrl)
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
 * Vercel-only app WebView download (no Play Store / native rebuild).
 * Uses the same PDF-load path that previously made "View" save the file in the app WebView.
 * Does NOT call native postMessage download (that path needs a new app build).
 */
function downloadPdfInAppWebView({ dataUrl, blobUrl, pdfUrl, fileName }) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  const absolutePdf = pdfUrl ? toAbsoluteUrl(pdfUrl) : ''

  const loadPdfForWebViewSave = (src) => {
    if (!src) return false
    // Hidden frame: Android WebView typically downloads/opens PDFs when loaded this way
    // (same effect as the old in-page View path, without relying on native Intent/SAF).
    const iframe = document.createElement('iframe')
    iframe.setAttribute('title', safeName)
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText =
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;border:0;left:-9999px;top:-9999px'
    iframe.src = src
    document.body.appendChild(iframe)
    window.setTimeout(() => {
      try {
        iframe.remove()
      } catch {
        // ignore
      }
    }, 120000)
    return true
  }

  if (absolutePdf && /^https?:\/\//i.test(absolutePdf)) {
    if (loadPdfForWebViewSave(absolutePdf)) {
      showPdfAppToast('PDF download started')
      return true
    }
  }

  // Generated planner PDFs (blob / data URL): reuse the previous View open path.
  const opened = openPdfAppViewer({
    pdfUrl: absolutePdf || pdfUrl,
    blobUrl,
    dataUrl,
    fileName: safeName,
  })
  if (opened) {
    showPdfAppToast('PDF download started')
  }
  return opened
}

/** Mobile browser download: blob + &lt;a download&gt; only — never share / never open viewer. */
async function downloadPdfInMobileBrowser({ dataUrl, blobUrl, pdfUrl, fileName }) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  try {
    await downloadPdfBlobSources({
      dataUrl,
      blobUrl,
      pdfUrl: pdfUrl ? toAbsoluteUrl(pdfUrl) : pdfUrl,
      fileName: safeName,
    })
    showPdfAppToast('PDF download started')
    return true
  } catch (error) {
    showPdfAppToast(error?.message || 'Could not download PDF')
    return false
  }
}

/**
 * App WebView (Vercel site only — no new Play Store build) + mobile browser.
 *
 * App:
 * - Download → previous View behavior (WebView loads PDF → device saves/opens it)
 * - View → paused for now (viewer will be rebuilt next on the website)
 *
 * Mobile browser:
 * - View → in-page viewer
 * - Download → browser file download
 */
export async function sendPdfToNativeApp({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' } = {}) {
  if (!isMobilePdfClient()) return false

  if (isNativeAppView()) {
    if (action === 'download') {
      return downloadPdfInAppWebView({ dataUrl, blobUrl, pdfUrl, fileName })
    }
    // View PDF — do not download; proper in-app viewer comes next (Vercel-only).
    showPdfAppToast('PDF view coming soon — use Download PDF for now')
    return true
  }

  if (action === 'download') {
    return downloadPdfInMobileBrowser({ dataUrl, blobUrl, pdfUrl, fileName })
  }

  return openPdfAppViewer({
    pdfUrl,
    blobUrl,
    dataUrl,
    fileName,
  })
}

/** Unified PDF action for Key Documents / Planner (app + mobile web + desktop). */
export async function handlePdfAction({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' } = {}) {
  if (isMobilePdfClient()) {
    return sendPdfToNativeApp({ dataUrl, blobUrl, pdfUrl, fileName, action })
  }

  if (action === 'download') {
    await downloadPdfInBrowser(pdfUrl || blobUrl || dataUrl, fileName)
    return true
  }

  const openUrl = pdfUrl || blobUrl || dataUrl
  return openPdfInBrowser(openUrl)
}

export function openPdfInBrowser(url) {
  if (!url) return false
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  return Boolean(opened)
}

/** Desktop (and non-mobile) download: blob + download attribute only — no share. */
export async function downloadPdfInBrowser(url, fileName) {
  if (!url) return
  const safeName = fileName || 'Guardian_Angel_Report.pdf'

  try {
    await downloadPdfBlobSources({ url, fileName: safeName })
    return
  } catch {
    // Fall through to plain anchor (desktop / same-origin).
  }

  clickDownloadAnchor(url, safeName)
}
