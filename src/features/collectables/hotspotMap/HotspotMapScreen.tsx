import { ReAnimatedBox } from '@components/AnimatedBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import globalStyles from '@theme/globalStyles'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MapLibreGL, { MapView, Camera } from '@maplibre/maplibre-react-native'
// import Config from 'react-native-config'
import { Edge } from 'react-native-safe-area-context'
import Box from '@components/Box'
// import { mapLayers } from './mapLayers'

// Will be null for most users (only Mapbox authenticates this way).
// Required on Android. See Android installation notes.
MapLibreGL.setAccessToken(null)

const defaultCamera = {
  centerCoordinate: [-74.005974, 40.712776],
  zoomLevel: 13,
}

const HotspotMapScreen = () => {
  const { t } = useTranslation()
  const safeEdges: Edge[] = ['top']

  /* const mapStyle: MapStyle = {
    version: 8,
    sources: {
      protomaps: {
        type: 'vector',
        tiles: [`${Config.PMTILES_URL}/{z}/{x}/{y}.mvt`],
      },
    },
    glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
    layers: mapLayers,
  } */

  // urlTemplate={`${Config.PMTILES_URL}/{z}/{x}/{y}.mvt`}
  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <SafeAreaBox edges={safeEdges} flex={1}>
        <Box
          flexGrow={1}
          justifyContent="center"
          alignItems="center"
          borderRadius="l"
          backgroundColor="white"
          overflow="hidden"
          position="relative"
        >
          <MapView
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
            }}
          >
            <Camera defaultSettings={defaultCamera} />
          </MapView>
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default HotspotMapScreen
