const PDF_CHUNK_SIZE = 20000
const PDF_CHUNK_DELAY_MS = 50

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

export async function postPdfDataUrlToNative(action, fileName, dataUrl) {
  if (!isNativeAppView() || !dataUrl) return false
  const safeAction = action || 'view'
  const safeFileName = fileName || 'Guardian_Angel_Report.pdf'
  const content = String(dataUrl)
  const total = Math.ceil(content.length / PDF_CHUNK_SIZE)

  if (total <= 1) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'ga_pdf_blob',
        action: safeAction,
        fileName: safeFileName,
        dataUrl: content,
      }),
    )
    return true
  }

  const streamId = `ga_pdf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  window.ReactNativeWebView.postMessage(
    JSON.stringify({
      type: 'ga_pdf_chunk_start',
      id: streamId,
      action: safeAction,
      fileName: safeFileName,
      total,
    }),
  )
  for (let index = 0; index < total; index += 1) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'ga_pdf_chunk',
        id: streamId,
        index,
        total,
        chunk: content.slice(index * PDF_CHUNK_SIZE, (index + 1) * PDF_CHUNK_SIZE),
      }),
    )
    await sleep(PDF_CHUNK_DELAY_MS)
  }
  await sleep(PDF_CHUNK_DELAY_MS)
  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ga_pdf_chunk_end', id: streamId }))
  return true
}

export async function postPdfBlobToNativeApp(blobUrl, fileName, action = 'view') {
  if (!blobUrl || !isNativeAppView()) return false
  try {
    const response = await fetch(blobUrl)
    if (!response.ok) return false
    const blob = await response.blob()
    const dataUrl = await fileToDataUrl(blob)
    return postPdfDataUrlToNative(action, fileName, dataUrl)
  } catch {
    return false
  }
}

export async function postPdfUrlToNativeApp(pdfUrl, fileName, action = 'view') {
  if (!pdfUrl || !isNativeAppView()) return false
  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) return false
    const blob = await response.blob()
    const dataUrl = await fileToDataUrl(blob)
    return postPdfDataUrlToNative(action, fileName, dataUrl)
  } catch {
    return false
  }
}

export async function sendPdfToNativeApp({ dataUrl, blobUrl, pdfUrl, fileName, action = 'view' }) {
  if (!isNativeAppView()) return false
  if (dataUrl) {
    return postPdfDataUrlToNative(action, fileName, dataUrl)
  }
  if (blobUrl) {
    return postPdfBlobToNativeApp(blobUrl, fileName, action)
  }
  if (pdfUrl) {
    return postPdfUrlToNativeApp(pdfUrl, fileName, action)
  }
  return false
}

export function openPdfInBrowser(url) {
  if (!url) return false
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  return Boolean(opened)
}

export function downloadPdfInBrowser(url, fileName) {
  if (!url) return
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'Guardian_Angel_Report.pdf'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
