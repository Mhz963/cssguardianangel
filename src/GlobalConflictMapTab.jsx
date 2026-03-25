import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Rectangle, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { formatNewsTimestamp } from './utils/formatNewsTimestamp.js'

export default function GlobalConflictMapTab() {
  const normalizeCountryDisplayName = (value) => {
    const raw = String(value || '').trim()
    if (raw.toLowerCase() === 'israel') return 'Occupied Palestine'
    return raw
  }
  const [showConflicts, setShowConflicts] = useState(false)
  const [countries, setCountries] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const loadConflicts = async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const res = await fetch('/api/global-conflicts')
      if (!res.ok) throw new Error(`Conflict API returned ${res.status}`)
      const data = await res.json()
      const nextCountries = Array.isArray(data?.countries)
        ? data.countries.map((country) => ({
            ...country,
            country: normalizeCountryDisplayName(country.country),
            conflicts: Array.isArray(country.conflicts)
              ? country.conflicts.map((conflict) => ({
                  ...conflict,
                  countryName: normalizeCountryDisplayName(
                    conflict.countryName || conflict.country || country.country,
                  ),
                }))
              : [],
          }))
        : []
      setCountries(nextCountries)
      if (nextCountries.length === 0) setLoadError('No conflict data returned right now. Please try again.')
    } catch (error) {
      if (error?.name === 'AbortError') return
      setLoadError(error?.message || 'Unable to load conflict map data.')
    } finally {
      setIsLoading(false)
    }
  }

  const allConflicts = countries.flatMap((country) =>
    (country.conflicts || []).map((conflict) => ({
      ...conflict,
      countryName: country.country,
    })),
  )

  const openCountryConflict = (country) => {
    setSelectedCountry(country)
    setSelectedConflict((country?.conflicts || [])[0] || null)
  }

  const OccupiedPalestineMask = () => {
    const map = useMap()
    const [zoomLevel, setZoomLevel] = useState(map.getZoom())

    useEffect(() => {
      const syncZoomLevel = () => setZoomLevel(map.getZoom())
      map.on('zoomend', syncZoomLevel)
      return () => map.off('zoomend', syncZoomLevel)
    }, [map])

    const getMaskByZoom = (zoom) => {
      if (zoom <= 3) {
        return {
          bounds: [
            [30.4, 34.0],
            [31.75, 35.95],
          ],
          center: [31.03, 35.0],
        }
      }
      if (zoom === 4) {
        return {
          bounds: [
            [30.55, 34.25],
            [31.55, 35.75],
          ],
          center: [31.06, 34.99],
        }
      }
      if (zoom === 5) {
        return {
          bounds: [
            [30.72, 34.48],
            [31.42, 35.56],
          ],
          center: [31.09, 35.0],
        }
      }
      return {
        bounds: [
          [30.84, 34.62],
          [31.34, 35.4],
        ],
        center: [31.09, 35.0],
      }
    }

    const mask = getMaskByZoom(zoomLevel)
    return (
      <>
        <Rectangle
          bounds={mask.bounds}
          pathOptions={{
            color: '#e6ddcb',
            weight: 0,
            fillColor: '#f1eadb',
            fillOpacity: 0.98,
          }}
        />
        <CircleMarker center={mask.center} radius={1} pathOptions={{ opacity: 0, fillOpacity: 0 }}>
          <Tooltip permanent direction="center" className="occupied-palestine-overlay-label">
            Occupied Palestine
          </Tooltip>
        </CircleMarker>
      </>
    )
  }

  return (
    <section className="global-map-shell">
      <div className="global-map-head glass-panel">
        <div>
          <h3>Global Map</h3>
          <p>Track major conflict hotspots and open each marker for a concise situation brief.</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            const next = !showConflicts
            setShowConflicts(next)
            if (next) {
              setSelectedCountry(null)
              setSelectedConflict(null)
              loadConflicts()
            }
          }}
        >
          {showConflicts ? 'Hide Global Conflicts' : 'View Global Conflicts'}
        </button>
      </div>

      {isLoading ? <p className="global-map-note">Loading live conflict data...</p> : null}
      {loadError ? <p className="global-map-note error">{loadError}</p> : null}

      <div className="global-map-board glass-panel">
        <MapContainer
          center={[30.3753, 69.3451]}
          zoom={5}
          minZoom={2}
          maxZoom={8}
          worldCopyJump
          className="global-leaflet-map"
        >
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, Garmin, GeoTechnologies, Inc, USGS, METI/NASA'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          <CircleMarker
            center={[30.3753, 69.3451]}
            radius={7}
            pathOptions={{ color: '#f2d56b', weight: 2, fillColor: '#f2d56b', fillOpacity: 0.35 }}
          />
          <OccupiedPalestineMask />
          {showConflicts
            ? countries.map((country) => (
                <CircleMarker
                  key={country.countryId}
                  center={[country.lat, country.lon]}
                  radius={8}
                  pathOptions={{ color: '#ef4444', weight: 2, fillColor: '#ef4444', fillOpacity: 0.72 }}
                  eventHandlers={{ click: () => openCountryConflict(country) }}
                />
              ))
            : null}
        </MapContainer>
      </div>

      {showConflicts ? (
        <div className="global-conflict-list">
          {allConflicts.map((conflict) => (
            <button
              key={`${conflict.id}_${conflict.countryName || conflict.country || ''}`}
              type="button"
              className="global-conflict-item"
              onClick={() => {
                const country = countries.find((item) => item.country === conflict.countryName)
                if (country) setSelectedCountry(country)
                setSelectedConflict(conflict)
              }}
            >
              <strong>{conflict.title}</strong>
              <span>{conflict.countryName}</span>
            </button>
          ))}
        </div>
      ) : null}

      {selectedConflict ? (
        <div
          className="global-conflict-modal-overlay"
          role="presentation"
          onClick={() => {
            setSelectedConflict(null)
            setSelectedCountry(null)
          }}
        >
          <article
            className="global-conflict-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedConflict.title} details`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="global-conflict-modal-close"
              type="button"
              aria-label="Close conflict details"
              onClick={() => {
                setSelectedConflict(null)
                setSelectedCountry(null)
              }}
            >
              ×
            </button>
            <div className="global-conflict-modal-content">
              <h4>{selectedConflict.title}</h4>
              <p className="global-conflict-modal-meta">
                <strong>{selectedConflict.countryName || selectedConflict.country || selectedCountry?.country}</strong>
              </p>
              <p>{selectedConflict.summary}</p>
              <p>
                <strong>Started:</strong>{' '}
                {selectedConflict.startedAt ? formatNewsTimestamp(selectedConflict.startedAt) : 'Unknown'}
              </p>
              {selectedConflict.articleUrl ? (
                <a className="btn btn-secondary" href={selectedConflict.articleUrl} target="_blank" rel="noreferrer">
                  Read source
                </a>
              ) : null}
              {selectedCountry?.conflicts?.length > 1 ? (
                <div className="global-conflict-modal-list">
                  <p>
                    <strong>Other conflicts in this country:</strong>
                  </p>
                  <div>
                    {selectedCountry.conflicts.map((conflict) => (
                      <button
                        key={conflict.id}
                        type="button"
                        className="global-conflict-modal-list-btn"
                        onClick={() =>
                          setSelectedConflict({
                            ...conflict,
                            countryName: selectedCountry.country,
                          })
                        }
                      >
                        {conflict.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setSelectedConflict(null)
                  setSelectedCountry(null)
                }}
              >
                Close
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}
