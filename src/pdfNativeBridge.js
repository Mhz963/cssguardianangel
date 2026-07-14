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

/** App WebView or mobile browser — use mobile PDF UX. */
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

/** Optional native shell hooks (newer apps). */
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

/** App download only: native share/save — no intermediate web screen. */
async function downloadPdfInNativeApp({ dataUrl, blobUrl, pdfUrl, fileName }) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  const absolutePdf = pdfUrl ? toAbsoluteUrl(pdfUrl) : ''

  if (absolutePdf && /^https?:\/\//i.test(absolutePdf)) {
    if (await postPdfUrlToNativeApp(absolutePdf, safeName, 'download')) return true
  }
  if (blobUrl && (await postPdfBlobToNativeApp(blobUrl, safeName, 'download'))) return true
  if (dataUrl && (await postPdfDataUrlToNative('download', safeName, dataUrl))) return true
  return false
}

/**
 * Mobile browser download:
 * - https PDFs: system share sheet from the tap (no middle screen)
 * - generated blobs: in-page viewer + Save PDF (needs a fresh tap after fetch)
 */
async function downloadPdfInMobileBrowser({ dataUrl, blobUrl, pdfUrl, fileName }) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'
  const absolutePdf = pdfUrl ? toAbsoluteUrl(pdfUrl) : ''

  if (absolutePdf && /^https?:\/\//i.test(absolutePdf) && typeof navigator?.share === 'function') {
    try {
      await navigator.share({
        url: absolutePdf,
        title: safeName,
        text: 'Guardian Angel PDF',
      })
      return true
    } catch (error) {
      if (error?.name === 'AbortError') return true
      // Fall through to viewer + Save PDF
    }
  }

  const opened = openPdfAppViewer({
    pdfUrl: absolutePdf || pdfUrl,
    blobUrl,
    dataUrl,
    fileName: safeName,
    mode: 'download',
  })
  if (opened) {
    showPdfAppToast('Tap Save PDF to download on your phone')
  }
  return opened
}

/**
 * App WebView + mobile browser routing.
 * View → in-page viewer
 * Download (app) → native save only
 * Download (mobile web) → share sheet or viewer Save PDF
 */
export async function sendPdfToNativeApp({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' } = {}) {
  if (!isMobilePdfClient()) return false

  if (action === 'download') {
    if (isNativeAppView()) {
      return downloadPdfInNativeApp({ dataUrl, blobUrl, pdfUrl, fileName })
    }
    return downloadPdfInMobileBrowser({ dataUrl, blobUrl, pdfUrl, fileName })
  }

  return openPdfAppViewer({
    pdfUrl,
    blobUrl,
    dataUrl,
    fileName,
    mode: 'view',
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

/**
 * Desktop: blob download. Mobile fallback when viewer isn't used: Web Share → blob link.
 */
export async function downloadPdfInBrowser(url, fileName) {
  if (!url) return
  const safeName = fileName || 'Guardian_Angel_Report.pdf'

  try {
    const blob = await resolveBlob({ url })
    const file = new File([blob], safeName, { type: 'application/pdf' })

    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: safeName, text: 'Guardian Angel PDF' })
          return
        }
      } catch (error) {
        if (error?.name === 'AbortError') return
      }
    }

    const objectUrl = URL.createObjectURL(blob)
    clickDownloadAnchor(objectUrl, safeName)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
    return
  } catch {
    // Fall through to plain anchor (desktop / same-origin).
  }

  clickDownloadAnchor(url, safeName)
}
