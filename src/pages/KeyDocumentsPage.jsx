import { handlePdfAction } from '../pdfNativeBridge.js'

export default function KeyDocumentsPage() {
  const constitutionPdfUrl = new URL('../../data/Constitution of Pakistan.pdf', import.meta.url).href
  const udhrPdfUrl = new URL('../../data/UDHR.pdf', import.meta.url).href
  const unCharterPdfUrl = new URL('../../data/UN Charter.pdf', import.meta.url).href
  const handleDocumentPdfAction = async (event, doc, action) => {
    event.preventDefault()
    event.stopPropagation()
    await handlePdfAction({
      pdfUrl: doc.url,
      fileName: doc.fileName,
      action,
    })
  }
  const pakistanDocuments = [
    {
      title: 'Constitution of Pakistan',
      summary: 'Primary constitutional text for governance, rights, and state structure references.',
      url: constitutionPdfUrl,
      fileName: 'Constitution of Pakistan.pdf',
    },
  ]
  const internationalDocuments = [
    {
      title: 'Universal Declaration of Human Rights (UDHR)',
      summary: 'Foundational global human-rights framework useful for essay and international law context.',
      url: udhrPdfUrl,
      fileName: 'UDHR.pdf',
    },
    {
      title: 'United Nations Charter',
      summary: 'Core charter for UN principles, collective security, and state cooperation.',
      url: unCharterPdfUrl,
      fileName: 'UN Charter.pdf',
    },
  ]
  const internationalReferenceCategories = [
    {
      category: 'Law, Justice, and Human Rights',
      links: [
        { label: 'UN Treaty Collection', url: 'https://treaties.un.org/' },
        { label: 'UN Digital Library', url: 'https://digitallibrary.un.org/' },
        { label: 'International Court of Justice (ICJ)', url: 'https://www.icj-cij.org/' },
        { label: 'OHCHR (UN Human Rights)', url: 'https://www.ohchr.org/' },
        { label: 'UNHCR', url: 'https://www.unhcr.org/' },
      ],
    },
    {
      category: 'Security, Terrorism, and Policing',
      links: [
        { label: 'UN Security Council Resolutions', url: 'https://www.un.org/securitycouncil/content/resolutions' },
        { label: 'UNODC (Crime, Terrorism, Justice)', url: 'https://www.unodc.org/' },
        { label: 'UN Counter-Terrorism Office', url: 'https://www.un.org/counterterrorism/' },
        { label: 'FATF', url: 'https://www.fatf-gafi.org/' },
        { label: 'Interpol', url: 'https://www.interpol.int/' },
      ],
    },
    {
      category: 'Gender and Inclusion',
      links: [
        { label: 'UN Women', url: 'https://www.unwomen.org/' },
        { label: 'UN Commission on the Status of Women (CSW)', url: 'https://www.unwomen.org/en/csw' },
        { label: 'CEDAW (OHCHR)', url: 'https://www.ohchr.org/en/treaty-bodies/cedaw' },
        { label: 'UN SDG 5: Gender Equality', url: 'https://sdgs.un.org/goals/goal5' },
      ],
    },
    {
      category: 'Technology, Cybersecurity, and AI',
      links: [
        { label: 'Council of Europe Cybercrime (Budapest Convention)', url: 'https://www.coe.int/en/web/cybercrime' },
        { label: 'NATO Cyber Defence', url: 'https://www.nato.int/cps/en/natohq/topics_78170.htm' },
        { label: 'OECD AI Policy Observatory', url: 'https://oecd.ai/' },
        { label: 'Global Partnership on AI (GPAI)', url: 'https://gpai.ai/' },
      ],
    },
    {
      category: 'Nuclear and Strategic',
      links: [{ label: 'IAEA', url: 'https://www.iaea.org/' }],
    },
  ]
  const pakistanReferenceCategories = [
    {
      category: 'Law and Justice',
      links: [
        { label: 'Ministry of Law and Justice', url: 'https://www.molaw.gov.pk/' },
        { label: 'Law and Justice Commission of Pakistan', url: 'https://ljcp.gov.pk/' },
        { label: 'Supreme Court of Pakistan', url: 'https://www.supremecourt.gov.pk/' },
        { label: 'National Judicial (Policy Making) Committee', url: 'https://njpmc.punjab.gov.pk/' },
      ],
    },
    {
      category: 'Security, Terrorism, and Policing',
      links: [
        { label: 'National Counter Terrorism Authority (NACTA)', url: 'https://nacta.gov.pk/' },
        { label: 'National Action Plan (NACTA)', url: 'https://nacta.gov.pk/nap-2014/' },
        { label: 'Ministry of Interior', url: 'https://www.interior.gov.pk/' },
        { label: 'National Police Bureau', url: 'https://npb.gov.pk/' },
        { label: 'FIA', url: 'https://fia.gov.pk/' },
        { label: 'NADRA', url: 'https://www.nadra.gov.pk/' },
        { label: 'Ministry of Defence', url: 'https://www.mod.gov.pk/' },
      ],
    },
    {
      category: 'Gender and Human Rights',
      links: [
        { label: 'Ministry of Human Rights', url: 'https://mohr.gov.pk/' },
        { label: 'National Commission on the Status of Women (NCSW)', url: 'https://www.ncsw.gov.pk/' },
      ],
    },
    {
      category: 'Technology, Cybersecurity, and AI',
      links: [
        { label: 'Ministry of IT and Telecom', url: 'https://moitt.gov.pk/' },
        { label: 'National CERT (PKCERT)', url: 'https://pkcert.gov.pk/' },
        { label: 'National Cyber Crime Investigation Agency (NCCIA)', url: 'https://nccia.gov.pk/' },
        { label: 'Pakistan Telecommunication Authority (PTA)', url: 'https://www.pta.gov.pk/' },
        { label: 'National Center of Artificial Intelligence (NCAI)', url: 'https://ncai.pk/' },
      ],
    },
    {
      category: 'Nuclear and Strategic',
      links: [
        { label: 'Strategic Plans Division (SPD) / NCA context', url: 'https://www.ispr.gov.pk/' },
        { label: 'Pakistan Nuclear Regulatory Authority (PNRA)', url: 'https://www.pnra.org/' },
        { label: 'Pakistan Atomic Energy Commission (PAEC)', url: 'https://www.paec.gov.pk/' },
      ],
    },
    {
      category: 'Governance, Economy, and Environment',
      links: [
        { label: 'Ministry of Planning, Development & Special Initiatives', url: 'https://www.pc.gov.pk/' },
        { label: 'Economic Affairs Division', url: 'https://www.ead.gov.pk/' },
        { label: 'Pakistan Bureau of Statistics (PBS)', url: 'https://www.pbs.gov.pk/' },
        { label: 'State Bank of Pakistan (SBP)', url: 'https://www.sbp.org.pk/' },
        { label: 'Ministry of Climate Change & Environmental Coordination', url: 'https://mocc.gov.pk/' },
      ],
    },
  ]

  return (
    <main className="page-main">
      <section className="container css-rules-page constitution-page">
        <div className="section-title">
          <p>CSS Resource Library</p>
          <h2>Key Documents</h2>
        </div>
        <p className="rules-source key-documents-mantra">
          <span className="guardian-highlight-word-green">
            Study from authentic documents, build strong arguments, and think like a future officer
          </span>
        </p>

        <article className="constitution-resource-card">
          <h3>Pakistan Key Documents</h3>
          <p>Start with Pakistan-focused primary documents for stronger constitutional and governance arguments.</p>
          <div className="constitution-docs-grid">
            {pakistanDocuments.map((doc) => (
              <article key={doc.title} className="constitution-doc-item">
                <h4>{doc.title}</h4>
                <p>{doc.summary}</p>
                <div className="constitution-resource-actions">
                  <a
                    className="btn btn-primary"
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    data-ga-pdf-url={doc.url}
                    data-ga-pdf-name={doc.fileName}
                    onClick={(event) => handleDocumentPdfAction(event, doc, 'view')}
                  >
                    View PDF
                  </a>
                  <a
                    className="btn btn-secondary"
                    href={doc.url}
                    download={doc.fileName}
                    data-ga-pdf-url={doc.url}
                    data-ga-pdf-name={doc.fileName}
                    onClick={(event) => handleDocumentPdfAction(event, doc, 'download')}
                  >
                    Download PDF
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="constitution-reference-links">
            <h4>Pakistan Government and Key Department Links</h4>
            {pakistanReferenceCategories.map((group) => (
              <div key={group.category} className="constitution-link-category">
                <h5>{group.category}</h5>
                <ul className="syllabus-list syllabus-list-links">
                  {group.links.map((item) => (
                    <li key={item.url}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>

        <article className="constitution-resource-card">
          <h3>International Affairs Documents</h3>
          <p>
            Use these global documents to support arguments in current affairs, international law, and comparative
            analysis.
          </p>
          <div className="constitution-docs-grid">
            {internationalDocuments.map((doc) => (
              <article key={doc.title} className="constitution-doc-item">
                <h4>{doc.title}</h4>
                <p>{doc.summary}</p>
                <div className="constitution-resource-actions">
                  <a
                    className="btn btn-primary"
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    data-ga-pdf-url={doc.url}
                    data-ga-pdf-name={doc.fileName}
                    onClick={(event) => handleDocumentPdfAction(event, doc, 'view')}
                  >
                    View PDF
                  </a>
                  <a
                    className="btn btn-secondary"
                    href={doc.url}
                    download={doc.fileName}
                    data-ga-pdf-url={doc.url}
                    data-ga-pdf-name={doc.fileName}
                    onClick={(event) => handleDocumentPdfAction(event, doc, 'download')}
                  >
                    Download PDF
                  </a>
                </div>
              </article>
            ))}
          </div>
          <div className="constitution-reference-links">
            <h4>Important Global Reference Links</h4>
            {internationalReferenceCategories.map((group) => (
              <div key={group.category} className="constitution-link-category">
                <h5>{group.category}</h5>
                <ul className="syllabus-list syllabus-list-links">
                  {group.links.map((item) => (
                    <li key={item.url}>
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}
