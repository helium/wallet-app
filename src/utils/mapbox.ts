import MapboxGL from '@rnmapbox/maps'

export const MIN_MAP_ZOOM = 2
export const MAX_MAP_ZOOM = 14
export const MIN_HEXES_ZOOM = 7
export const MIN_HEX_LABELS_ZOOM = 11
export const POINTS_AND_HEXES_OVERLAP = 2
export const WORLD_BOUNDS = {
  ne: [-134.827109, 57.785781],
  sw: [129.767893, -30.955724],
}

export const getHexFillStyle = (color: string): MapboxGL.FillLayerStyle => ({
  'fill-color': color,
  'fill-opacity': 0.4,
})

export const getBlurredPointStyle = (
  color: string,
): MapboxGL.CircleLayerStyle => ({
  'circle-color': color,
  'circle-opacity': [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    MIN_MAP_ZOOM,
    0.05,
    MIN_HEXES_ZOOM + POINTS_AND_HEXES_OVERLAP,
    0.4,
  ],
  'circle-radius': [
    'interpolate',
    ['exponential', 2],
    ['zoom'],
    MIN_MAP_ZOOM,
    3,
    MIN_HEXES_ZOOM + POINTS_AND_HEXES_OVERLAP,
    2,
  ],
})

export const getHexOutlineStyle = (
  theme: string | undefined,
): MapboxGL.LineLayerStyle => ({
  'line-color': theme === 'dark' ? '#fff' : 'rgb(113,113,122)',
  'line-width': 4,
})

export const getHexLabelStyle = (
  theme: string | undefined,
): MapboxGL.SymbolLayerStyle => ({
  'text-opacity': ['case', ['==', ['get', 'count'], 1], 0, 0.85],
  'text-color': theme === 'dark' ? 'rgb(19,24,37)' : 'gray',
})

export const hexLabelLayout: MapboxGL.SymbolLayerStyle = {
  'text-field': ['get', 'count'],
  'text-allow-overlap': false,
  'text-size': 23,
}
