async function inflateRaw(bytes) {
  if (typeof DecompressionStream !== 'function') return new Uint8Array()
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function readZipEntry(bytes, targetName) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const decoder = new TextDecoder()
  let offset = 0

  while (offset + 30 <= bytes.length) {
    if (view.getUint32(offset, true) !== 0x04034b50) break
    const flag = view.getUint16(offset + 6, true)
    const method = view.getUint16(offset + 8, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)
    const nameStart = offset + 30
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength))
    const dataStart = nameStart + nameLength + extraLength
    if (flag & 8 || dataStart + compressedSize > bytes.length) break
    if (name === targetName) {
      return { method, data: bytes.subarray(dataStart, dataStart + compressedSize) }
    }
    offset = dataStart + compressedSize
  }
  return null
}

function xmlToPlainText(xml) {
  return String(xml || '')
    .replace(/<w:tab\b[^>]*\/>/g, ' ')
    .replace(/<w:br\b[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractDocxPreviewText(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  const entry = readZipEntry(bytes, 'word/document.xml')
  if (!entry) return ''
  const xmlBytes = entry.method === 0 ? entry.data : await inflateRaw(entry.data)
  return xmlToPlainText(new TextDecoder().decode(xmlBytes))
}

export function fileKindFromName(mime = '', fileName = '') {
  const name = String(fileName || '').toLowerCase()
  const type = String(mime || '').toLowerCase()
  if (type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/.test(name)) return 'image'
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx') || type.includes('wordprocessingml')) return 'docx'
  if (name.endsWith('.doc') || type.includes('msword')) return 'doc'
  if (name.endsWith('.pptx') || type.includes('presentationml')) return 'pptx'
  return 'file'
}
