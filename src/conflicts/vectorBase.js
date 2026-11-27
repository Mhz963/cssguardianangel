// Detailed basemap for the Conflict Atlas: OpenFreeMap vector tiles (OpenStreetMap data, no key)
// rendered by MapLibre inside the Leaflet map. Cities, regions, roads and water appear as you zoom in.
// Labels are rewritten to English, and Israel is labelled "Occupied Palestine" (site editorial choice).
import 'maplibre-gl/dist/maplibre-gl.css'
import { setWorkerUrl } from 'maplibre-gl'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
// Vite bundles MapLibre's worker into one standalone file; tell MapLibre where it is.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

setWorkerUrl(workerUrl)

// Liberty is full-colour with clear roads and labels; it reads well in both site themes.
const STYLE_URL = { light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/liberty' }
export const VECTOR_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · &copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · Data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'

const ISRAEL = ['Israel', 'ישראל', 'إسرائيل', 'Israël']
const PALESTINE = ['Palestine', 'Palestinian Territories', 'State of Palestine', 'Palestinian Territory', 'فلسطين']

const english = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']]
const anyName = (list) => [
  'any',
  ['in', ['coalesce', ['get', 'name:en'], ''], ['literal', list]],
  ['in', ['coalesce', ['get', 'name:latin'], ''], ['literal', list]],
  ['in', ['coalesce', ['get', 'name'], ''], ['literal', list]],
]

const styleCache = {}

function isCountryLayer(layer) {
  const id = layer.id.toLowerCase()
  if (id.includes('country')) return true
  const f = JSON.stringify(layer.filter || '')
  return f.includes('"country"')
}

export async function loadStyle(theme) {
  if (styleCache[theme]) return styleCache[theme]
  const res = await fetch(STYLE_URL[theme])
  if (!res.ok) throw new Error('style')
  const style = await res.json()
  style.layers = style.layers.map((layer) => {
    const textField = layer.layout?.['text-field']
    if (layer.type !== 'symbol' || !textField || JSON.stringify(textField).includes('"ref"')) return layer
    const next = { ...layer, layout: { ...layer.layout, 'text-field': ['case', anyName(ISRAEL), 'Occupied Palestine', english] } }
    if (isCountryLayer(layer)) {
      const hidePalestine = ['!', anyName(PALESTINE)]
      next.filter = layer.filter ? ['all', layer.filter, hidePalestine] : hidePalestine
    }
    return next
  })
  styleCache[theme] = style
  return style
}

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export function createVectorLayer(style) {
  return maplibreGL({ style, attribution: VECTOR_ATTRIBUTION, interactive: false })
}
