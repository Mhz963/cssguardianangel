import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

export default function PortfolioPdfCover({ fileUrl, title }) {
  const canvasRef = useRef(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!fileUrl) {
      setStatus('error')
      return undefined
    }

    let cancelled = false
    let loadingTask

    const renderCover = async () => {
      setStatus('loading')
      try {
        loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          withCredentials: false,
        })
        const pdf = await loadingTask.promise
        if (cancelled) return
        const page = await pdf.getPage(1)
        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext('2d', { alpha: false })
        const base = page.getViewport({ scale: 1 })
        const scale = 520 / base.width
        const viewport = page.getViewport({ scale })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        await page.render({ canvasContext: context, viewport }).promise
        if (!cancelled) setStatus('ready')
      } catch {
        if (!cancelled) setStatus('error')
      }
    }

    renderCover()
    return () => {
      cancelled = true
      loadingTask?.destroy?.()
    }
  }, [fileUrl])

  return (
    <span className={`gp-pdf-cover is-${status}`}>
      <canvas ref={canvasRef} aria-hidden={status !== 'ready'} />
      {status !== 'ready' ? (
        <span className="gp-pdf-cover-fallback">
          {status === 'loading' ? 'Loading preview…' : title || 'PDF sample'}
        </span>
      ) : null}
      <em>PDF</em>
    </span>
  )
}
