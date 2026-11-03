// MapLibre takes colours as values, not classes, and reads the style once,
// so these are the world-theme.css tokens as hex.
const COLORS = {
  land: '#f5f5f5', // --secondary
  natural: '#edfdf3', // --success-50
  runway: '#e5e5e5', // --border
  water: '#d1d1d6', // --placeholder-subtle
  road: '#b5b5b5', // --off-white-foreground-faint
  boundary: '#a0a0ab', // --quinary-400
  label: '#575757', // --off-white-foreground
  labelHalo: '#ffffff', // --background
}

export const mapLayers: { [key: string]: unknown }[] = [
  {
    id: 'land',
    type: 'background',
    layout: {},
    paint: {
      'background-color': COLORS.land,
    },
  },
  {
    id: 'natural_features',
    type: 'fill',
    source: 'protomaps',
    'source-layer': 'natural',
    filter: [
      'any',
      ['==', 'natural', 'wood'],
      ['==', 'leisure', 'nature_reserve'],
      ['==', 'landuse', 'forest'],
      ['==', 'natural', 'glacier'],
      ['==', 'natural', 'sand'],
    ],
    paint: {
      'fill-color': COLORS.natural,
    },
  },
  {
    id: 'transit_runway',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'transit',
    filter: ['has', 'aeroway'],
    paint: {
      'line-color': COLORS.runway,
      'line-width': 6,
    },
  },
  {
    id: 'landuse_runway',
    type: 'fill',
    source: 'protomaps',
    'source-layer': 'landuse',
    filter: [
      'any',
      ['==', 'aeroway', 'runway'],
      ['==', 'area:aeroway', 'runway'],
      ['==', 'area:aeroway', 'taxiway'],
    ],
    paint: {
      'fill-color': COLORS.runway,
    },
  },
  {
    id: 'water',
    type: 'fill',
    source: 'protomaps',
    'source-layer': 'water',
    paint: {
      'fill-color': COLORS.water,
    },
  },
  {
    id: 'roads_other',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'roads',
    filter: ['==', 'pmap:kind', 'other'],
    paint: {
      'line-color': COLORS.road,
      'line-dasharray': [2, 1],
      'line-width': [
        'interpolate',
        ['exponential', 1.6],
        ['zoom'],
        14,
        0,
        14.5,
        0.5,
        20,
        12,
      ],
    },
  },
  {
    id: 'roads_minor',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'roads',
    filter: ['==', 'pmap:kind', 'minor_road'],
    paint: {
      'line-color': COLORS.road,
      'line-width': [
        'interpolate',
        ['exponential', 1.6],
        ['zoom'],
        12,
        0,
        12.5,
        0.5,
        20,
        32,
      ],
    },
  },
  {
    id: 'roads_medium',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'roads',
    filter: ['==', 'pmap:kind', 'medium_road'],
    paint: {
      'line-color': COLORS.road,
      'line-width': [
        'interpolate',
        ['exponential', 1.6],
        ['zoom'],
        7,
        0,
        7.5,
        0.5,
        20,
        32,
      ],
    },
  },
  {
    id: 'roads_major',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'roads',
    filter: ['==', 'pmap:kind', 'major_road'],
    paint: {
      'line-color': COLORS.road,
      'line-width': [
        'interpolate',
        ['exponential', 1.6],
        ['zoom'],
        7,
        0,
        7.5,
        0.5,
        19,
        32,
      ],
    },
  },
  {
    id: 'roads_highway',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'roads',
    filter: ['==', 'pmap:kind', 'highway'],
    paint: {
      'line-color': COLORS.road,
      'line-width': [
        'interpolate',
        ['exponential', 1.6],
        ['zoom'],
        3,
        0,
        3.5,
        0.5,
        18,
        32,
      ],
    },
  },
  {
    id: 'boundaries_country',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'boundaries',
    filter: ['<=', 'pmap:min_admin_level', 2],
    paint: {
      'line-color': COLORS.boundary,
      'line-width': 1.5,
    },
  },
  {
    id: 'boundaries',
    type: 'line',
    source: 'protomaps',
    'source-layer': 'boundaries',
    filter: ['>', 'pmap:min_admin_level', 2],
    paint: {
      'line-color': COLORS.boundary,
      'line-width': 1,
      'line-dasharray': [1, 2],
    },
  },
  {
    id: 'roads_labels',
    type: 'symbol',
    source: 'protomaps',
    'source-layer': 'roads',
    layout: {
      'symbol-placement': 'line',
      'text-font': ['NotoSans-Regular'],
      'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
      'text-letter-spacing': 0.01,
      'text-size': 12,
    },
    paint: {
      'text-color': COLORS.label,
    },
  },
  {
    id: 'places_city',
    type: 'symbol',
    source: 'protomaps',
    'source-layer': 'places',
    filter: ['==', 'pmap:kind', 'city'],
    layout: {
      'text-field': '{name:en}',
      'text-font': ['NotoSans-Regular'],
      'text-size': ['step', ['get', 'pmap:rank'], 0, 1, 12, 2, 10],
      'text-variable-anchor': ['bottom-left'],
      'text-radial-offset': 0.2,
    },
    paint: {
      'text-color': COLORS.label,
      'text-halo-color': COLORS.labelHalo,
      'text-halo-width': 1,
    },
  },
  {
    id: 'places_state',
    type: 'symbol',
    source: 'protomaps',
    'source-layer': 'places',
    filter: ['==', 'pmap:kind', 'state'],
    layout: {
      'text-field': '{name:en}',
      'text-font': ['NotoSans-Regular'],
      'text-size': 14,
      'text-radial-offset': 0.2,
      'text-anchor': 'center',
      'text-transform': 'uppercase',
      'text-letter-spacing': 0.1,
    },
    paint: {
      'text-color': COLORS.label,
      'text-halo-color': COLORS.labelHalo,
      'text-halo-width': 1,
    },
  },
  {
    id: 'places_country',
    type: 'symbol',
    source: 'protomaps',
    'source-layer': 'places',
    filter: ['==', 'place', 'country'],
    layout: {
      'text-field': '{name:en}',
      'text-font': ['NotoSans-Regular'],
      'text-size': 10,
    },
    paint: {
      'text-color': COLORS.label,
      'text-halo-color': COLORS.labelHalo,
      'text-halo-width': 1,
    },
  },
]
