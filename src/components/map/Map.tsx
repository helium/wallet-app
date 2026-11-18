import * as MapLibreRN from '@maplibre/maplibre-react-native'
import { Position } from '@turf/helpers'
import React, { PropsWithChildren, useCallback, useMemo, useRef } from 'react'
import { Platform } from 'react-native'
import Config from 'react-native-config'
import { mapLayers } from './mapLayers'
import {
  INITIAL_MAP_VIEW_STATE,
  MAP_CONTAINER_STYLE,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
} from './utils'

type MapViewProps = React.ComponentProps<typeof MapLibreRN.MapView>

const Map: React.FC<
  PropsWithChildren<{
    map?: React.RefObject<MapLibreRN.MapViewRef | null>
    camera?: React.RefObject<MapLibreRN.CameraRef | null>
    onUserLocationUpdate?: (userLocation: MapLibreRN.Location) => void
    centerCoordinate?: Position
    mapProps?: Omit<MapViewProps, 'children'>
    cameraProps?: React.ComponentProps<typeof MapLibreRN.Camera>
  }>
> = ({
  children,
  map,
  camera,
  onUserLocationUpdate,
  centerCoordinate,
  mapProps = {},
  cameraProps = {},
}) => {
  const ownCamera = useRef<MapLibreRN.CameraRef>(null)
  const cameraRef = camera || ownCamera
  const { onRegionDidChange } = mapProps

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

  // On Android, maplibre-react-native 10 keeps the last camera stop and
  // replays it after the user pans, so the map snaps back
  // (maplibre/maplibre-react-native#1402). Move that stop to where the user
  // left the map, so a replay does not move it.
  const handleRegionDidChange = useCallback<
    NonNullable<MapViewProps['onRegionDidChange']>
  >(
    (feature) => {
      if (Platform.OS === 'android' && feature.properties.isUserInteraction) {
        cameraRef.current?.setCamera({
          centerCoordinate: feature.geometry.coordinates,
          zoomLevel: feature.properties.zoomLevel,
          animationDuration: 0,
        })
      }
      onRegionDidChange?.(feature)
    },
    [cameraRef, onRegionDidChange],
  )

  return (
    <MapLibreRN.MapView
      ref={map}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      style={MAP_CONTAINER_STYLE}
      logoEnabled={false}
      pitchEnabled={false}
      attributionEnabled={false}
      rotateEnabled={false}
      mapStyle={mapStyle}
      {...mapProps}
      onRegionDidChange={handleRegionDidChange}
    >
      <MapLibreRN.Camera
        ref={cameraRef}
        defaultSettings={{
          ...INITIAL_MAP_VIEW_STATE,
          centerCoordinate:
            centerCoordinate || INITIAL_MAP_VIEW_STATE.centerCoordinate,
        }}
        minZoomLevel={MIN_MAP_ZOOM}
        maxZoomLevel={MAX_MAP_ZOOM}
        {...cameraProps}
        animationDuration={2000}
        animationMode="easeTo"
      />
      <MapLibreRN.UserLocation onUpdate={onUserLocationUpdate} />
      {children}
    </MapLibreRN.MapView>
  )
}

export default Map
