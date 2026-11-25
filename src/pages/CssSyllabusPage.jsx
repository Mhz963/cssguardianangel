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
