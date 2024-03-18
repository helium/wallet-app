import { Box, FabButton } from '@components'
import useMount from '@hooks/useMount'
import MapLibreGL from '@maplibre/maplibre-react-native'
import { Position } from '@turf/helpers'
import React, { PropsWithChildren, useCallback, useRef } from 'react'
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
    centerCoordinate?: Position
  }>
> = ({ children, centerCoordinate }) => {
  const camera = useRef<MapLibreGL.Camera>(null)
  const userLocation = useRef<MapLibreGL.UserLocation>(null)

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

  const handleUserLocationPress = useCallback(() => {
    if (camera?.current && userLocation?.current?.state.coordinates) {
      camera.current.setCamera({
        animationDuration: 500,
        zoomLevel: MAX_MAP_ZOOM,
        centerCoordinate: userLocation.current.state.coordinates,
      })
    }
  }, [userLocation, camera])

  return (
    <Box
      flexGrow={1}
      justifyContent="center"
      alignItems="center"
      borderRadius="l"
      backgroundColor="white"
      overflow="hidden"
      position="relative"
    >
      <MapLibreGL.MapView
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        style={MAP_CONTAINER_STYLE}
        logoEnabled={false}
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
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        position="absolute"
        bottom={8}
        right={8}
      >
        <FabButton
          icon="mapUserLocation"
          backgroundColor="white"
          backgroundColorOpacity={0.3}
          backgroundColorOpacityPressed={0.5}
          width={36}
          height={36}
          justifyContent="center"
          onPress={handleUserLocationPress}
        />
      </Box>
    </Box>
  )
}

export default Map
