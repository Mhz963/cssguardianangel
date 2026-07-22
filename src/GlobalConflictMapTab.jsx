import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Rectangle, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

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

export default function GlobalConflictMapTab() {
  return (
    <section className="global-map-shell">
      <div className="global-map-head glass-panel">
        <div>
          <h3>Global Map</h3>
          <p>Explore regional geography with Pakistan centered on the map.</p>
        </div>
      </div>

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
        </MapContainer>
      </div>
    </section>
  )
}
