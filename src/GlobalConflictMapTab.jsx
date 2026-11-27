import ConflictAtlas from './conflicts/ConflictAtlas.jsx'

/** Global Affairs > Map tab: the Guardian Conflict Atlas in compact form. */
export default function GlobalConflictMapTab() {
  return (
    <section className="global-map-shell">
      <ConflictAtlas compact />
    </section>
  )
}
