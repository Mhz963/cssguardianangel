import rawPastPapers from './cssPastPapersData.json'

export const FPSC_CSS_PAST_PAPERS_SOURCE =
  'https://www.fpsc.gov.pk/Schedule?section=Previous%20Question%20Papers/CSS'

function formatPastPaperTitle(title) {
  return String(title || '')
    .replace(/&amp;/gi, '&')
    .replace(/\.pdf$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const cssPastPapersByYear = rawPastPapers.map((yearBlock) => ({
  year: yearBlock.year,
  sourceUrl: yearBlock.sourceUrl || FPSC_CSS_PAST_PAPERS_SOURCE,
  papers: yearBlock.papers.map((paper) => ({
    title: formatPastPaperTitle(paper.title),
    url: paper.url,
  })),
}))
