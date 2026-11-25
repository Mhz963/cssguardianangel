import { Link, useParams } from 'react-router-dom'
import { detailedSubjectPages } from '../data/subjectPagesData.js'

export default function SubjectDetailPage() {
  const { subjectSlug } = useParams()
  const slugAliases = {
    'english-precis-composition': 'english',
    gsa: 'general-science-ability',
    'islamic-studies': 'islamiat',
    'comparative-religions': 'comparative-study-of-major-religions',
  }

  const resolvedSlug = slugAliases[subjectSlug] ?? subjectSlug
  const subject = detailedSubjectPages.find(
    (item) => item.slug === resolvedSlug || item.sourceSlug === resolvedSlug,
  )

  if (!subject) {
    return (
      <main className="page-main">
        <section className="container subject-page">
          <h1>Subject not found</h1>
          <p>Please return to the syllabus page and choose a listed subject.</p>
          <Link className="btn btn-primary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-main">
      <section className="container subject-page">
        <p className="kicker">Detailed CSS Subject Page</p>
        <h1>{subject.title}</h1>
        <div className="subject-meta-grid">
          <article className="subject-meta-card">
            <h3>Marks</h3>
            <p>{subject.marks}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Category</h3>
            <p>{subject.category}</p>
          </article>
          <article className="subject-meta-card">
            <h3>Group</h3>
            <p>{subject.group}</p>
          </article>
        </div>

        <article className="subject-outline">
          <h2>Course Outline</h2>
          {subject.outlineImages?.length > 0 ? (
            <div className="outline-images">
              {subject.outlineImages.map((imagePath) => (
                <img key={imagePath} src={imagePath} alt={`${subject.title} course outline`} />
              ))}
            </div>
          ) : subject.outlineSections?.length > 0 ? (
            <div className="outline-sections">
              {subject.outlineSections.map((section) => (
                <section className="outline-section" key={section.heading}>
                  <h3>{section.heading}</h3>
                  {section.points?.length > 0 ? (
                    <ul>
                      {section.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          ) : subject.outline.length > 0 ? (
            <ul>
              {subject.outline.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : (
            <p>Detailed outline is not available yet for this subject.</p>
          )}
        </article>

        <div className="subject-actions">
          <Link className="btn btn-secondary" to="/css-syllabus">
            Back to CSS Syllabus
          </Link>
        </div>
      </section>
    </main>
  )
}
