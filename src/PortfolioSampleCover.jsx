import { useEffect, useState } from 'react'
import PortfolioPdfCover from './PortfolioPdfCover.jsx'
import { extractDocxPreviewText, fileKindFromName } from './utils/docxPreview.js'

function hostnameFrom(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function DocumentPaperCover({ badge, title, lines, loading }) {
  return (
    <span className={`gp-doc-cover ${loading ? 'is-loading' : ''}`}>
      <span className="gp-doc-paper">
        <strong>{title || 'Document sample'}</strong>
        {loading ? <em className="gp-doc-lines">Loading preview…</em> : null}
        {!loading && lines.length
          ? lines.slice(0, 8).map((line) => <em key={line}>{line}</em>)
          : null}
        {!loading && !lines.length ? <em>Open this file to view the full document.</em> : null}
      </span>
      <i>{badge}</i>
    </span>
  )
}

function DocxCover({ fileUrl, title }) {
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fileUrl) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(fileUrl)
        if (!response.ok) throw new Error('Unable to read document')
        const text = await extractDocxPreviewText(await response.arrayBuffer())
        if (!cancelled) {
          setLines(text.split('\n').map((line) => line.trim()).filter(Boolean))
        }
      } catch {
        if (!cancelled) setLines([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fileUrl])

  return <DocumentPaperCover badge="DOCX" title={title} lines={lines} loading={loading} />
}

function OfficeEmbedCover({ fileUrl, title, badge }) {
  const [failed, setFailed] = useState(false)
  const src = fileUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`
    : ''

  if (!src || failed) {
    return <DocumentPaperCover badge={badge} title={title} lines={[]} loading={false} />
  }

  return (
    <span className="gp-office-cover">
      <iframe
        src={src}
        title={title || 'Document preview'}
        loading="lazy"
        onError={() => setFailed(true)}
      />
      <i>{badge}</i>
    </span>
  )
}

function LinkCover({ url, title }) {
  const host = hostnameFrom(url)
  return (
    <span className="gp-link-cover">
      <span className="gp-link-window">
        <b>{host || 'Website'}</b>
        <strong>{title || host || 'Open link'}</strong>
        <em>{url}</em>
      </span>
      <i>LINK</i>
    </span>
  )
}

export default function PortfolioSampleCover({ item }) {
  const kind = fileKindFromName(item?.fileMime, item?.fileName)
  const title = item?.title || item?.fileName || 'Work sample'

  if (kind === 'image' && item.fileUrl) {
    return <img src={item.fileUrl} alt={title} />
  }
  if (kind === 'pdf' && item.fileUrl) {
    return <PortfolioPdfCover fileUrl={item.fileUrl} title={title} />
  }
  if (kind === 'docx' && item.fileUrl) {
    return <DocxCover fileUrl={item.fileUrl} title={title} />
  }
  if ((kind === 'doc' || kind === 'pptx') && item.fileUrl) {
    return <OfficeEmbedCover fileUrl={item.fileUrl} title={title} badge={kind === 'pptx' ? 'PPTX' : 'DOC'} />
  }
  if (item.externalUrl) {
    return <LinkCover url={item.externalUrl} title={title} />
  }
  return <DocumentPaperCover badge="FILE" title={title} lines={[]} loading={false} />
}
