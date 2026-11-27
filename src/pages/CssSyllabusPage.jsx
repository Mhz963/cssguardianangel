import VideoGuide from '../components/VideoGuide.jsx'
import { compulsorySubjects, optionalGroups, slugify } from '../data/syllabusData'
import { Link } from 'react-router-dom'

export default function CssSyllabusPage() {
  return (
    <main className="page-main">
      <section className="syllabus container" id="css-syllabus">
        <div className="section-title">
          <p>CSS Syllabus</p>
          <h2>Compulsory and Optional Subjects</h2>
        </div>

        <VideoGuide
          id="library-guide"
          src="/media/resource-library-tutorial.mp4"
          poster="/media/resource-library-tutorial-poster.webp"
          title="Everything for CSS in one place: a 1-minute library tour"
          duration="1 min"
        >
          The CSS Rules, the full syllabus, lecture slides, past papers by year and the Source Vault, and how they fit together.
        </VideoGuide>

        <article className="syllabus-block">
          <h3>Compulsory Subjects Syllabus</h3>
          <ul className="syllabus-list syllabus-list-links">
            {compulsorySubjects.map((subject) => (
              <li key={subject}>
                <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
              </li>
            ))}
          </ul>
        </article>

        <div className="optional-groups">
          {optionalGroups.map((item) => (
            <article className="group-card" key={item.group}>
              <h3>{item.group}</h3>
              <p className="group-rule">{item.rules}</p>
              <ul className="syllabus-list syllabus-list-links">
                {item.subjects.map((subject) => (
                  <li key={subject}>
                    <Link to={`/css-syllabus/${slugify(subject)}`}>{subject}</Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

      </section>
    </main>
  )
}
