import * as MapLibreRN from '@maplibre/maplibre-react-native'
import { Position } from '@turf/helpers'
import React, { PropsWithChildren, useMemo } from 'react'
import Config from '@utils/config'
import { mapLayers } from './mapLayers'
import {
  INITIAL_MAP_VIEW_STATE,
  MAP_CONTAINER_STYLE,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
} from './utils'

const Map: React.FC<
  PropsWithChildren<{
    map?: React.RefObject<MapLibreRN.MapRef | null>
    camera?: React.RefObject<MapLibreRN.CameraRef | null>
    centerCoordinate?: Position
    mapProps?: Omit<
      React.ComponentProps<typeof MapLibreRN.Map>,
      'children' | 'mapStyle'
    >
    cameraProps?: React.ComponentProps<typeof MapLibreRN.Camera>
  }>
> = ({
  children,
  map,
  camera,
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
    <MapLibreRN.Map
      ref={map}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      style={MAP_CONTAINER_STYLE}
      logo={false}
      touchPitch={false}
      attribution={false}
      touchRotate={false}
      mapStyle={mapStyle}
      {...mapProps}
    >
      <MapLibreRN.Camera
        ref={camera}
        initialViewState={{
          center: (centerCoordinate ||
            INITIAL_MAP_VIEW_STATE.centerCoordinate) as MapLibreRN.LngLat,
          zoom: INITIAL_MAP_VIEW_STATE.zoomLevel,
        }}
        minZoom={MIN_MAP_ZOOM}
        maxZoom={MAX_MAP_ZOOM}
        {...cameraProps}
        duration={2000}
        easing="ease"
      />
      <MapLibreRN.UserLocation />
      {children}
    </MapLibreRN.Map>
  )
}

export default Map
