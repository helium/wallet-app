import { ReAnimatedBox } from '@components/AnimatedBox'
import { DelayedFadeIn } from '@components/FadeInOut'
import SafeAreaBox from '@components/SafeAreaBox'
import globalStyles from '@theme/globalStyles'
import React from 'react'
import { useTranslation } from 'react-i18next'
import MapView, { UrlTile } from 'react-native-maps'
import Config from 'react-native-config'
import { Edge } from 'react-native-safe-area-context'
import Box from '@components/Box'
import { mapLayers } from './mapLayers'

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
            style={{ flex: 1, width: '100%' }}
            customMapStyle={mapLayers}
          >
            <UrlTile
              // urlTemplate={`${Config.PMTILES_URL}/{z}/{x}/{y}.mvt`}
              urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
              style={{ width: '100%', height: '100%' }}
            />
          </MapView>
        </Box>
      </SafeAreaBox>
    </ReAnimatedBox>
  )
}

export default HotspotMapScreen
