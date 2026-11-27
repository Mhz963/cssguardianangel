import { lazy, Suspense } from 'react'
import VideoGuide from '../components/VideoGuide.jsx'

const ConflictAtlas = lazy(() => import('../conflicts/ConflictAtlas.jsx'))

export default function ConflictAtlasPage() {
  return (
    <main className="page-main" id="main-content">
      <section className="container">
        <div className="section-title">
          <p>Guardian Angel Resources</p>
          <h2>Guardian Conflict Atlas</h2>
        </div>
        <p className="ca-lead">
          Every ongoing armed conflict on one map, centred on Pakistan. Drag and zoom to explore, press{' '}
          <strong>View conflicts</strong>, then tap a red point for the sides involved, when it began, casualties, a summary and
          the latest headlines, each with its source.
        </p>
        <VideoGuide
          id="atlas-guide"
          src="/media/conflict-atlas-tutorial.mp4"
          poster="/media/conflict-atlas-tutorial-poster.webp"
          title="Every war that matters for CSS, on one map"
          duration="1 min"
        >
          Show every ongoing conflict, filter by intensity, and open any one for its dates, sides, casualties, latest news
          and sources.
        </VideoGuide>
        <Suspense fallback={<p className="ca-lead">Loading the map…</p>}>
          <ConflictAtlas />
        </Suspense>
      </section>
    </main>
  )
}
