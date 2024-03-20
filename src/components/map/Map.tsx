import useMount from '@hooks/useMount'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { Position } from '@turf/helpers'
import React, { PropsWithChildren } from 'react'
import Config from 'react-native-config'
import { mapLayers } from './mapLayers'
import {
  INITIAL_MAP_VIEW_STATE,
  MAP_CONTAINER_STYLE,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
} from './utils'

const Map: React.FC<
  PropsWithChildren<{
    map?: React.RefObject<MapLibreGL.MapView>
    camera?: React.RefObject<MapLibreGL.Camera>
    userLocation?: React.RefObject<MapLibreGL.UserLocation>
    centerCoordinate?: Position
  }>
> = ({ children, map, camera, userLocation, centerCoordinate }) => {
  useMount(() => {
    // Will be null for most users (only Mapbox authenticates this way).
    // Required on Android. See Android installation notes.
    MapLibreGL.setAccessToken(null)
  })

  const mapStyle: string = JSON.stringify({
    version: 8,
    sources: {
      protomaps: {
        type: 'vector',
        tiles: [`${Config.PMTILES_URL}/{z}/{x}/{y}.mvt`],
      },
    },
    glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
    layers: mapLayers,
  })

  return (
    <MapLibreGL.MapView
      ref={map}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      style={MAP_CONTAINER_STYLE}
      logoEnabled={false}
      attributionEnabled={false}
      rotateEnabled={false}
      styleJSON={mapStyle}
    >
      <MapLibreGL.Camera
        ref={camera}
        defaultSettings={{
          ...INITIAL_MAP_VIEW_STATE,
          centerCoordinate:
            centerCoordinate || INITIAL_MAP_VIEW_STATE.centerCoordinate,
        }}
        minZoomLevel={MIN_MAP_ZOOM}
        maxZoomLevel={MAX_MAP_ZOOM}
      />
      <MapLibreGL.UserLocation ref={userLocation} />
      {children}
    </MapLibreGL.MapView>
  )
}

export default Map
