import { isPlaceholder } from './resumeEngine.js'

const BLUE = [0, 111, 192]
const BLACK = [0, 0, 0]
const LINK = [0, 0, 255]

function wrapLines(doc, text, maxWidth) {
  return doc.splitTextToSize(String(text || ''), maxWidth)
}

function contactLine(header) {
  return [header.city, header.phone, header.email]
    .map((item) => String(item || '').trim())
    .filter((item) => item && !isPlaceholder(item))
    .join(' | ')
}

function ensureSpace(doc, y, needed, pageBottom, contentStartY) {
  if (y + needed <= pageBottom) return y
  doc.addPage()
  return contentStartY
}

function addSectionHeading(doc, title, x, y, maxWidth) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...BLUE)
  doc.text(title.toUpperCase(), x, y)
  return y + 16
}

function writeWrapped(doc, text, x, y, maxWidth, pageBottom, contentStartY, color = BLACK) {
  doc.setTextColor(...color)
  const lines = wrapLines(doc, text, maxWidth)
  lines.forEach((line) => {
    y = ensureSpace(doc, y, 14, pageBottom, contentStartY)
    doc.text(line, x, y)
    y += 13
  })
  return y
}

function writeBullet(doc, text, x, y, maxWidth, pageBottom, contentStartY) {
  const lines = wrapLines(doc, text, maxWidth - 14)
  lines.forEach((line, index) => {
    y = ensureSpace(doc, y, 14, pageBottom, contentStartY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...BLACK)
    doc.text(index === 0 ? `•  ${line}` : `    ${line}`, x, y)
    y += 13
  })
  return y
}

function looksLikeUrl(value) {
  return /^(https?:\/\/|www\.|linkedin\.com|github\.com|upwork\.com)/i.test(String(value || '').trim())
}

export async function buildAtsResumePdf(resume) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 85
  const maxWidth = pageWidth - marginX * 2
  const pageBottom = pageHeight - 46
  const contentStartY = 52
  let y = contentStartY

  const header = resume?.header || {}
  if (header.name) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(header.name.length > 22 ? 28 : 36)
    doc.setTextColor(...BLUE)
    wrapLines(doc, header.name, maxWidth).forEach((line) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' })
      y += header.name.length > 22 ? 30 : 36
    })
    y += 2
  }

  const contacts = contactLine(header)
  if (contacts) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...BLACK)
    wrapLines(doc, contacts, maxWidth).forEach((line) => {
      const email = header.email
      if (email && line.includes(email)) {
        const before = line.slice(0, line.indexOf(email))
        const after = line.slice(line.indexOf(email) + email.length)
        const startX = (pageWidth - doc.getTextWidth(line)) / 2
        doc.setTextColor(...BLACK)
        doc.text(before, startX, y)
        doc.setTextColor(...LINK)
        doc.text(email, startX + doc.getTextWidth(before), y)
        doc.setTextColor(...BLACK)
        doc.text(after, startX + doc.getTextWidth(before + email), y)
      } else {
        doc.setTextColor(...BLACK)
        doc.text(line, pageWidth / 2, y, { align: 'center' })
      }
      y += 14
    })
  }

  y += 10

  const links = resume?.links || []
  if (links.length) {
    y = ensureSpace(doc, y, 28, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Professional Links', marginX, y, maxWidth)
    links.forEach((item) => {
      y = ensureSpace(doc, y, 14, pageBottom, contentStartY)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(...BLACK)
      const label = `${item.label}: `
      doc.text(label, marginX, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...(looksLikeUrl(item.url) ? LINK : BLACK))
      const urlLines = wrapLines(doc, item.url, maxWidth - doc.getTextWidth(label))
      urlLines.forEach((line, index) => {
        if (index === 0) {
          doc.text(line, marginX + doc.getTextWidth(label), y)
        } else {
          y += 13
          doc.text(line, marginX, y)
        }
      })
      y += 15
    })
    y += 6
  }

  if (resume?.summary) {
    y = ensureSpace(doc, y, 32, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Career Objective', marginX, y, maxWidth)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    y = writeWrapped(doc, resume.summary, marginX, y, maxWidth, pageBottom, contentStartY)
    y += 10
  }

  if (resume?.skills?.length) {
    y = ensureSpace(doc, y, 32, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Technical Skills', marginX, y, maxWidth)
    resume.skills.forEach((skill) => {
      y = writeBullet(doc, skill, marginX, y, maxWidth, pageBottom, contentStartY)
    })
    y += 10
  }

  if (resume?.experience?.length) {
    y = ensureSpace(doc, y, 36, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Professional Experience', marginX, y, maxWidth)
    resume.experience.forEach((job) => {
      const heading = [job.title, job.organization, job.dates].filter(Boolean).join(' | ')
      if (heading) {
        y = ensureSpace(doc, y, 18, pageBottom, contentStartY)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        y = writeWrapped(doc, heading, marginX, y, maxWidth, pageBottom, contentStartY)
      }
      if (job.location && !heading.includes(job.location)) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        y = writeWrapped(doc, job.location, marginX, y, maxWidth, pageBottom, contentStartY)
      }
      doc.setFont('helvetica', 'normal')
      ;(job.bullets || []).forEach((bullet) => {
        y = writeBullet(doc, bullet, marginX, y, maxWidth, pageBottom, contentStartY)
      })
      y += 8
    })
    y += 4
  }

  if (resume?.projects?.length) {
    y = ensureSpace(doc, y, 36, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Professional Projects', marginX, y, maxWidth)
    resume.projects.forEach((project, index) => {
      y = ensureSpace(doc, y, 16, pageBottom, contentStartY)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      y = writeWrapped(doc, `${index + 1}. ${project.name}`, marginX, y, maxWidth, pageBottom, contentStartY)
      doc.setFont('helvetica', 'normal')
      ;(project.bullets || []).forEach((bullet) => {
        y = writeBullet(doc, bullet, marginX, y, maxWidth, pageBottom, contentStartY)
      })
      y += 6
    })
    y += 4
  }

  if (resume?.education?.length) {
    y = ensureSpace(doc, y, 36, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Educational Background', marginX, y, maxWidth)
    resume.education.forEach((item) => {
      const degreeLine = [item.degree, item.field, item.dates].filter(Boolean).join(' | ')
      if (degreeLine) {
        y = writeBullet(doc, degreeLine, marginX, y, maxWidth, pageBottom, contentStartY)
      }
      if (item.school) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        y = writeWrapped(doc, item.school, marginX + 14, y, maxWidth - 14, pageBottom, contentStartY)
      }
      if (item.details) {
        y = writeWrapped(doc, item.details, marginX + 14, y, maxWidth - 14, pageBottom, contentStartY)
      }
      y += 4
    })
    y += 6
  }

  if (resume?.certifications?.length) {
    y = ensureSpace(doc, y, 32, pageBottom, contentStartY)
    y = addSectionHeading(doc, 'Certifications', marginX, y, maxWidth)
    resume.certifications.forEach((item) => {
      const line = [item.name, item.issuer, item.year].filter(Boolean).join(' | ')
      if (line) y = writeBullet(doc, line, marginX, y, maxWidth, pageBottom, contentStartY)
    })
  }

  const safeName = String(header.name || 'Candidate')
    .replace(/[^\w]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
  return {
    dataUrl: doc.output('datauristring'),
    blobUrl: doc.output('bloburl'),
    fileName: `Guardian_Angel_Resume_${safeName || 'Candidate'}.pdf`,
  }
}
