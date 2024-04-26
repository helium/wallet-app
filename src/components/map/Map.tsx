import MapLibreGL from '@maplibre/maplibre-react-native'
import { Position } from '@turf/helpers'
import React, { PropsWithChildren, useMemo } from 'react'
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
    mapProps?: Omit<React.ComponentProps<typeof MapLibreGL.MapView>, 'children'>
    cameraProps?: React.ComponentProps<typeof MapLibreGL.Camera>
  }>
> = ({
  children,
  map,
  camera,
  userLocation,
  centerCoordinate,
  mapProps = {},
  cameraProps = {},
}) => {
  const mapStyle: string = useMemo(
    () =>
      JSON.stringify({
        version: 8,
        sources: {
          protomaps: {
            type: 'vector',
            tiles: [`${Config.PMTILES_URL}/{z}/{x}/{y}.mvt`],
          },
        },
        glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
        layers: mapLayers,
      }),
    [],
  )

  return (
    <MapLibreGL.MapView
      ref={map}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      style={MAP_CONTAINER_STYLE}
      logoEnabled={false}
      pitchEnabled={false}
      attributionEnabled={false}
      rotateEnabled={false}
      styleJSON={mapStyle}
      {...mapProps}
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
        {...cameraProps}
      />
      <MapLibreGL.UserLocation ref={userLocation} />
      {children}
    </MapLibreGL.MapView>
  )
}

export default Map
