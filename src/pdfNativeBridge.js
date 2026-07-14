import { openPdfAppViewer, triggerPdfAppDownload } from './PdfAppExperience.jsx'

const PDF_CHUNK_SIZE = 6000

export function isNativeAppView() {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView?.postMessage)
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
  if (pdfUrl && /^https?:\/\//i.test(String(pdfUrl))) {
    const response = await fetch(String(pdfUrl), { credentials: 'include' })
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
  anchor.target = '_self'
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/**
 * Website-side download for app WebView (works after Vercel deploy, no Play Store update).
 */
export async function downloadPdfForAppWebView({ dataUrl, blobUrl, pdfUrl, fileName } = {}) {
  const safeName = fileName || 'Guardian_Angel_Report.pdf'

  try {
    const rawBlob = await resolveBlobFromSources({ dataUrl, blobUrl, pdfUrl })
    const blob = asPdfBlob(rawBlob)
    const file = new File([blob], safeName, { type: 'application/pdf' })

    // Best on Android Chrome WebView: system sheet → user picks "Save to Files" / Drive.
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function') {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: safeName,
            text: 'Guardian Angel PDF',
          })
          triggerPdfAppDownload({ message: 'Choose Save / Files to keep the PDF' })
          return true
        }
      } catch (shareError) {
        // User cancel should not count as failure.
        if (shareError?.name === 'AbortError') return true
      }
    }

    const objectUrl = URL.createObjectURL(blob)
    clickDownloadAnchor(objectUrl, safeName)
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 20000)
    triggerPdfAppDownload({ message: `${safeName} download started` })
    return true
  } catch (error) {
    // Last resort: open in viewer so user can still access the file.
    const opened = openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName: safeName })
    if (opened) {
      triggerPdfAppDownload({
        message: 'Download blocked by WebView — opened viewer instead',
      })
      return true
    }
    console.warn('[pdf download]', error)
    return false
  }
}

/** Hosted PDFs for optional native shells (kept for newer app builds). */
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
 * Primary entry used by the website.
 * In the app WebView: View = in-page modal; Download = Web Share / blob save.
 */
export async function sendPdfToNativeApp({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' }) {
  if (!isNativeAppView()) return false

  if (action === 'view') {
    return openPdfAppViewer({ pdfUrl, blobUrl, dataUrl, fileName })
  }

  return downloadPdfForAppWebView({ dataUrl, blobUrl, pdfUrl, fileName })
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
