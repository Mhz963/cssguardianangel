import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import { GeoJSON, MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import '../styles/conflicts.css'
import { createVectorLayer, loadStyle, webglAvailable } from './vectorBase.js'

const PAKISTAN = [30.4, 69.3]
const TIERS = [
  { id: 'Major war', label: 'Major wars', hint: '10,000+ deaths a year' },
  { id: 'Minor war', label: 'Minor wars', hint: '1,000–9,999 deaths a year' },
  { id: 'Conflict', label: 'Conflicts', hint: '100–999 deaths a year' },
  { id: 'Skirmishes and clashes', label: 'Skirmishes', hint: 'Under 100 deaths a year' },
]
// The map is drawn from Natural Earth outlines (public domain): no tile provider, no key and no
// baked-in labels, so country names are our own (Israel is shown as Occupied Palestine).
const MAP_ATTRIBUTION = 'Map data: <a href="https://www.naturalearthdata.com/">Natural Earth</a>'
const PALETTE = {
  dark: { land: '#1c2233', border: '#3a4560', home: '#3b3216', homeBorder: '#c9a227', pal: '#173828', palBorder: '#2f9e62' },
  light: { land: '#f4f1ea', border: '#b9c2cf', home: '#f6e7b0', homeBorder: '#c9a227', pal: '#d7efdf', palBorder: '#2f9e62' },
}

function countryStyle(theme) {
  const c = PALETTE[theme]
  return (feature) => {
    const n = feature.properties.n
    if (n === 'Pakistan') return { color: c.homeBorder, weight: 1.4, fillColor: c.home, fillOpacity: 1 }
    if (n === 'Occupied Palestine') return { color: c.palBorder, weight: 1.2, fillColor: c.pal, fillOpacity: 1 }
    return { color: c.border, weight: 0.7, fillColor: c.land, fillOpacity: 1 }
  }
}

function useTheme() {
  const read = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
  const [theme, setTheme] = useState(read)
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(read()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return theme
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const labelIcon = (text, extra = '') =>
  L.divIcon({ className: `ca-label ${extra}`, html: `<span>${text}</span>`, iconSize: null })

const conflictIcon = (tier, active) =>
  L.divIcon({
    className: `ca-dot ca-dot-${tier} ${active ? 'is-active' : ''}`,
    html: '<span class="ca-dot-pulse"></span><span class="ca-dot-core"></span>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

function ZoomWatcher({ onZoom }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) })
  return null
}

/** Detailed vector basemap (cities, regions, roads). Falls back to the outline map if it cannot load. */
function VectorBase({ theme, onStatus }) {
  const map = useMap()
  useEffect(() => {
    if (!webglAvailable()) {
      onStatus('failed')
      return undefined
    }
    let layer = null
    let cancelled = false
    loadStyle(theme)
      .then((style) => {
        if (cancelled) return
        layer = createVectorLayer(style).addTo(map)
        onStatus('ready')
      })
      .catch(() => {
        if (!cancelled) onStatus('failed')
      })
    return () => {
      cancelled = true
      if (layer) map.removeLayer(layer)
    }
  }, [map, theme, onStatus])
  return null
}

function MapHandle({ onReady }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
    if (import.meta.env.DEV) window.__conflictMap = map // handy for local testing only
  }, [map, onReady])
  return null
}

function CountryLabels({ countries, zoom }) {
  return countries
    .filter((c) => !c.hideLabel && (zoom >= Math.max(2, c.minZoom - 0.3) || c.label === "Pakistan" || c.label === "Occupied Palestine"))
    .map((c) => (
      <Marker
        key={c.label}
        position={[c.lat, c.lng]}
        icon={labelIcon(c.label, c.label === 'Occupied Palestine' ? 'is-palestine' : c.label === 'Pakistan' ? 'is-home' : '')}
        interactive={false}
        keyboard={false}
      />
    ))
}

function DetailPanel({ conflict, updatedAt, onClose }) {
  if (!conflict) return null
  const years = Object.entries(conflict.fatalitiesByYear || {})
  return (
    <aside className="ca-panel" aria-label={`${conflict.name} details`}>
      <div className="ca-panel-head">
        <span className={`ca-tier ca-tier-${conflict.tier}`}>{conflict.intensity}</span>
        <button type="button" className="ca-close" onClick={onClose} aria-label="Close details">
          ×
        </button>
      </div>
      <h3>{conflict.name}</h3>
      <dl className="ca-facts">
        <div>
          <dt>Started</dt>
          <dd>{conflict.started || 'Not recorded'}</dd>
        </div>
        <div>
          <dt>Where</dt>
          <dd>{conflict.countries.join(', ')}</dd>
        </div>
        {conflict.sides?.length ? (
          <div>
            <dt>Sides named</dt>
            <dd>{conflict.sides.join(' · ')}</dd>
          </div>
        ) : null}
        <div>
          <dt>Casualties</dt>
          <dd>
            {conflict.cumulativeFatalities ? <strong>{conflict.cumulativeFatalities} in total</strong> : 'Not recorded'}
            {years.length ? (
              <span className="ca-years">{years.map(([y, v]) => `${y}: ${v}`).join(' · ')}</span>
            ) : null}
          </dd>
        </div>
      </dl>
      {conflict.summary ? <p className="ca-summary">{conflict.summary}</p> : null}
      {conflict.includes?.length ? (
        <div className="ca-block">
          <h4>Includes</h4>
          <ul className="ca-includes">
            {conflict.includes.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="ca-block">
        <h4>Latest news</h4>
        {conflict.news?.length ? (
          <ul className="ca-news">
            {conflict.news.map((n) => (
              <li key={n.url}>
                <a href={n.url} target="_blank" rel="noopener noreferrer">
                  {n.title}
                </a>
                <span>
                  {n.source}
                  {n.date ? ` · ${n.date}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ca-muted">No English headlines in the last 7 days.</p>
        )}
      </div>
      <div className="ca-block ca-sources">
        <h4>Sources</h4>
        <p>
          {conflict.sources.map((s, i) => (
            <span key={s.url}>
              {i ? ' · ' : ''}
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label}
              </a>
            </span>
          ))}
        </p>
        <p className="ca-muted">Last updated {formatDate(updatedAt)}</p>
      </div>
    </aside>
  )
}

export default function ConflictAtlas({ compact = false }) {
  const theme = useTheme()
  const [countries, setCountries] = useState([])
  const [outlines, setOutlines] = useState(null)
  const [vector, setVector] = useState('loading')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [showConflicts, setShowConflicts] = useState(false)
  const [tiers, setTiers] = useState(() => new Set(TIERS.map((t) => t.id)))
  const [selectedId, setSelectedId] = useState(null)
  const [zoom, setZoom] = useState(3)
  const [map, setMap] = useState(null)
  const isPhone = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch('/data/world-countries.json', { cache: 'force-cache' }).then((r) => r.json()),
      fetch('/data/world-110m.geojson', { cache: 'force-cache' }).then((r) => r.json()),
      fetch('/data/conflicts.json', { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error('missing')
        return r.json()
      }),
    ])
      .then(([world, geo, conflicts]) => {
        if (cancelled) return
        setCountries(world.countries || [])
        setOutlines(geo)
        setData(conflicts)
      })
      .catch(() => {
        if (!cancelled) setError('Conflict data could not be loaded. Please try again later.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(
    () => (showConflicts && data ? data.conflicts.filter((c) => tiers.has(c.intensity)) : []),
    [showConflicts, data, tiers],
  )
  const selected = data?.conflicts.find((c) => c.id === selectedId) || null

  const toggleTier = (id) =>
    setTiers((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const focus = (c) => {
    setShowConflicts(true)
    setSelectedId(c.id)
    map?.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 4), { duration: 0.8 })
  }

  return (
    <div className={`ca-shell ${compact ? 'is-compact' : ''}`}>
      <div className="ca-toolbar">
        <button
          type="button"
          className={`btn ${showConflicts ? 'btn-secondary' : 'btn-primary'} ca-toggle`}
          onClick={() => {
            setShowConflicts(!showConflicts)
            if (showConflicts) setSelectedId(null)
          }}
          disabled={!data}
          aria-pressed={showConflicts}
        >
          <span className="ca-toggle-dot" aria-hidden="true" />
          {showConflicts ? 'Hide conflicts' : `View conflicts${data ? ` (${data.conflicts.length})` : ''}`}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => map?.flyTo(PAKISTAN, isPhone ? 2 : 3, { duration: 0.8 })}>
          Centre on Pakistan
        </button>
        {data ? <span className="ca-updated">Updated {formatDate(data.updatedAt)}</span> : null}
      </div>

      {showConflicts ? (
        <div className="ca-filters" role="group" aria-label="Filter by intensity">
          {TIERS.map((t, i) => {
            const count = data?.conflicts.filter((c) => c.intensity === t.id).length || 0
            return (
              <button
                type="button"
                key={t.id}
                className={`ca-filter ca-filter-${i} ${tiers.has(t.id) ? 'is-on' : ''}`}
                onClick={() => toggleTier(t.id)}
                aria-pressed={tiers.has(t.id)}
                title={t.hint}
              >
                <span aria-hidden="true" />
                {t.label} ({count})
              </button>
            )
          })}
        </div>
      ) : null}

      {error ? <p className="ca-error">{error}</p> : null}

      <div className="ca-stage">
        <MapContainer
          center={PAKISTAN}
          zoom={isPhone ? 2 : 3}
          minZoom={2}
          maxZoom={14}
          worldCopyJump={false}
          maxBounds={[[-75, -200], [85, 220]]}
          maxBoundsViscosity={0.8}
          zoomSnap={0.5}
          className="ca-map"
          attributionControl
        >
          <MapHandle onReady={setMap} />
          <ZoomWatcher onZoom={setZoom} />
          <VectorBase theme={theme} onStatus={setVector} />
          {outlines && vector === 'failed' ? (
            <GeoJSON key={`all-${theme}`} data={outlines} style={countryStyle(theme)} interactive={false} attribution={MAP_ATTRIBUTION} />
          ) : null}
          {outlines && vector !== 'failed' && zoom <= 6 ? (
            <GeoJSON
              key={`home-${theme}`}
              data={{ ...outlines, features: outlines.features.filter((f) => f.properties.n === 'Pakistan') }}
              style={() => ({ color: '#c9a227', weight: 1.6, fillColor: '#f2d56b', fillOpacity: theme === 'dark' ? 0.1 : 0.16 })}
              interactive={false}
            />
          ) : null}
          {vector === 'failed' ? <CountryLabels countries={countries} zoom={zoom} /> : null}
          {visible.map((c) => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={conflictIcon(c.tier, c.id === selectedId)}
              title={c.name}
              eventHandlers={{ click: () => setSelectedId(c.id) }}
              zIndexOffset={1000 - c.tier * 100}
            />
          ))}
        </MapContainer>
        {!showConflicts && data ? (
          <button type="button" className="ca-hint" onClick={() => setShowConflicts(true)}>
            Press <strong>View conflicts</strong> to show {data.conflicts.length} ongoing conflicts worldwide
          </button>
        ) : null}
        <DetailPanel conflict={selected} updatedAt={data?.updatedAt} onClose={() => setSelectedId(null)} />
      </div>

      {data && showConflicts ? (
        <details className="ca-list">
          <summary>All {visible.length} conflicts shown on the map, as a list</summary>
          <ol>
            {visible.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => focus(c)}>
                  <span className={`ca-tier ca-tier-${c.tier}`}>{c.intensity}</span>
                  <strong>{c.name}</strong>
                  <span className="ca-muted">
                    {c.countries.slice(0, 3).join(', ')}
                    {c.cumulativeFatalities ? ` · ${c.cumulativeFatalities} deaths` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      <p className="ca-credit">
        Conflict list, dates and casualty figures from{' '}
        <a href="https://en.wikipedia.org/wiki/List_of_ongoing_armed_conflicts" target="_blank" rel="noopener noreferrer">
          Wikipedia&apos;s List of ongoing armed conflicts
        </a>
        ; sides from Wikidata; headlines from the GDELT Project and Google News. Refreshed automatically every 6 hours. Figures are estimates
        and may be disputed.
      </p>
    </div>
  )
}
