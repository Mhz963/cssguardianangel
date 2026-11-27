import { lazy, Suspense } from 'react'

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
        <Suspense fallback={<p className="ca-lead">Loading the map…</p>}>
          <ConflictAtlas />
        </Suspense>
      </section>
    </main>
  )
}
